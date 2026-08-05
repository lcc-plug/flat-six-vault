import React, { useState, useEffect, useMemo, useRef } from "react";
import { Search, Plus, X, Database, PinIcon, User, Trash2, Loader2, Pencil, Check, Upload, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

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

// ---------- Seed catalog ----------
const SEED_CATALOG = [
  { id: "s1", chassisCode: "356", name: "356 Speedster Silhouette", series: "Design Icons", year: 2023, variant: "Silver / Black", editionSize: "750", notes: "Traces the profile of the original 1954 Speedster.", images: [], tags: "", addedBy: "Starter Catalog" },
  { id: "s2", chassisCode: "911", name: '911 Carrera RS 2.7 "Carrera Script"', series: "Design Icons", year: 2023, variant: "Grand Prix White / Blutorange", editionSize: "1000", notes: "", images: [], tags: "", addedBy: "Starter Catalog" },
  { id: "s3", chassisCode: "917", name: "917 K Le Mans Winner", series: "Motorsport Legends", year: 2022, variant: "Gulf Blue / Orange", editionSize: "500", notes: "", images: [], tags: "", addedBy: "Starter Catalog" },
  { id: "s4", chassisCode: "959", name: "959 Paris-Dakar", series: "Motorsport Legends", year: 2022, variant: "White / Red / Blue", editionSize: "500", notes: "", images: [], tags: "", addedBy: "Starter Catalog" },
  { id: "s5", chassisCode: "935", name: '935 "Moby Dick"', series: "Motorsport Legends", year: 2024, variant: "Martini Racing", editionSize: "400", notes: "", images: [], tags: "", addedBy: "Starter Catalog" },
  { id: "s6", chassisCode: "964", name: "964 Turbo 3.6", series: "Design Icons", year: 2024, variant: "Guards Red", editionSize: "800", notes: "", images: [], tags: "", addedBy: "Starter Catalog" },
  { id: "s7", chassisCode: "993", name: "993 GT2 Evo", series: "Design Icons", year: 2025, variant: "Speed Yellow", editionSize: "600", notes: "", images: [], tags: "", addedBy: "Starter Catalog" },
  { id: "s8", chassisCode: "RR", name: "Rennsport Reunion 7 Event Pin", series: "Rennsport Reunion", year: 2025, variant: "Laguna Seca Enamel", editionSize: "2000", notes: "", images: [], tags: "", addedBy: "Starter Catalog" },
  { id: "s9", chassisCode: "918", name: "918 Spyder Weissach", series: "Design Icons", year: 2023, variant: "Martini Racing Livery", editionSize: "300", notes: "", images: [], tags: "", addedBy: "Starter Catalog" },
  { id: "s10", chassisCode: "TC", name: "Taycan Turbo GT Launch Pin", series: "Modern Era", year: 2024, variant: "Frozen Blue Metallic", editionSize: "1500", notes: "", images: [], tags: "", addedBy: "Starter Catalog" },
];

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---------- Pin photo (uploaded image, or placeholder mark) ----------
const navBtnStyle = {
  position: "absolute", top: "50%", transform: "translateY(-50%)",
  width: 28, height: 28, borderRadius: 9999, background: "rgba(21,23,26,0.65)",
  border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
};

function PinPhoto({ pin, height = 160, width = "100%", radius = 10, grayscale = false, index = 0, onPrev, onNext, onExpand }) {
  const images = pin.images || [];
  const src = images[index];
  const showNav = images.length > 1 && (onPrev || onNext);
  return (
    <div
      style={{
        width, height, borderRadius: radius, overflow: "hidden", background: C.panelRaised, flexShrink: 0,
        position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
        cursor: onExpand && src ? "pointer" : undefined,
      }}
      onClick={onExpand && src ? onExpand : undefined}
    >
      {src ? (
        <img
          src={src}
          alt={pin.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", filter: grayscale ? "grayscale(1)" : "none", transition: "filter 0.25s ease" }}
        />
      ) : (
        <PinIcon size={Math.min(typeof height === "number" ? height * 0.32 : 40, 44)} color={C.line} strokeWidth={1.5} />
      )}
      {showNav && (
        <>
          <button type="button" onClick={(e) => { e.stopPropagation(); onPrev(); }} style={{ ...navBtnStyle, left: 8 }} aria-label="Previous photo">
            <ChevronLeft size={16} />
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onNext(); }} style={{ ...navBtnStyle, right: 8 }} aria-label="Next photo">
            <ChevronRight size={16} />
          </button>
          <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 4 }}>
            {images.map((_, i) => (
              <span key={i} style={{ width: 6, height: 6, borderRadius: 9999, background: i === index ? C.amber : "rgba(255,255,255,0.45)" }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------- Lightbox: expanded photo viewer ----------
function Lightbox({ images, index, grayscale, onIndexChange, onClose }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        style={{ position: "absolute", top: 16, right: 16, width: 36, height: 36, borderRadius: 9999, background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}
        aria-label="Close"
      >
        <X size={18} />
      </button>
      <img
        src={images[index]}
        alt=""
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "92vw", maxHeight: "80vh", objectFit: "contain", filter: grayscale ? "grayscale(1)" : "none", borderRadius: 8 }}
      />
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onIndexChange((index - 1 + images.length) % images.length); }}
            style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: 9999, background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}
            aria-label="Previous photo"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onIndexChange((index + 1) % images.length); }}
            style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: 9999, background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}
            aria-label="Next photo"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}
    </div>
  );
}

