import React, { useState, useEffect, useMemo } from "react";
import { Search, Plus, X, Database, PinIcon, User, Trash2, Loader2, Pencil, Check, Upload } from "lucide-react";

// ---------- Design tokens ----------
const C = {
  ink: "#15171A",
  panel: "#1F2226",
  panelRaised: "#282B30",
  line: "#34373C",
  steel: "#9AA0A8",
  chalk: "#EFEBE1",
  red: "#C1272D",
  redDeep: "#7A1519",
  amber: "#E8A33D",
  amberDeep: "#8A5A17",
};

const GLOBAL_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
@keyframes fsv-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

const display = { fontFamily: "'Barlow Condensed', sans-serif" };
const body = { fontFamily: "'IBM Plex Sans', sans-serif" };
const mono = { fontFamily: "'IBM Plex Mono', monospace" };

// ---------- Local storage helpers (Stage 1: single device) ----------
const LS_CATALOG = "fsv-catalog";
const LS_COLLECTION = "fsv-collection";
const LS_PROFILE = "fsv-profile";

function loadJSON(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

// ---------- Badge color lookup ----------
const BADGE_COLORS = {
  356: ["#9BA4AD", "#5C636B"],
  911: ["#C1272D", "#7A1519"],
  917: ["#1E5FA8", "#0E3A6B"],
  935: ["#22252A", "#0B0C0E"],
  959: ["#E9E9E4", "#B7B8B1"],
  964: ["#C1272D", "#7A1519"],
  993: ["#E8A33D", "#8A5A17"],
  918: ["#15171A", "#34373C"],
  RR: ["#E8A33D", "#8A5A17"],
  TC: ["#2FA6A6", "#175C5C"],
};
const FALLBACKS = [
  ["#7C8B99", "#43505C"],
  ["#B0562F", "#6E3419"],
  ["#4C6E4E", "#2A3F2B"],
];
function badgeColors(code) {
  if (BADGE_COLORS[code]) return BADGE_COLORS[code];
  let h = 0;
  for (const ch of String(code)) h = (h * 31 + ch.charCodeAt(0)) % FALLBACKS.length;
  return FALLBACKS[h];
}

// ---------- Seed catalog ----------
const SEED_CATALOG = [
  { id: "s1", chassisCode: "356", name: "356 Speedster Silhouette", series: "Design Icons", year: 2023, variant: "Silver / Black", editionSize: "750", notes: "Traces the profile of the original 1954 Speedster.", imageUrl: "", addedBy: "Starter Catalog" },
  { id: "s2", chassisCode: "911", name: '911 Carrera RS 2.7 "Carrera Script"', series: "Design Icons", year: 2023, variant: "Grand Prix White / Blutorange", editionSize: "1000", notes: "", imageUrl: "", addedBy: "Starter Catalog" },
  { id: "s3", chassisCode: "917", name: "917 K Le Mans Winner", series: "Motorsport Legends", year: 2022, variant: "Gulf Blue / Orange", editionSize: "500", notes: "", imageUrl: "", addedBy: "Starter Catalog" },
  { id: "s4", chassisCode: "959", name: "959 Paris-Dakar", series: "Motorsport Legends", year: 2022, variant: "White / Red / Blue", editionSize: "500", notes: "", imageUrl: "", addedBy: "Starter Catalog" },
  { id: "s5", chassisCode: "935", name: '935 "Moby Dick"', series: "Motorsport Legends", year: 2024, variant: "Martini Racing", editionSize: "400", notes: "", imageUrl: "", addedBy: "Starter Catalog" },
  { id: "s6", chassisCode: "964", name: "964 Turbo 3.6", series: "Design Icons", year: 2024, variant: "Guards Red", editionSize: "800", notes: "", imageUrl: "", addedBy: "Starter Catalog" },
  { id: "s7", chassisCode: "993", name: "993 GT2 Evo", series: "Design Icons", year: 2025, variant: "Speed Yellow", editionSize: "600", notes: "", imageUrl: "", addedBy: "Starter Catalog" },
  { id: "s8", chassisCode: "RR", name: "Rennsport Reunion 7 Event Pin", series: "Rennsport Reunion", year: 2025, variant: "Laguna Seca Enamel", editionSize: "2000", notes: "", imageUrl: "", addedBy: "Starter Catalog" },
  { id: "s9", chassisCode: "918", name: "918 Spyder Weissach", series: "Design Icons", year: 2023, variant: "Martini Racing Livery", editionSize: "300", notes: "", imageUrl: "", addedBy: "Starter Catalog" },
  { id: "s10", chassisCode: "TC", name: "Taycan Turbo GT Launch Pin", series: "Modern Era", year: 2024, variant: "Frozen Blue Metallic", editionSize: "1500", notes: "", imageUrl: "", addedBy: "Starter Catalog" },
];

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---------- Photo upload (resize + inline as data URL) ----------
function resizeImageFile(file, maxDim = 1000, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Couldn't read that image."));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// ---------- Badge ----------
function PinBadge({ code, size = 56 }) {
  const [c1, c2] = badgeColors(code);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "9999px",
        background: `linear-gradient(155deg, ${c1} 0%, ${c2} 100%)`,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.12), 0 3px 8px rgba(0,0,0,0.45)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "12%",
          left: "18%",
          width: "38%",
          height: "26%",
          borderRadius: "9999px",
          background: "radial-gradient(ellipse at center, rgba(255,255,255,0.55), rgba(255,255,255,0) 70%)",
        }}
      />
      <span
        style={{
          ...mono,
          color: "#F5F3ED",
          fontSize: size * 0.24,
          fontWeight: 600,
          letterSpacing: "0.02em",
          textShadow: "0 1px 2px rgba(0,0,0,0.5)",
        }}
      >
        {code}
      </span>
    </div>
  );
}

// ---------- Small UI atoms ----------
function Chip({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...mono,
        fontSize: 12,
        padding: "6px 12px",
        borderRadius: 9999,
        border: `1px solid ${active ? C.amber : C.line}`,
        background: active ? "rgba(232,163,61,0.12)" : "transparent",
        color: active ? C.amber : C.steel,
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={{ ...mono, fontSize: 11, color: C.steel, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </span>
      <div style={{ marginTop: 6 }}>{children}</div>
    </label>
  );
}

function ImageField({ value, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      onChange(await resizeImageFile(file));
    } catch {
      setError("Couldn't load that photo — try a different file.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Field label="Photo">
      {value && (
        <div style={{ position: "relative", marginBottom: 8 }}>
          <img src={value} alt="" style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 8, background: C.panelRaised }} />
          <button
            type="button"
            onClick={() => onChange("")}
            style={{ position: "absolute", top: 6, right: 6, width: 26, height: 26, borderRadius: 9999, background: "rgba(21,23,26,0.75)", border: `1px solid ${C.line}`, color: C.chalk, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X size={13} />
          </button>
        </div>
      )}
      <label
        style={{
          ...mono, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: C.steel,
          border: `1px dashed ${C.line}`, borderRadius: 8, padding: "8px 12px", cursor: "pointer",
        }}
      >
        <Upload size={13} />
        {busy ? "Processing…" : value ? "Replace photo" : "Upload photo"}
        <input type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
      </label>
      {error && <div style={{ ...mono, fontSize: 11, color: "#F0A0A3", marginTop: 6 }}>{error}</div>}
    </Field>
  );
}

const inputStyle = {
  ...body,
  width: "100%",
  background: C.ink,
  border: `1px solid ${C.line}`,
  borderRadius: 8,
  padding: "10px 12px",
  color: C.chalk,
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box",
};

function ProgressBar({ percent }) {
  return (
    <div style={{ height: 10, background: C.line, borderRadius: 9999, overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          width: `${Math.min(100, Math.max(0, percent))}%`,
          background: `linear-gradient(90deg, ${C.amberDeep}, ${C.amber})`,
          transition: "width 0.3s ease",
          borderRadius: 9999,
        }}
      />
    </div>
  );
}

// ---------- Main App ----------
export default function App() {
  const [tab, setTab] = useState("catalog");
  const [catalog, setCatalog] = useState([]);
  const [collection, setCollection] = useState([]);
  const [profile, setProfile] = useState({ displayName: "" });
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [seriesFilter, setSeriesFilter] = useState("All");

  const [showAddCatalog, setShowAddCatalog] = useState(false);
  const [addCollectionFor, setAddCollectionFor] = useState(null); // catalogId or "pick"
  const [detailPinId, setDetailPinId] = useState(null);

  useEffect(() => {
    const cat = loadJSON(LS_CATALOG, null);
    if (cat) {
      setCatalog(cat);
    } else {
      setCatalog(SEED_CATALOG);
      saveJSON(LS_CATALOG, SEED_CATALOG);
    }
    setCollection(loadJSON(LS_COLLECTION, []));
    setProfile(loadJSON(LS_PROFILE, { displayName: "" }));
    setLoading(false);
  }, []);

  function flash(msg) {
    setNotice(msg);
    setTimeout(() => setNotice(""), 2500);
  }

  function saveCatalog(next) {
    setCatalog(next);
    if (!saveJSON(LS_CATALOG, next)) flash("Couldn't save — your browser storage may be full.");
  }
  function saveCollection(next) {
    setCollection(next);
    if (!saveJSON(LS_COLLECTION, next)) flash("Couldn't save — your browser storage may be full.");
  }
  function saveProfile(next) {
    setProfile(next);
    saveJSON(LS_PROFILE, next);
  }

  const seriesList = useMemo(() => ["All", ...Array.from(new Set(catalog.map((p) => p.series)))], [catalog]);

  const filteredCatalog = useMemo(() => {
    return catalog.filter((p) => {
      const matchesSeries = seriesFilter === "All" || p.series === seriesFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.chassisCode.toLowerCase().includes(q) ||
        p.series.toLowerCase().includes(q);
      return matchesSeries && matchesSearch;
    });
  }, [catalog, seriesFilter, search]);

  const stats = useMemo(() => {
    const ownedIds = new Set(collection.map((c) => c.catalogId));
    const totalCatalog = catalog.length;
    const owned = ownedIds.size;
    const missing = Math.max(0, totalCatalog - owned);
    const percent = totalCatalog > 0 ? Math.round((owned / totalCatalog) * 100) : 0;
    const distinctSeries = new Set(
      collection.map((c) => catalog.find((p) => p.id === c.catalogId)?.series).filter(Boolean)
    ).size;
    return { owned, totalCatalog, missing, percent, distinctSeries };
  }, [collection, catalog]);

  function upsertCatalogPin(updatedPin) {
    const next = catalog.map((p) => (p.id === updatedPin.id ? updatedPin : p));
    saveCatalog(next);
    flash("Catalog entry updated.");
  }
  function addCollectionEntry(entry) {
    const next = [...collection, { ...entry, id: genId() }];
    saveCollection(next);
    flash("Added to your garage.");
  }
  function updateCollectionEntry(entryId, fields) {
    const next = collection.map((c) => (c.id === entryId ? { ...c, ...fields } : c));
    saveCollection(next);
  }
  function removeCollectionEntry(entryId) {
    saveCollection(collection.filter((c) => c.id !== entryId));
    flash("Removed from your garage.");
  }

  if (loading) {
    return (
      <div style={{ ...body, background: C.ink, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.steel }}>
        <style>{GLOBAL_STYLE}</style>
        <Loader2 size={22} style={{ marginRight: 8, animation: "fsv-spin 1s linear infinite" }} />
        Loading vault…
      </div>
    );
  }

  const detailPin = detailPinId ? catalog.find((p) => p.id === detailPinId) : null;
  const detailEntry = detailPin ? collection.find((c) => c.catalogId === detailPin.id) : null;

  return (
    <div style={{ ...body, background: C.ink, minHeight: "100vh", color: C.chalk }}>
      <style>{GLOBAL_STYLE}</style>
      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative" }}>
        {/* Header */}
        <div style={{ position: "sticky", top: 0, zIndex: 20, background: C.ink, borderBottom: `1px solid ${C.line}`, padding: "16px 16px 12px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <div style={{ ...display, fontSize: 25, fontWeight: 800, letterSpacing: "0.01em", lineHeight: 1 }}>FLAT SIX VAULT</div>
              <div style={{ ...mono, fontSize: 10, color: C.amber, letterSpacing: "0.18em", marginTop: 4 }}>
                ENAMEL PIN LEDGER
              </div>
            </div>
            <button
              onClick={() => setTab("profile")}
              style={{
                width: 34, height: 34, borderRadius: 9999, background: C.panel,
                border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center",
                color: C.steel,
              }}
              aria-label="Profile"
            >
              <User size={16} />
            </button>
          </div>
        </div>

        {notice && (
          <div style={{ ...mono, fontSize: 11, background: "rgba(193,39,45,0.15)", color: "#F0A0A3", padding: "8px 16px", borderBottom: `1px solid ${C.line}` }}>
            {notice}
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, paddingBottom: 90 }}>
          {tab === "catalog" && (
            <CatalogTab
              filtered={filteredCatalog}
              search={search}
              setSearch={setSearch}
              seriesList={seriesList}
              seriesFilter={seriesFilter}
              setSeriesFilter={setSeriesFilter}
              onAdd={() => setShowAddCatalog(true)}
              onAddToCollection={(id) => setAddCollectionFor(id)}
              onOpenDetail={(id) => setDetailPinId(id)}
            />
          )}
          {tab === "collection" && (
            <CollectionTab
              catalog={catalog}
              collection={collection}
              stats={stats}
              onAdd={() => setAddCollectionFor("pick")}
              onOpenDetail={(catalogId) => setDetailPinId(catalogId)}
            />
          )}
          {tab === "profile" && (
            <ProfileTab profile={profile} saveProfile={saveProfile} catalog={catalog} stats={stats} />
          )}
        </div>

        {/* Bottom nav */}
        <div
          style={{
            position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
            width: "100%", maxWidth: 480, background: C.panel, borderTop: `1px solid ${C.line}`,
            display: "flex", paddingBottom: "env(safe-area-inset-bottom, 0px)", zIndex: 30,
          }}
        >
          <NavButton icon={Database} label="Catalog" active={tab === "catalog"} onClick={() => setTab("catalog")} />
          <NavButton icon={PinIcon} label="Garage" active={tab === "collection"} onClick={() => setTab("collection")} />
          <NavButton icon={User} label="Profile" active={tab === "profile"} onClick={() => setTab("profile")} />
        </div>

        {/* Modals */}
        {showAddCatalog && (
          <AddCatalogModal
            onClose={() => setShowAddCatalog(false)}
            onSave={(pin) => {
              const next = [...catalog, { ...pin, id: genId(), addedBy: profile.displayName || "Collector", addedAt: new Date().toISOString() }];
              saveCatalog(next);
              setShowAddCatalog(false);
              flash("Added to the catalog.");
            }}
          />
        )}
        {addCollectionFor && (
          <AddCollectionModal
            catalog={catalog}
            initialCatalogId={addCollectionFor !== "pick" ? addCollectionFor : null}
            onClose={() => setAddCollectionFor(null)}
            onSave={(entry) => {
              addCollectionEntry(entry);
              setAddCollectionFor(null);
            }}
          />
        )}
        {detailPin && (
          <PinDetailModal
            pin={detailPin}
            entry={detailEntry}
            onClose={() => setDetailPinId(null)}
            onSaveCatalogEdit={upsertCatalogPin}
            onAddToGarage={(fields) => addCollectionEntry({ catalogId: detailPin.id, ...fields })}
            onUpdateGarageEntry={(fields) => detailEntry && updateCollectionEntry(detailEntry.id, fields)}
            onRemoveFromGarage={() => {
              if (detailEntry) removeCollectionEntry(detailEntry.id);
              setDetailPinId(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

function NavButton({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        padding: "10px 0 8px", color: active ? C.amber : C.steel, background: "transparent", border: "none",
      }}
    >
      <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
      <span style={{ ...mono, fontSize: 10, letterSpacing: "0.06em" }}>{label}</span>
    </button>
  );
}

// ---------- Catalog Tab ----------
function CatalogTab({ filtered, search, setSearch, seriesList, seriesFilter, setSeriesFilter, onAdd, onAddToCollection, onOpenDetail }) {
  return (
    <div style={{ padding: "14px 16px" }}>
      <div style={{ position: "relative", marginBottom: 12 }}>
        <Search size={16} color={C.steel} style={{ position: "absolute", left: 12, top: 12 }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search the parts catalog…"
          style={{ ...inputStyle, paddingLeft: 36 }}
        />
      </div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, marginBottom: 14 }}>
        {seriesList.map((s) => (
          <Chip key={s} active={seriesFilter === s} onClick={() => setSeriesFilter(s)}>
            {s}
          </Chip>
        ))}
      </div>

      {filtered.length === 0 && (
        <EmptyState title="No pins match." body="Try a different search, or add the pin you're looking for." />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((pin) => (
          <button
            key={pin.id}
            onClick={() => onOpenDetail(pin.id)}
            style={{ textAlign: "left", background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 12, display: "flex", gap: 12, cursor: "pointer" }}
          >
            <PinBadge code={pin.chassisCode} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...display, fontSize: 18, fontWeight: 700, lineHeight: 1.15, color: "#FFFFFF" }}>{pin.name}</div>
              <div style={{ height: 10 }} />
              <div style={{ ...body, fontSize: 13, color: C.steel, marginTop: 4 }}>
                {pin.series} · {pin.year} · {pin.variant}
              </div>
              {pin.editionSize && (
                <div style={{ ...mono, fontSize: 11, color: C.steel, marginTop: 2 }}>Edition of {pin.editionSize}</div>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <span
                  role="button"
                  onClick={(e) => { e.stopPropagation(); onAddToCollection(pin.id); }}
                  style={{
                    ...mono, fontSize: 11, letterSpacing: "0.04em", color: C.ink, background: C.amber,
                    border: "none", borderRadius: 7, padding: "6px 10px", display: "inline-flex", alignItems: "center", gap: 4,
                  }}
                >
                  <Plus size={13} /> ADD TO GARAGE
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={onAdd}
        style={{
          ...mono, marginTop: 16, width: "100%", padding: "12px 0", borderRadius: 10,
          border: `1px dashed ${C.line}`, color: C.steel, background: "transparent", fontSize: 12, letterSpacing: "0.05em",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}
      >
        <Plus size={14} /> NEW CATALOG ENTRY
      </button>
    </div>
  );
}

// ---------- Collection Tab ----------
function CollectionTab({ catalog, collection, stats, onAdd, onOpenDetail }) {
  return (
    <div style={{ padding: "14px 16px" }}>
      <div style={{ background: C.panelRaised, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <span style={{ ...mono, fontSize: 10, color: C.steel, letterSpacing: "0.08em" }}>COLLECTION PROGRESS</span>
          <span style={{ ...mono, fontSize: 13, color: C.amber, fontWeight: 600 }}>{stats.percent}%</span>
        </div>
        <ProgressBar percent={stats.percent} />
        <div style={{ ...body, fontSize: 12, color: C.steel, marginTop: 8 }}>
          {stats.owned} of {stats.totalCatalog} pins collected
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
          <StatBlock label="OWNED" value={stats.owned} />
          <StatBlock label="SERIES" value={stats.distinctSeries} />
          <StatBlock label="TO COMPLETE" value={stats.missing} />
        </div>
      </div>

      {collection.length === 0 && (
        <EmptyState title="Your garage is empty." body="Add your first pin from the catalog to start tracking it." />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {collection.map((entry) => {
          const pin = catalog.find((p) => p.id === entry.catalogId);
          if (!pin) return null;
          return (
            <button
              key={entry.id}
              onClick={() => onOpenDetail(pin.id)}
              style={{ textAlign: "left", background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 12, display: "flex", gap: 12, cursor: "pointer" }}
            >
              <PinBadge code={pin.chassisCode} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...display, fontSize: 18, fontWeight: 700, lineHeight: 1.15, color: "#FFFFFF" }}>{pin.name}</div>
                <div style={{ ...body, fontSize: 13, color: C.steel, marginTop: 4 }}>
                  {pin.series} · {pin.year}
                </div>
                <div style={{ ...mono, fontSize: 11, color: C.amber, marginTop: 4 }}>
                  Qty {entry.quantity}{entry.notes ? ` · ${entry.notes}` : ""}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={onAdd}
        style={{
          ...mono, marginTop: 16, width: "100%", padding: "12px 0", borderRadius: 10,
          border: "none", color: C.ink, background: C.amber, fontSize: 12, letterSpacing: "0.05em",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}
      >
        <Plus size={14} /> ADD TO GARAGE
      </button>
    </div>
  );
}

function StatBlock({ label, value }) {
  return (
    <div>
      <div style={{ ...mono, fontSize: 10, color: C.steel, letterSpacing: "0.08em" }}>{label}</div>
      <div style={{ ...mono, fontSize: 22, fontWeight: 600, color: C.chalk, marginTop: 2 }}>{value}</div>
    </div>
  );
}

// ---------- Profile Tab ----------
function ProfileTab({ profile, saveProfile, catalog, stats }) {
  const [name, setName] = useState(profile.displayName || "");
  const contributions = catalog.filter((p) => p.addedBy === (profile.displayName || "__none__") && profile.displayName).length;

  return (
    <div style={{ padding: "14px 16px" }}>
      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <Field label="Display name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => saveProfile({ ...profile, displayName: name.trim() })}
            placeholder="e.g. Jordan"
            style={inputStyle}
          />
        </Field>
        <div style={{ ...body, fontSize: 12, color: C.steel }}>
          This gets attached to any catalog entries you add.
        </div>
      </div>

      <div style={{ background: C.panelRaised, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between" }}>
        <StatBlock label="PINS OWNED" value={stats.owned} />
        <StatBlock label="CONTRIBUTED" value={contributions} />
      </div>

      <div style={{ ...body, fontSize: 12, color: C.steel, marginTop: 16, lineHeight: 1.5 }}>
        Stage 1 build: everything is stored on this device's browser only. Sharing the catalog and your
        garage across devices comes with Stage 2 (real accounts).
      </div>
    </div>
  );
}

// ---------- Empty state ----------
function EmptyState({ title, body: b }) {
  return (
    <div style={{ border: `1px dashed ${C.line}`, borderRadius: 12, padding: "28px 16px", textAlign: "center", marginBottom: 14 }}>
      <div style={{ ...display, fontSize: 18, fontWeight: 700 }}>{title}</div>
      <div style={{ ...body, fontSize: 13, color: C.steel, marginTop: 4 }}>{b}</div>
    </div>
  );
}

// ---------- Pin Detail Modal (view / edit / garage controls) ----------
function PinDetailModal({ pin, entry, onClose, onSaveCatalogEdit, onAddToGarage, onUpdateGarageEntry, onRemoveFromGarage }) {
  const [editMode, setEditMode] = useState(false);
  const [f, setF] = useState({ ...pin });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const [qty, setQty] = useState(entry ? entry.quantity : 1);
  const [notes, setNotes] = useState(entry ? entry.notes || "" : "");

  useEffect(() => {
    setF({ ...pin });
  }, [pin]);

  function saveEdit() {
    onSaveCatalogEdit({ ...f, year: Number(f.year) || f.year });
    setEditMode(false);
  }

  return (
    <ModalShell title={editMode ? "Edit Pin" : "Pin Details"} onClose={onClose}>
      {!editMode && (
        <>
          {pin.imageUrl ? (
            <img
              src={pin.imageUrl}
              alt={pin.name}
              style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 10, marginBottom: 14, background: C.panelRaised }}
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : (
            <div style={{ display: "flex", justifyContent: "center", padding: "18px 0", marginBottom: 6 }}>
              <PinBadge code={pin.chassisCode} size={96} />
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <div style={{ ...display, fontSize: 22, fontWeight: 700, lineHeight: 1.15, color: "#FFFFFF" }}>{pin.name}</div>
            <button onClick={() => setEditMode(true)} style={{ background: C.panelRaised, border: `1px solid ${C.line}`, borderRadius: 8, padding: 6, color: C.steel, flexShrink: 0, marginLeft: 8 }}>
              <Pencil size={14} />
            </button>
          </div>
          <div style={{ height: 12, marginBottom: 8 }} />
          <div style={{ ...body, fontSize: 14, color: C.chalk, marginBottom: 4 }}>
            {pin.series} · {pin.year} · {pin.variant}
          </div>
          {pin.editionSize && <div style={{ ...mono, fontSize: 12, color: C.steel, marginBottom: 8 }}>Edition of {pin.editionSize}</div>}
          {pin.notes && <div style={{ ...body, fontSize: 13, color: C.steel, lineHeight: 1.5, marginTop: 8 }}>{pin.notes}</div>}
          <div style={{ ...mono, fontSize: 10, color: C.steel, marginTop: 10 }}>Added by {pin.addedBy || "Collector"}</div>

          <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 16, paddingTop: 16 }}>
            {entry ? (
              <>
                <div style={{ ...mono, fontSize: 11, color: C.amber, letterSpacing: "0.06em", marginBottom: 10 }}>IN YOUR GARAGE</div>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <Field label="Quantity">
                      <input type="number" min="1" style={inputStyle} value={qty} onChange={(e) => setQty(e.target.value)} onBlur={() => onUpdateGarageEntry({ quantity: Number(qty) || 1 })} />
                    </Field>
                  </div>
                </div>
                <Field label="Notes">
                  <textarea style={{ ...inputStyle, minHeight: 50, resize: "vertical" }} value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => onUpdateGarageEntry({ notes })} />
                </Field>
                <button
                  onClick={onRemoveFromGarage}
                  style={{ ...mono, width: "100%", padding: "10px 0", borderRadius: 10, border: `1px solid ${C.redDeep}`, color: "#F0A0A3", background: "transparent", fontSize: 12, letterSpacing: "0.05em", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                >
                  <Trash2 size={13} /> REMOVE FROM GARAGE
                </button>
              </>
            ) : (
              <>
                <div style={{ ...mono, fontSize: 11, color: C.steel, letterSpacing: "0.06em", marginBottom: 10 }}>NOT IN YOUR GARAGE</div>
                <div style={{ flex: 1 }}>
                  <Field label="Quantity">
                    <input type="number" min="1" style={inputStyle} value={qty} onChange={(e) => setQty(e.target.value)} />
                  </Field>
                </div>
                <Field label="Notes">
                  <textarea style={{ ...inputStyle, minHeight: 50, resize: "vertical" }} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </Field>
                <SaveBar disabled={false} onSave={() => onAddToGarage({ quantity: Number(qty) || 1, notes })} label="Add to garage" />
              </>
            )}
          </div>
        </>
      )}

      {editMode && (
        <>
          <Field label="Chassis / model code"><input style={inputStyle} value={f.chassisCode} onChange={set("chassisCode")} /></Field>
          <Field label="Pin name"><input style={inputStyle} value={f.name} onChange={set("name")} /></Field>
          <Field label="Series"><input style={inputStyle} value={f.series} onChange={set("series")} /></Field>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}><Field label="Year"><input style={inputStyle} value={f.year} onChange={set("year")} inputMode="numeric" /></Field></div>
            <div style={{ flex: 1 }}><Field label="Edition size"><input style={inputStyle} value={f.editionSize} onChange={set("editionSize")} /></Field></div>
          </div>
          <Field label="Colorway / variant"><input style={inputStyle} value={f.variant} onChange={set("variant")} /></Field>
          <ImageField value={f.imageUrl} onChange={(v) => setF({ ...f, imageUrl: v })} />
          <Field label="Description / notes"><textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={f.notes} onChange={set("notes")} /></Field>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setEditMode(false)} style={{ ...mono, flex: 1, padding: "12px 0", borderRadius: 10, border: `1px solid ${C.line}`, color: C.steel, background: "transparent", fontSize: 12, letterSpacing: "0.05em" }}>
              CANCEL
            </button>
            <button onClick={saveEdit} style={{ ...mono, flex: 1, padding: "12px 0", borderRadius: 10, border: "none", color: C.ink, background: C.amber, fontSize: 12, letterSpacing: "0.05em", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Check size={14} /> SAVE
            </button>
          </div>
        </>
      )}
    </ModalShell>
  );
}

// ---------- Add Catalog Modal ----------
function AddCatalogModal({ onClose, onSave }) {
  const [f, setF] = useState({ chassisCode: "", name: "", series: "", year: "", variant: "", editionSize: "", notes: "", imageUrl: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const canSave = f.chassisCode && f.name && f.series && f.year;

  return (
    <ModalShell title="New Catalog Entry" onClose={onClose}>
      <Field label="Chassis / model code"><input style={inputStyle} value={f.chassisCode} onChange={set("chassisCode")} placeholder="911" /></Field>
      <Field label="Pin name"><input style={inputStyle} value={f.name} onChange={set("name")} placeholder="911 GT3 RS Launch Pin" /></Field>
      <Field label="Series"><input style={inputStyle} value={f.series} onChange={set("series")} placeholder="Motorsport Legends" /></Field>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Field label="Year"><input style={inputStyle} value={f.year} onChange={set("year")} placeholder="2025" inputMode="numeric" /></Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Edition size"><input style={inputStyle} value={f.editionSize} onChange={set("editionSize")} placeholder="500" /></Field>
        </div>
      </div>
      <Field label="Colorway / variant"><input style={inputStyle} value={f.variant} onChange={set("variant")} placeholder="Guards Red / Silver" /></Field>
      <ImageField value={f.imageUrl} onChange={(v) => setF({ ...f, imageUrl: v })} />
      <Field label="Description / notes"><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={f.notes} onChange={set("notes")} /></Field>

      <SaveBar disabled={!canSave} onSave={() => onSave({ ...f, year: Number(f.year) || f.year })} label="Add to catalog" />
    </ModalShell>
  );
}

// ---------- Add Collection Modal (pick from catalog) ----------
function AddCollectionModal({ catalog, initialCatalogId, onClose, onSave }) {
  const [catalogId, setCatalogId] = useState(initialCatalogId || "");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [pickerSearch, setPickerSearch] = useState("");

  const pin = catalog.find((p) => p.id === catalogId);
  const canSave = !!catalogId;

  const pickerResults = catalog.filter((p) => p.name.toLowerCase().includes(pickerSearch.toLowerCase()));

  return (
    <ModalShell title="Add to Garage" onClose={onClose}>
      {!pin && (
        <Field label="Find a pin">
          <input style={inputStyle} placeholder="Search catalog…" value={pickerSearch} onChange={(e) => setPickerSearch(e.target.value)} />
          <div style={{ maxHeight: 160, overflowY: "auto", marginTop: 8, border: `1px solid ${C.line}`, borderRadius: 8 }}>
            {pickerResults.map((p) => (
              <button
                key={p.id}
                onClick={() => setCatalogId(p.id)}
                style={{ ...body, display: "block", width: "100%", textAlign: "left", padding: "8px 10px", background: "transparent", border: "none", borderBottom: `1px solid ${C.line}`, color: C.chalk, fontSize: 13 }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </Field>
      )}

      {pin && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", background: C.panelRaised, borderRadius: 10, padding: 10, marginBottom: 14 }}>
          <PinBadge code={pin.chassisCode} size={40} />
          <div>
            <div style={{ ...display, fontSize: 16, fontWeight: 700, color: "#FFFFFF" }}>{pin.name}</div>
            <div style={{ ...mono, fontSize: 11, color: C.steel }}>{pin.series} · {pin.year}</div>
          </div>
          {!initialCatalogId && (
            <button onClick={() => setCatalogId("")} style={{ marginLeft: "auto", background: "transparent", border: "none", color: C.steel }}>
              <X size={16} />
            </button>
          )}
        </div>
      )}

      <Field label="Quantity"><input style={inputStyle} type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></Field>
      <Field label="Notes"><textarea style={{ ...inputStyle, minHeight: 50, resize: "vertical" }} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>

      <SaveBar
        disabled={!canSave}
        onSave={() => onSave({ catalogId, quantity: Number(quantity) || 1, notes })}
        label="Add to garage"
      />
    </ModalShell>
  );
}

function SaveBar({ disabled, onSave, label }) {
  return (
    <button
      onClick={onSave}
      disabled={disabled}
      style={{
        ...mono, width: "100%", marginTop: 6, padding: "12px 0", borderRadius: 10, border: "none",
        background: disabled ? C.line : C.amber, color: disabled ? C.steel : C.ink, fontSize: 13, letterSpacing: "0.05em",
      }}
    >
      {label.toUpperCase()}
    </button>
  );
}

function ModalShell({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: C.ink, width: "100%", maxWidth: 480, maxHeight: "88vh", overflowY: "auto", borderTopLeftRadius: 18, borderTopRightRadius: 18, border: `1px solid ${C.line}`, borderBottom: "none", padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ ...display, fontSize: 22, fontWeight: 700 }}>{title}</div>
          <button onClick={onClose} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 9999, width: 30, height: 30, color: C.steel }}>
            <X size={15} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