// ---------- Small UI atoms ----------
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

// ---------- Crop modal: fixed-ratio square crop with pan + zoom ----------
const CROP_VIEWPORT = 260;
const CROP_OUTPUT = 800;

function CropModal({ file, onCancel, onConfirm }) {
  const imgRef = useRef(null);
  const dragRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [objectUrl, setObjectUrl] = useState("");

  useEffect(() => {
    let url;
    try {
      url = URL.createObjectURL(file);
      setObjectUrl(url);
    } catch {
      setError("Couldn't open that file — try a different photo.");
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [file]);

  useEffect(() => {
    if (!objectUrl) return;
    const timeout = setTimeout(() => {
      setReady((r) => {
        if (!r) setError("This photo is taking too long to load — try a different one.");
        return r;
      });
    }, 12000);
    return () => clearTimeout(timeout);
  }, [objectUrl]);

  const baseScale = natural.w ? CROP_VIEWPORT / Math.min(natural.w, natural.h) : 1;
  const scale = baseScale * zoom;
  const dw = natural.w * scale;
  const dh = natural.h * scale;

  useEffect(() => {
    if (!ready) return;
    setPos({ x: (CROP_VIEWPORT - dw) / 2, y: (CROP_VIEWPORT - dh) / 2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, ready, natural.w, natural.h]);

  async function handleImgLoad(e) {
    const img = e.target;
    // Safari can fire `load` slightly before the image is fully decoded,
    // which produces a blank canvas.drawImage() result with no error. Wait
    // for an explicit decode so the crop always has real pixel data.
    try {
      if (img.decode) await img.decode();
    } catch {
      // decode() can reject even for images that render fine; fall through
      // and use the image as-is rather than blocking the user.
    }
    setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    setReady(true);
  }

  function handleImgError() {
    setError("Couldn't load that photo — it may be an unsupported format. Try a JPEG or PNG.");
  }

  function clamp(p) {
    const minX = CROP_VIEWPORT - dw, minY = CROP_VIEWPORT - dh;
    return {
      x: Math.min(0, Math.max(minX, p.x)),
      y: Math.min(0, Math.max(minY, p.y)),
    };
  }

  function onPointerDown(e) {
    dragRef.current = { startX: e.clientX, startY: e.clientY, origin: pos };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Some browsers can reject capture; dragging still works without it.
    }
  }
  function onPointerMove(e) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPos(clamp({ x: dragRef.current.origin.x + dx, y: dragRef.current.origin.y + dy }));
  }
  function onPointerUp() {
    dragRef.current = null;
  }

  function confirm() {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = CROP_OUTPUT;
      canvas.height = CROP_OUTPUT;
      const ctx = canvas.getContext("2d");
      const sx = -pos.x / scale;
      const sy = -pos.y / scale;
      const swh = CROP_VIEWPORT / scale;
      ctx.drawImage(imgRef.current, sx, sy, swh, swh, 0, 0, CROP_OUTPUT, CROP_OUTPUT);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.86);
      // A handful of browsers can produce a technically-valid but empty
      // result without throwing; catch that here instead of silently
      // handing back a blank photo.
      if (!dataUrl || dataUrl.length < 1000) {
        setError("That photo didn't come through — try again or pick a different one.");
        return;
      }
      onConfirm(dataUrl);
    } catch {
      setError("Couldn't process that photo — try a different one.");
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: C.ink, border: `1px solid ${C.line}`, borderRadius: 16, padding: 18, width: CROP_VIEWPORT + 36, boxSizing: "border-box" }}>
        <div style={{ ...display, fontSize: 18, fontWeight: 700, marginBottom: 4, color: "#FFFFFF" }}>Position photo</div>
        <div style={{ ...body, fontSize: 12, color: C.steel, marginBottom: 12 }}>Drag to reposition, use the slider to zoom.</div>
        <div
          style={{ width: CROP_VIEWPORT, height: CROP_VIEWPORT, overflow: "hidden", position: "relative", borderRadius: 12, background: "#000", touchAction: "none", cursor: "grab", margin: "0 auto" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {objectUrl && (
            <img
              ref={imgRef}
              src={objectUrl}
              onLoad={handleImgLoad}
              onError={handleImgError}
              draggable={false}
              alt=""
              style={{ position: "absolute", left: pos.x, top: pos.y, width: dw || "auto", height: dh || "auto", maxWidth: "none", userSelect: "none", pointerEvents: "none" }}
            />
          )}
          {!ready && !error && (
            <div style={{ ...mono, position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.steel }}>
              Loading…
            </div>
          )}
        </div>
        {error && <div style={{ ...mono, fontSize: 12, color: "#F0A0A3", marginTop: 10 }}>{error}</div>}
        <input
          type="range" min="1" max="3" step="0.01" value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          disabled={!ready}
          style={{ width: "100%", marginTop: 14 }}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button onClick={onCancel} style={{ ...mono, flex: 1, padding: "12px 0", borderRadius: 10, border: `1px solid ${C.line}`, color: C.steel, background: "transparent", fontSize: 12, letterSpacing: "0.05em" }}>
            CANCEL
          </button>
          <button onClick={confirm} disabled={!ready} style={{ ...mono, flex: 1, padding: "12px 0", borderRadius: 10, border: "none", color: C.ink, background: ready ? C.amber : C.line, fontSize: 12, letterSpacing: "0.05em" }}>
            USE PHOTO
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Photos field: multiple uploaded photos per pin ----------
function PhotosField({ images, onChange }) {
  const [pendingFile, setPendingFile] = useState(null);
  const lastAddRef = useRef(0);

  function handlePick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) setPendingFile(file);
  }
  function handleCropConfirm(dataUrl) {
    onChange([...(images || []), dataUrl]);
    lastAddRef.current = Date.now();
    // Deferred: on mobile Safari, a tap that closes this overlay can leave a
    // residual touch event that "falls through" onto whatever appears at the
    // same screen position underneath — in this case, the newly-added
    // thumbnail's remove button — instantly undoing the add. A short delay
    // lets that residual event settle on the (still-present) overlay instead.
    setTimeout(() => setPendingFile(null), 300);
  }
  function removeAt(i) {
    // Belt-and-suspenders: a stray tap landing on the remove button in the
    // instant right after an add (see handleCropConfirm above) shouldn't be
    // able to silently undo it.
    if (Date.now() - lastAddRef.current < 500) return;
    onChange(images.filter((_, idx) => idx !== i));
  }

  return (
    <Field label="Photos">
      {images && images.length > 0 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 8, paddingBottom: 2 }}>
          {images.map((src, i) => (
            <div key={i} style={{ position: "relative", flexShrink: 0 }}>
              <img src={src} alt="" style={{ width: 76, height: 76, objectFit: "cover", borderRadius: 8, background: C.panelRaised }} />
              <button
                type="button"
                onClick={() => removeAt(i)}
                style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: 9999, background: C.redDeep, border: `1px solid ${C.ink}`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
      <label
        style={{
          ...mono, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: C.steel,
          border: `1px dashed ${C.line}`, borderRadius: 8, padding: "8px 12px", cursor: "pointer",
        }}
      >
        <Upload size={13} />
        Add photo
        <input
          type="file"
          accept="image/*"
          onChange={handlePick}
          style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}
        />
      </label>
      {pendingFile && (
        <CropModal
          key={`${pendingFile.name}-${pendingFile.size}-${pendingFile.lastModified}`}
          file={pendingFile}
          onCancel={() => setPendingFile(null)}
          onConfirm={handleCropConfirm}
        />
      )}
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
  const [catalogFilter, setCatalogFilter] = useState("all");

  const [showAddCatalog, setShowAddCatalog] = useState(false);
  const [addCollectionFor, setAddCollectionFor] = useState(null); // catalogId or "pick"
  const [detailPinId, setDetailPinId] = useState(null);

  useEffect(() => {
    const cat = loadJSON(LS_CATALOG, null);
    if (cat) {
      // migrate legacy single imageUrl entries to the images array
      const normalized = cat.map((p) => {
        if (p.images) return p;
        const { imageUrl, ...rest } = p;
        return { ...rest, images: imageUrl ? [imageUrl] : [] };
      });
      setCatalog(normalized);
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

  const seriesOptions = useMemo(() => Array.from(new Set(catalog.map((p) => p.series).filter(Boolean))).sort(), [catalog]);
  const chassisOptions = useMemo(() => Array.from(new Set(catalog.map((p) => p.chassisCode).filter(Boolean))).sort(), [catalog]);

  const ownedIds = useMemo(() => new Set(collection.map((c) => c.catalogId)), [collection]);

  const filteredCatalog = useMemo(() => {
    return catalog.filter((p) => {
      let matchesFilter = true;
      if (catalogFilter === "missing") {
        matchesFilter = !ownedIds.has(p.id);
      } else if (catalogFilter.startsWith("series:")) {
        matchesFilter = p.series === catalogFilter.slice(7);
      } else if (catalogFilter.startsWith("chassis:")) {
        matchesFilter = p.chassisCode === catalogFilter.slice(8);
      }
      const q = search.trim().toLowerCase();
      const tagList = (p.tags || "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.chassisCode.toLowerCase().includes(q) ||
        p.series.toLowerCase().includes(q) ||
        tagList.some((t) => t.includes(q));
      return matchesFilter && matchesSearch;
    });
  }, [catalog, catalogFilter, search, ownedIds]);

  const stats = useMemo(() => {
    const totalCatalog = catalog.length;
    const owned = ownedIds.size;
    const missing = Math.max(0, totalCatalog - owned);
    const percent = totalCatalog > 0 ? Math.round((owned / totalCatalog) * 100) : 0;
    return { owned, totalCatalog, missing, percent };
  }, [catalog, ownedIds]);

  function upsertCatalogPin(updatedPin) {
    const next = catalog.map((p) => (p.id === updatedPin.id ? updatedPin : p));
    saveCatalog(next);
    flash("Catalog entry updated.");
  }
  function deleteCatalogPin(pinId) {
    saveCatalog(catalog.filter((p) => p.id !== pinId));
    saveCollection(collection.filter((c) => c.catalogId !== pinId));
    flash("Removed from the catalog.");
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
              ownedIds={ownedIds}
              search={search}
              setSearch={setSearch}
              seriesOptions={seriesOptions}
              chassisOptions={chassisOptions}
              catalogFilter={catalogFilter}
              setCatalogFilter={setCatalogFilter}
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
            onDeleteCatalogPin={() => {
              deleteCatalogPin(detailPin.id);
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
function CatalogTab({ filtered, ownedIds, search, setSearch, seriesOptions, chassisOptions, catalogFilter, setCatalogFilter, onAdd, onAddToCollection, onOpenDetail }) {
  return (
    <div style={{ padding: "14px 16px" }}>
      <div style={{ position: "relative", marginBottom: 12 }}>
        <Search size={16} color={C.steel} style={{ position: "absolute", left: 12, top: 12 }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search the pin ledger…"
          style={{ ...inputStyle, paddingLeft: 36 }}
        />
      </div>
      <div style={{ position: "relative", marginBottom: 14 }}>
        <select
          value={catalogFilter}
          onChange={(e) => setCatalogFilter(e.target.value)}
          style={{
            ...body, width: "100%", background: C.ink, border: `1px solid ${C.line}`, borderRadius: 8,
            padding: "10px 32px 10px 12px", color: C.chalk, fontSize: 14, outline: "none", boxSizing: "border-box",
            appearance: "none", WebkitAppearance: "none",
          }}
        >
          <option value="all">All Pins</option>
          <option value="missing">Missing From My Garage</option>
          <optgroup label="Series">
            {seriesOptions.map((s) => (
              <option key={`series:${s}`} value={`series:${s}`}>{s}</option>
            ))}
          </optgroup>
          <optgroup label="Chassis / Model">
            {chassisOptions.map((c) => (
              <option key={`chassis:${c}`} value={`chassis:${c}`}>{c}</option>
            ))}
          </optgroup>
        </select>
        <ChevronDown size={16} color={C.steel} style={{ position: "absolute", right: 12, top: 12, pointerEvents: "none" }} />
      </div>

      {filtered.length === 0 && (
        <EmptyState title="No pins match." body="Try a different search, or add the pin you're looking for." />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((pin) => {
          const owned = ownedIds.has(pin.id);
          return (
            <div
              key={pin.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpenDetail(pin.id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenDetail(pin.id); } }}
              style={{ textAlign: "left", background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden", cursor: "pointer", display: "flex", flexDirection: "column", width: "100%", boxSizing: "border-box" }}
            >
              <PinPhoto pin={pin} height={180} radius={0} grayscale={!owned} />
              <div style={{ padding: 12, textAlign: "center" }}>
                <div style={{ ...display, fontSize: 18, fontWeight: 700, lineHeight: 1.15, color: "#FFFFFF" }}>{pin.name}</div>
                <div style={{ height: 10 }} />
                <div style={{ ...body, fontSize: 13, color: C.steel, marginTop: 4 }}>
                  {pin.series} · {pin.year} · {pin.variant}
                </div>
                {pin.editionSize && (
                  <div style={{ ...mono, fontSize: 11, color: C.steel, marginTop: 2 }}>{pin.editionSize}</div>
                )}
                <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
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
            </div>
          );
        })}
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
        <div style={{ ...body, fontSize: 12, color: C.steel, marginTop: 8, textAlign: "right" }}>
          {stats.owned} of {stats.totalCatalog} pins collected
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
          <StatBlock label="OWNED" value={stats.owned} />
          <StatBlock label="TO COMPLETE" value={stats.missing} align="right" />
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
            <div
              key={entry.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpenDetail(pin.id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenDetail(pin.id); } }}
              style={{ textAlign: "left", background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden", cursor: "pointer", display: "flex", flexDirection: "column", width: "100%", boxSizing: "border-box" }}
            >
              <PinPhoto pin={pin} height={180} radius={0} />
              <div style={{ padding: 12 }}>
                <div style={{ ...display, fontSize: 18, fontWeight: 700, lineHeight: 1.15, color: "#FFFFFF" }}>{pin.name}</div>
                <div style={{ ...body, fontSize: 13, color: C.steel, marginTop: 4 }}>
                  {pin.chassisCode} · {pin.series} · {pin.year}
                </div>
                <div style={{ ...mono, fontSize: 11, color: C.amber, marginTop: 4 }}>
                  Qty {entry.quantity}{entry.notes ? ` · ${entry.notes}` : ""}
                </div>
              </div>
            </div>
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

function StatBlock({ label, value, align = "left" }) {
  return (
    <div style={{ textAlign: align }}>
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
        <StatBlock label="CONTRIBUTED" value={contributions} align="right" />
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
function PinDetailModal({ pin, entry, onClose, onSaveCatalogEdit, onAddToGarage, onUpdateGarageEntry, onRemoveFromGarage, onDeleteCatalogPin }) {
  const [editMode, setEditMode] = useState(false);
  const [f, setF] = useState({ ...pin });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const confirmDeleteAtRef = useRef(0);

  const [qty, setQty] = useState(entry ? entry.quantity : 1);
  const [notes, setNotes] = useState(entry ? entry.notes || "" : "");

  const images = pin.images || [];
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    setF({ ...pin });
    setActiveImage(0);
    setConfirmDelete(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin.id]);

  function saveEdit() {
    onSaveCatalogEdit({ ...f, year: Number(f.year) || f.year });
    setEditMode(false);
  }

  // Photos save immediately against the last-saved pin, independent of any
  // other unsaved edits sitting in `f` — so a photo never gets lost just
  // because the rest of the form hasn't been submitted yet.
  function persistImages(imgs) {
    setF((prev) => ({ ...prev, images: imgs }));
    onSaveCatalogEdit({ ...pin, images: imgs });
  }

  const owned = !!entry;

  return (
    <ModalShell title={editMode ? "Edit Pin" : "Pin Details"} onClose={onClose}>
      {!editMode && (
        <>
          <PinPhoto
            pin={pin}
            height={200}
            radius={10}
            grayscale={!owned}
            index={activeImage}
            onPrev={images.length > 1 ? () => setActiveImage((i) => (i - 1 + images.length) % images.length) : undefined}
            onNext={images.length > 1 ? () => setActiveImage((i) => (i + 1) % images.length) : undefined}
            onExpand={images.length > 0 ? () => setLightboxOpen(true) : undefined}
          />
          {images.length > 1 && (
            <div style={{ display: "flex", gap: 8, overflowX: "auto", marginTop: 8 }}>
              {images.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  onClick={() => setActiveImage(i)}
                  style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6, border: `2px solid ${i === activeImage ? C.amber : C.line}`, flexShrink: 0, filter: owned ? "none" : "grayscale(1)", cursor: "pointer" }}
                />
              ))}
            </div>
          )}
          {lightboxOpen && (
            <Lightbox
              images={images}
              index={activeImage}
              grayscale={!owned}
              onIndexChange={setActiveImage}
              onClose={() => setLightboxOpen(false)}
            />
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 14, marginBottom: 4 }}>
            <div style={{ ...display, fontSize: 22, fontWeight: 700, lineHeight: 1.15, color: "#FFFFFF" }}>{pin.name}</div>
            <button onClick={() => setEditMode(true)} style={{ background: C.panelRaised, border: `1px solid ${C.line}`, borderRadius: 8, padding: 6, color: C.steel, flexShrink: 0, marginLeft: 8 }}>
              <Pencil size={14} />
            </button>
          </div>
          <div style={{ height: 12, marginBottom: 8 }} />
          <div style={{ ...body, fontSize: 14, color: C.chalk, marginBottom: 4 }}>
            {pin.chassisCode} · {pin.series} · {pin.year} · {pin.variant}
          </div>
          {pin.editionSize && <div style={{ ...mono, fontSize: 12, color: C.steel, marginBottom: 8 }}>{pin.editionSize}</div>}
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
            <div style={{ flex: 1 }}><Field label="Edition #"><input style={inputStyle} value={f.editionSize} onChange={set("editionSize")} /></Field></div>
          </div>
          <Field label="Colorway / variant"><input style={inputStyle} value={f.variant} onChange={set("variant")} /></Field>
          <PhotosField images={f.images} onChange={persistImages} />
          <Field label="Description / notes"><textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={f.notes} onChange={set("notes")} /></Field>
          <Field label="Tags (comma separated, not shown publicly)">
            <input style={inputStyle} value={f.tags || ""} onChange={set("tags")} placeholder="e.g. martini, le mans, rare" />
          </Field>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setEditMode(false)} style={{ ...mono, flex: 1, padding: "12px 0", borderRadius: 10, border: `1px solid ${C.line}`, color: C.steel, background: "transparent", fontSize: 12, letterSpacing: "0.05em" }}>
              CANCEL
            </button>
            <button onClick={saveEdit} style={{ ...mono, flex: 1, padding: "12px 0", borderRadius: 10, border: "none", color: C.ink, background: C.amber, fontSize: 12, letterSpacing: "0.05em", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Check size={14} /> SAVE
            </button>
          </div>

          <div style={{ borderTop: `1px solid ${C.line}`, marginTop: 16, paddingTop: 16 }}>
            {!confirmDelete ? (
              <button
                onClick={() => {
                  confirmDeleteAtRef.current = Date.now();
                  setConfirmDelete(true);
                }}
                style={{ ...mono, width: "100%", padding: "10px 0", borderRadius: 10, border: `1px solid ${C.redDeep}`, color: "#F0A0A3", background: "transparent", fontSize: 12, letterSpacing: "0.05em", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <Trash2 size={13} /> DELETE CATALOG ENTRY
              </button>
            ) : (
              <>
                <div style={{ ...body, fontSize: 13, color: "#F0A0A3", marginBottom: 10, textAlign: "center" }}>
                  Delete this pin from the catalog? This can't be undone, and it'll also remove it from anyone's garage.
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setConfirmDelete(false)} style={{ ...mono, flex: 1, padding: "12px 0", borderRadius: 10, border: `1px solid ${C.line}`, color: C.steel, background: "transparent", fontSize: 12, letterSpacing: "0.05em" }}>
                    KEEP IT
                  </button>
                  <button
                    onClick={() => {
                      // Guard against a residual touch from the "DELETE CATALOG
                      // ENTRY" tap landing on this button the instant it appears.
                      if (Date.now() - confirmDeleteAtRef.current < 500) return;
                      onDeleteCatalogPin();
                    }}
                    style={{ ...mono, flex: 1, padding: "12px 0", borderRadius: 10, border: "none", color: "#fff", background: C.red, fontSize: 12, letterSpacing: "0.05em", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                  >
                    <Trash2 size={13} /> DELETE
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </ModalShell>
  );
}

// ---------- Add Catalog Modal ----------
function AddCatalogModal({ onClose, onSave }) {
  const [f, setF] = useState({ chassisCode: "", name: "", series: "", year: "", variant: "", editionSize: "", notes: "", images: [], tags: "" });
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
          <Field label="Edition #"><input style={inputStyle} value={f.editionSize} onChange={set("editionSize")} placeholder="500 or Open Edition" /></Field>
        </div>
      </div>
      <Field label="Colorway / variant"><input style={inputStyle} value={f.variant} onChange={set("variant")} placeholder="Guards Red / Silver" /></Field>
      <PhotosField images={f.images} onChange={(imgs) => setF({ ...f, images: imgs })} />
      <Field label="Description / notes"><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={f.notes} onChange={set("notes")} /></Field>
      <Field label="Tags (comma separated, not shown publicly)">
        <input style={inputStyle} value={f.tags} onChange={set("tags")} placeholder="e.g. martini, le mans, rare" />
      </Field>

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
          <PinPhoto pin={pin} height={40} width={40} radius={8} />
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
