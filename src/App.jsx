import React, { useState, useEffect, useMemo, useRef } from "react";
import { Search, Plus, X, Database, PinIcon, User, Trash2, Loader2, Pencil, Check, Upload, ChevronLeft, ChevronRight, ChevronDown, Heart, Download, LogOut } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { useConvexAuth, useAuthActions } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";

// ---------- Design tokens ----------
const C = {
  ink: "#15171A",
  panel: "#1F2226",
  catalogCard: "#4C5053",
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
.fsv-shell { max-width: 480px; }
@media (min-width: 768px) { .fsv-shell { max-width: 1200px; } }
.fsv-pin-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px; }
@media (min-width: 768px) { .fsv-pin-grid { grid-template-columns: repeat(auto-fill, minmax(175px, 1fr)); gap: 10px; } }
`;

const display = { fontFamily: "'Barlow Condensed', sans-serif" };
const body = { fontFamily: "'IBM Plex Sans', sans-serif" };
const mono = { fontFamily: "'IBM Plex Mono', monospace" };

// Joins pin meta fields with " · ", skipping any that are blank (e.g. year
// or series left empty) instead of leaving stray separators.
function metaLine(...parts) {
  return parts.filter(Boolean).join(" · ");
}

// A pin's series field may hold several comma-separated series (e.g. a
// collab pin belonging to both "Santa Clarita" and "Wunderground").
function splitSeries(series) {
  return (series || "").split(",").map((s) => s.trim()).filter(Boolean);
}

// ---------- Pin photo (uploaded image, or placeholder mark) ----------
const navBtnStyle = {
  position: "absolute", top: "50%", transform: "translateY(-50%)",
  width: 28, height: 28, borderRadius: 9999, background: "rgba(21,23,26,0.65)",
  border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
};

function PinPhoto({ pin, height = 160, width = "100%", radius = 10, index = 0, onPrev, onNext, onExpand }) {
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
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
function Lightbox({ images, index, onIndexChange, onClose }) {
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
        style={{ maxWidth: "92vw", maxHeight: "80vh", objectFit: "contain", borderRadius: 8 }}
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
  const { isLoading: authLoading } = useConvexAuth();

  if (authLoading) {
    return (
      <div style={{ ...body, background: C.ink, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.steel }}>
        <style>{GLOBAL_STYLE}</style>
        <Loader2 size={22} style={{ marginRight: 8, animation: "fsv-spin 1s linear infinite" }} />
        Loading vault…
      </div>
    );
  }

  return <MainApp />;
}

function MainApp() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const [tab, setTab] = useState("catalog");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [catalogFilter, setCatalogFilter] = useState("all");

  const [showAddCatalog, setShowAddCatalog] = useState(false);
  const [addCollectionFor, setAddCollectionFor] = useState(null); // catalogId or "pick"
  const [detailPinId, setDetailPinId] = useState(null);

  const pinsRaw = useQuery(api.pins.list);
  const garageRaw = useQuery(api.garage.list);
  const wishlistRaw = useQuery(api.wishlist.list);
  const profileRaw = useQuery(api.profiles.me);

  const createPin = useMutation(api.pins.create);
  const updatePin = useMutation(api.pins.update);
  const removePin = useMutation(api.pins.remove);
  const addGarage = useMutation(api.garage.add);
  const updateGarage = useMutation(api.garage.update);
  const removeGarage = useMutation(api.garage.remove);
  const toggleWishlistMutation = useMutation(api.wishlist.toggle);
  const setDisplayNameMutation = useMutation(api.profiles.setDisplayName);

  // Right after sign-up, the Convex client's auth token can take a moment to
  // propagate — an immediate setDisplayName call can race and get rejected as
  // unauthenticated. Defer it to this effect (keyed on isAuthenticated) and
  // retry briefly so the name still lands once the client catches up.
  const [pendingDisplayName, setPendingDisplayName] = useState(null);
  useEffect(() => {
    if (!isAuthenticated || !pendingDisplayName) return;
    let cancelled = false;
    async function save() {
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          await setDisplayNameMutation({ displayName: pendingDisplayName });
          if (!cancelled) setPendingDisplayName(null);
          return;
        } catch {
          await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
        }
      }
    }
    save();
    return () => { cancelled = true; };
  }, [isAuthenticated, pendingDisplayName, setDisplayNameMutation]);

  const loading = pinsRaw === undefined || garageRaw === undefined || wishlistRaw === undefined || profileRaw === undefined;

  const catalog = useMemo(
    () =>
      (pinsRaw || []).map((p) => ({
        id: p._id,
        chassisCode: p.chassisCode,
        name: p.name,
        series: p.series,
        year: p.year,
        variant: p.variant,
        editionSize: p.editionSize,
        notes: p.notes,
        tags: p.tags || "",
        images: p.images || [],
        addedBy: p.addedBy || "",
      })),
    [pinsRaw]
  );

  const collection = useMemo(
    () =>
      (garageRaw || []).map((c) => ({
        id: c._id,
        catalogId: c.pinId,
        quantity: c.quantity,
        notes: c.notes || "",
      })),
    [garageRaw]
  );

  const wishlist = useMemo(() => (wishlistRaw || []).map((w) => w.pinId), [wishlistRaw]);
  const profile = profileRaw || { displayName: "", email: "" };

  function flash(msg) {
    setNotice(msg);
    setTimeout(() => setNotice(""), 2500);
  }

  const SIGN_IN_NUDGE = "Sign in (Profile tab) to save that — browsing is free, saving needs an account.";
  function flashWriteError(err, fallback) {
    flash(String(err?.message || "").includes("Must be signed in") ? SIGN_IN_NUDGE : fallback);
  }

  function saveProfile(next) {
    setDisplayNameMutation({ displayName: next.displayName || "" }).catch((e) =>
      flashWriteError(e, "Couldn't save — try again.")
    );
  }

  function toggleWishlist(pinId) {
    toggleWishlistMutation({ pinId })
      .then((added) => flash(added ? "Added to wishlist." : "Removed from wishlist."))
      .catch((e) => flashWriteError(e, "Couldn't update your wishlist."));
  }

  const wishlistIds = useMemo(() => new Set(wishlist), [wishlist]);
  const wishlistPins = useMemo(() => catalog.filter((p) => wishlistIds.has(p.id)), [catalog, wishlistIds]);

  const seriesOptions = useMemo(() => Array.from(new Set(catalog.flatMap((p) => splitSeries(p.series)))).sort(), [catalog]);
  const chassisOptions = useMemo(() => Array.from(new Set(catalog.map((p) => p.chassisCode).filter(Boolean))).sort(), [catalog]);

  const ownedIds = useMemo(() => new Set(collection.map((c) => c.catalogId)), [collection]);

  const filteredCatalog = useMemo(() => {
    return catalog.filter((p) => {
      let matchesFilter = true;
      if (catalogFilter === "missing") {
        matchesFilter = !ownedIds.has(p.id);
      } else if (catalogFilter.startsWith("series:")) {
        matchesFilter = splitSeries(p.series).includes(catalogFilter.slice(7));
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
    const { id, addedBy, ...fields } = updatedPin;
    updatePin({
      id,
      chassisCode: fields.chassisCode || "",
      name: fields.name || "",
      series: fields.series || "",
      year: String(fields.year ?? ""),
      variant: fields.variant || "",
      editionSize: fields.editionSize || "",
      notes: fields.notes || "",
      tags: fields.tags || "",
      images: fields.images || [],
    })
      .then(() => flash("Catalog entry updated."))
      .catch((e) => flashWriteError(e, "Couldn't save — try again."));
  }
  function deleteCatalogPin(pinId) {
    removePin({ id: pinId })
      .then(() => flash("Removed from the catalog."))
      .catch((e) => flashWriteError(e, "Couldn't remove — try again."));
  }
  function addCollectionEntry(entry) {
    addGarage({ pinId: entry.catalogId, quantity: Number(entry.quantity) || 1, notes: entry.notes || "" })
      .then(() => flash("Added to your garage."))
      .catch((e) => {
        const msg = String(e?.message || "");
        if (msg.includes("Already")) flash("Already in your garage.");
        else flashWriteError(e, "Couldn't add — try again.");
      });
  }
  function updateCollectionEntry(entryId, fields) {
    updateGarage({ id: entryId, ...fields }).catch((e) => flashWriteError(e, "Couldn't save — try again."));
  }
  function removeCollectionEntry(entryId) {
    removeGarage({ id: entryId })
      .then(() => flash("Removed from your garage."))
      .catch((e) => flashWriteError(e, "Couldn't remove — try again."));
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
      <div className="fsv-shell" style={{ margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative" }}>
        {/* Header */}
        <div style={{ position: "sticky", top: 0, zIndex: 20, background: C.ink, borderBottom: `1px solid ${C.line}`, padding: "calc(16px + env(safe-area-inset-top, 0px)) 16px 12px" }}>
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
          <div
            style={{
              ...mono, fontSize: 11, background: "#2A1518", color: "#F0A0A3", border: `1px solid ${C.redDeep}`,
              padding: "10px 16px", borderRadius: 10, position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)",
              width: "calc(100% - 32px)", maxWidth: 440, zIndex: 80, textAlign: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            }}
          >
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
              seriesOptions={seriesOptions}
              chassisOptions={chassisOptions}
              catalogFilter={catalogFilter}
              setCatalogFilter={setCatalogFilter}
              onAdd={() => setShowAddCatalog(true)}
              onAddToCollection={(id) => setAddCollectionFor(id)}
              onOpenDetail={(id) => setDetailPinId(id)}
              wishlistIds={wishlistIds}
              onToggleWishlist={toggleWishlist}
              ownedIds={ownedIds}
              isAdmin={profile.isAdmin}
            />
          )}
          {tab === "wishlist" && (
            <WishlistTab
              pins={wishlistPins}
              onRemove={toggleWishlist}
              onOpenDetail={(id) => setDetailPinId(id)}
              isAuthenticated={isAuthenticated}
              ownedIds={ownedIds}
            />
          )}
          {tab === "collection" && (
            <CollectionTab
              catalog={catalog}
              collection={collection}
              stats={stats}
              onAdd={() => setAddCollectionFor("pick")}
              isAuthenticated={isAuthenticated}
              onOpenDetail={(catalogId) => setDetailPinId(catalogId)}
            />
          )}
          {tab === "profile" && (
            isAuthenticated
              ? <ProfileTab profile={profile} saveProfile={saveProfile} catalog={catalog} stats={stats} onSignOut={signOut} />
              : <SignInScreen onSignedUp={setPendingDisplayName} />
          )}
        </div>

        {/* Bottom nav */}
        <div
          className="fsv-shell"
          style={{
            position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
            width: "100%", background: C.panel, borderTop: `1px solid ${C.line}`,
            display: "flex", paddingBottom: "env(safe-area-inset-bottom, 0px)", zIndex: 30,
          }}
        >
          <NavButton icon={Database} label="Catalog" active={tab === "catalog"} onClick={() => setTab("catalog")} />
          <NavButton icon={Heart} label="Wishlist" active={tab === "wishlist"} onClick={() => setTab("wishlist")} />
          <NavButton icon={PinIcon} label="Garage" active={tab === "collection"} onClick={() => setTab("collection")} />
          <NavButton icon={User} label="Profile" active={tab === "profile"} onClick={() => setTab("profile")} />
        </div>

        {/* Modals */}
        {showAddCatalog && (
          <AddCatalogModal
            onClose={() => setShowAddCatalog(false)}
            onSave={(pin) => {
              createPin({
                chassisCode: pin.chassisCode || "",
                name: pin.name || "",
                series: pin.series || "",
                year: String(pin.year ?? ""),
                variant: pin.variant || "",
                editionSize: pin.editionSize || "",
                notes: pin.notes || "",
                tags: pin.tags || "",
                images: pin.images || [],
                addedBy: profile.displayName || "Collector",
              })
                .then(() => flash("Added to the catalog."))
                .catch((e) => flashWriteError(e, "Couldn't add — try again."));
              setShowAddCatalog(false);
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
            isAdmin={profile.isAdmin}
            onClose={() => setDetailPinId(null)}
            onSaveCatalogEdit={upsertCatalogPin}
            onAddToGarage={(fields) => addCollectionEntry({ catalogId: detailPin.id, ...fields })}
            onUpdateGarageEntry={(fields) => detailEntry && updateCollectionEntry(detailEntry.id, fields)}
            onRemoveFromGarage={() => {
              if (detailEntry) removeCollectionEntry(detailEntry.id);
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

// ---------- Sign In / Sign Up ----------
function SignInScreen({ onSignedUp }) {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState("signIn"); // "signIn" | "signUp"
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function submit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const signUpName = displayName.trim();
    signIn("password", { email: email.trim(), password, flow })
      .then(() => {
        if (flow === "signUp") onSignedUp(signUpName);
      })
      .catch((err) => {
        const msg = String(err?.message || "");
        if (msg.includes("InvalidAccountId") || msg.includes("InvalidSecret")) {
          setError("Wrong email or password.");
        } else if (msg.includes("already")) {
          setError("An account with that email already exists — try signing in.");
        } else {
          setError("Something went wrong. Try again.");
        }
      })
      .finally(() => setSubmitting(false));
  }

  return (
    <div style={{ padding: "14px 16px" }}>
      <div style={{ width: "100%", maxWidth: 360, margin: "0 auto" }}>
        <div style={{ ...body, fontSize: 13, color: C.steel, textAlign: "center", marginBottom: 18, lineHeight: 1.5 }}>
          Browsing the catalog is free. Sign in or create an account to save pins to your garage or wishlist.
        </div>

        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 20 }}>
          <div style={{ display: "flex", marginBottom: 18, borderRadius: 8, overflow: "hidden", border: `1px solid ${C.line}` }}>
            <button
              type="button"
              onClick={() => { setFlow("signIn"); setError(""); }}
              style={{
                ...mono, flex: 1, padding: "9px 0", fontSize: 12, letterSpacing: "0.05em", border: "none",
                background: flow === "signIn" ? C.amber : "transparent", color: flow === "signIn" ? C.ink : C.steel,
              }}
            >
              SIGN IN
            </button>
            <button
              type="button"
              onClick={() => { setFlow("signUp"); setError(""); }}
              style={{
                ...mono, flex: 1, padding: "9px 0", fontSize: 12, letterSpacing: "0.05em", border: "none",
                background: flow === "signUp" ? C.amber : "transparent", color: flow === "signUp" ? C.ink : C.steel,
              }}
            >
              CREATE ACCOUNT
            </button>
          </div>

          <form onSubmit={submit}>
            {flow === "signUp" && (
              <Field label="Display name">
                <input
                  type="text"
                  autoComplete="nickname"
                  required
                  maxLength={40}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  style={inputStyle}
                />
              </Field>
            )}
            <Field label="Email">
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                autoComplete={flow === "signIn" ? "current-password" : "new-password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
              />
            </Field>

            {error && (
              <div style={{ ...body, fontSize: 12, color: "#F0A0A3", marginBottom: 12 }}>{error}</div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                ...mono, width: "100%", marginTop: 6, padding: "12px 0", borderRadius: 10, border: "none",
                background: submitting ? C.line : C.amber, color: submitting ? C.steel : C.ink, fontSize: 13, letterSpacing: "0.05em",
              }}
            >
              {flow === "signIn" ? "SIGN IN" : "CREATE ACCOUNT"}
            </button>
          </form>
        </div>
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
function CatalogTab({ filtered, search, setSearch, seriesOptions, chassisOptions, catalogFilter, setCatalogFilter, onAdd, onAddToCollection, onOpenDetail, wishlistIds, onToggleWishlist, ownedIds, isAdmin }) {
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
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <select
            value={catalogFilter.startsWith("series:") ? "all" : catalogFilter}
            onChange={(e) => setCatalogFilter(e.target.value)}
            style={{
              ...body, width: "100%", background: C.ink, border: `1px solid ${C.line}`, borderRadius: 8,
              padding: "10px 32px 10px 12px", color: C.chalk, fontSize: 14, outline: "none", boxSizing: "border-box",
              appearance: "none", WebkitAppearance: "none",
            }}
          >
            <option value="all">All Pins</option>
            <option value="missing">Missing From My Garage</option>
            {chassisOptions.length > 0 && (
              <optgroup label="Chassis / Model">
                {chassisOptions.map((c) => (
                  <option key={`chassis:${c}`} value={`chassis:${c}`}>{c}</option>
                ))}
              </optgroup>
            )}
          </select>
          <ChevronDown size={16} color={C.steel} style={{ position: "absolute", right: 12, top: 12, pointerEvents: "none" }} />
        </div>
        <div style={{ position: "relative", flex: 1 }}>
          <select
            value={catalogFilter.startsWith("series:") ? catalogFilter.slice(7) : ""}
            onChange={(e) => setCatalogFilter(e.target.value ? `series:${e.target.value}` : "all")}
            style={{
              ...body, width: "100%", background: C.ink, border: `1px solid ${C.line}`, borderRadius: 8,
              padding: "10px 32px 10px 12px", color: C.chalk, fontSize: 14, outline: "none", boxSizing: "border-box",
              appearance: "none", WebkitAppearance: "none",
            }}
          >
            <option value="">All Series</option>
            {seriesOptions.map((s) => (
              <option key={`series:${s}`} value={s}>{s}</option>
            ))}
          </select>
          <ChevronDown size={16} color={C.steel} style={{ position: "absolute", right: 12, top: 12, pointerEvents: "none" }} />
        </div>
      </div>

      {filtered.length === 0 && (
        <EmptyState title="No pins match." body="Try a different search, or add the pin you're looking for." />
      )}

      <div className="fsv-pin-grid">
        {filtered.map((pin) => {
          const wished = wishlistIds.has(pin.id);
          const owned = ownedIds.has(pin.id);
          return (
            <div
              key={pin.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpenDetail(pin.id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenDetail(pin.id); } }}
              style={{ textAlign: "left", background: C.catalogCard, border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden", cursor: "pointer", display: "flex", flexDirection: "column", width: "100%", boxSizing: "border-box" }}
            >
              <div style={{ position: "relative" }}>
                <PinPhoto pin={pin} height={130} radius={0} />
                <span
                  role="button"
                  onClick={(e) => { e.stopPropagation(); onToggleWishlist(pin.id); }}
                  style={{
                    position: "absolute", top: 6, right: 6, width: 26, height: 26, borderRadius: 9999,
                    color: wished ? C.ink : "#fff", background: wished ? "#F0A0A3" : "rgba(0,0,0,0.45)",
                    border: "none", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Heart size={14} fill={wished ? C.ink : "none"} />
                </span>
                {owned && (
                  <div style={{
                    ...mono, position: "absolute", bottom: 0, left: 0, right: 0, fontSize: 10, fontWeight: 700,
                    letterSpacing: "0.08em", textAlign: "center", color: "#4ADE80", background: "rgba(16,24,19,0.78)",
                    padding: "3px 0",
                  }}>
                    OWNED
                  </div>
                )}
              </div>
              <div style={{ padding: 10, textAlign: "center", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ ...display, fontSize: 16, fontWeight: 700, lineHeight: 1.15, color: "#FFFFFF" }}>{pin.name}</div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ ...body, fontSize: 12, color: C.steel, marginTop: 3 }}>
                    {pin.variant}
                  </div>
                  {pin.editionSize && (
                    <div style={{ ...mono, fontSize: 11, color: C.steel, marginTop: 2 }}>{pin.editionSize}</div>
                  )}
                </div>
                <div style={{ display: "flex", justifyContent: "center", paddingTop: 7 }}>
                  <span
                    role="button"
                    onClick={(e) => { e.stopPropagation(); onAddToCollection(pin.id); }}
                    style={{
                      ...mono, fontSize: 11, letterSpacing: "0.03em", color: C.ink, background: C.amber,
                      border: "none", borderRadius: 6, padding: "7px 16px", display: "inline-flex", alignItems: "center", gap: 4,
                    }}
                  >
                    <Plus size={12} /> GARAGE
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isAdmin && (
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
      )}
    </div>
  );
}

// ---------- Wishlist Tab ----------
const POSTER_TEAL = "#1BAFA0";

function WishlistTab({ pins, onRemove, onOpenDetail, isAuthenticated, ownedIds }) {
  const [exporting, setExporting] = useState(false);
  const posterRef = useRef(null);

  const groups = useMemo(() => {
    const map = new Map();
    for (const p of pins) {
      const key = p.chassisCode || "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [pins]);

  async function handleExport() {
    if (pins.length === 0 || !posterRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(posterRef.current, { backgroundColor: C.ink, scale: 2 });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = "want-list.png";
      a.click();
    } finally {
      setExporting(false);
    }
  }

  return (
    <div style={{ padding: "14px 16px" }}>
      <button
        onClick={handleExport}
        disabled={pins.length === 0 || exporting}
        style={{
          ...mono, width: "100%", padding: "12px 0", borderRadius: 10, marginBottom: 14,
          border: "none", color: C.ink, background: pins.length === 0 ? C.line : C.amber, fontSize: 12, letterSpacing: "0.05em",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: pins.length === 0 ? "default" : "pointer",
        }}
      >
        {exporting ? <Loader2 size={14} style={{ animation: "fsv-spin 1s linear infinite" }} /> : <Download size={14} />}
        EXPORT WANT LIST
      </button>

      {pins.length === 0 && (
        <EmptyState
          title="Your wishlist is empty."
          body={isAuthenticated ? "Tap the heart on any catalog pin to add it here." : "Sign in (Profile tab) to save pins to a wishlist."}
        />
      )}

      <div className="fsv-pin-grid">
        {pins.map((pin) => {
          const owned = ownedIds.has(pin.id);
          return (
          <div
            key={pin.id}
            role="button"
            tabIndex={0}
            onClick={() => onOpenDetail(pin.id)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenDetail(pin.id); } }}
            style={{ textAlign: "left", background: C.catalogCard, border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden", cursor: "pointer", display: "flex", flexDirection: "column", width: "100%", boxSizing: "border-box" }}
          >
            <div style={{ position: "relative" }}>
              <PinPhoto pin={pin} height={130} radius={0} />
              {owned && (
                <div style={{
                  ...mono, position: "absolute", bottom: 0, left: 0, right: 0, fontSize: 10, fontWeight: 700,
                  letterSpacing: "0.08em", textAlign: "center", color: "#4ADE80", background: "rgba(16,24,19,0.78)",
                  padding: "3px 0",
                }}>
                  OWNED
                </div>
              )}
            </div>
            <div style={{ padding: 10, textAlign: "center", flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ ...display, fontSize: 16, fontWeight: 700, lineHeight: 1.15, color: "#FFFFFF" }}>{pin.name}</div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ ...body, fontSize: 12, color: C.steel, marginTop: 3 }}>
                  {pin.variant}
                </div>
                {pin.editionSize && (
                  <div style={{ ...mono, fontSize: 11, color: C.steel, marginTop: 2 }}>{pin.editionSize}</div>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "center", paddingTop: 7 }}>
                <span
                  role="button"
                  onClick={(e) => { e.stopPropagation(); onRemove(pin.id); }}
                  style={{
                    ...mono, fontSize: 11, letterSpacing: "0.03em", color: "#F0A0A3", background: "transparent",
                    border: `1px solid ${C.redDeep}`, borderRadius: 6, padding: "6px 9px", display: "inline-flex", alignItems: "center", gap: 4,
                  }}
                >
                  <X size={12} /> REMOVE
                </span>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* Offscreen poster used for export — rendered but not visible */}
      <div style={{ position: "fixed", top: 0, left: -99999, pointerEvents: "none" }}>
        <div ref={posterRef} style={{ width: 1080, background: C.ink, padding: 48, ...body }}>
          <div style={{ ...display, fontSize: 56, fontWeight: 800, color: "#FFFFFF", letterSpacing: "0.01em", marginBottom: 32 }}>
            WANT LIST
          </div>
          {groups.map(([chassisCode, groupPins]) => (
            <div key={chassisCode} style={{ marginBottom: 28 }}>
              <div style={{ ...mono, fontSize: 16, color: POSTER_TEAL, letterSpacing: "0.12em", marginBottom: 10, textTransform: "uppercase" }}>
                {chassisCode}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                {groupPins.map((pin) => (
                  <div key={pin.id} style={{ background: POSTER_TEAL, borderRadius: 8, padding: 16, minHeight: 96, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ ...display, fontSize: 20, fontWeight: 700, color: "#0B1210", lineHeight: 1.15 }}>{pin.name}</div>
                      {pin.variant && (
                        <div style={{ ...body, fontSize: 13, color: "#0B1210", marginTop: 4, opacity: 0.8 }}>{pin.variant}</div>
                      )}
                    </div>
                    <div style={{ ...mono, fontSize: 12, color: "#0B1210", textAlign: "right", marginTop: 8, opacity: 0.85 }}>
                      {pin.editionSize || ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Collection Tab ----------
function CollectionTab({ catalog, collection, stats, onAdd, onOpenDetail, isAuthenticated }) {
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
        <EmptyState
          title="Your garage is empty."
          body={isAuthenticated ? "Add your first pin from the catalog to start tracking it." : "Sign in (Profile tab) to start tracking your collection."}
        />
      )}

      <div className="fsv-pin-grid">
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
              style={{ textAlign: "left", background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden", cursor: "pointer", display: "flex", flexDirection: "column", width: "100%", boxSizing: "border-box" }}
            >
              <PinPhoto pin={pin} height={130} radius={0} />
              <div style={{ padding: 10, flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ ...display, fontSize: 16, fontWeight: 700, lineHeight: 1.15, color: "#FFFFFF" }}>{pin.name}</div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ ...body, fontSize: 12, color: C.steel, marginTop: 3 }}>
                    {pin.variant}
                  </div>
                  {pin.editionSize && (
                    <div style={{ ...mono, fontSize: 11, color: C.steel, marginTop: 2 }}>{pin.editionSize}</div>
                  )}
                </div>
                <div style={{ ...mono, fontSize: 11, color: C.amber, paddingTop: 3 }}>
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
function ProfileTab({ profile, saveProfile, catalog, stats, onSignOut }) {
  const [name, setName] = useState(profile.displayName || "");
  useEffect(() => { setName(profile.displayName || ""); }, [profile.displayName]);
  const contributions = catalog.filter((p) => p.addedBy === (profile.displayName || "__none__") && profile.displayName).length;

  const users = useQuery(api.admin.listUsers, profile.isAdmin ? {} : "skip");

  return (
    <div style={{ padding: "14px 16px" }}>
      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        {profile.email && (
          <div style={{ ...mono, fontSize: 11, color: C.steel, marginBottom: 12 }}>{profile.email}</div>
        )}
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

      <button
        onClick={onSignOut}
        style={{
          ...mono, marginTop: 16, width: "100%", padding: "12px 0", borderRadius: 10,
          border: `1px solid ${C.line}`, color: C.steel, background: "transparent", fontSize: 12, letterSpacing: "0.05em",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}
      >
        <LogOut size={14} /> SIGN OUT
      </button>

      {profile.isAdmin && (
        <div style={{ marginTop: 20 }}>
          <div style={{ ...mono, fontSize: 11, color: C.steel, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
            Registered Users{users ? ` (${users.length})` : ""}
          </div>
          <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden" }}>
            {!users && (
              <div style={{ ...body, fontSize: 13, color: C.steel, padding: 14 }}>Loading…</div>
            )}
            {users && users.length === 0 && (
              <div style={{ ...body, fontSize: 13, color: C.steel, padding: 14 }}>No registered users yet.</div>
            )}
            {users && users.map((u, i) => (
              <div
                key={u.email + i}
                style={{
                  padding: "10px 14px", borderBottom: i < users.length - 1 ? `1px solid ${C.line}` : "none",
                  display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ ...body, fontSize: 13, color: C.chalk, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.email}
                  </div>
                  {u.displayName && (
                    <div style={{ ...body, fontSize: 11, color: C.steel, marginTop: 1 }}>{u.displayName}</div>
                  )}
                </div>
                <div style={{ ...mono, fontSize: 10, color: C.steel, flexShrink: 0 }}>
                  {new Date(u.joinedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
function PinDetailModal({ pin, entry, isAdmin, onClose, onSaveCatalogEdit, onAddToGarage, onUpdateGarageEntry, onRemoveFromGarage, onDeleteCatalogPin }) {
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

  return (
    <ModalShell title={editMode ? "Edit Pin" : "Pin Details"} onClose={onClose}>
      {!editMode && (
        <>
          <PinPhoto
            pin={pin}
            height={200}
            radius={10}
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
                  style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6, border: `2px solid ${i === activeImage ? C.amber : C.line}`, flexShrink: 0, cursor: "pointer" }}
                />
              ))}
            </div>
          )}
          {lightboxOpen && (
            <Lightbox
              images={images}
              index={activeImage}
              onIndexChange={setActiveImage}
              onClose={() => setLightboxOpen(false)}
            />
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 14, marginBottom: 4 }}>
            <div style={{ ...display, fontSize: 22, fontWeight: 700, lineHeight: 1.15, color: "#FFFFFF" }}>{pin.name}</div>
            {isAdmin && (
              <button onClick={() => setEditMode(true)} style={{ background: C.panelRaised, border: `1px solid ${C.line}`, borderRadius: 8, padding: 6, color: C.steel, flexShrink: 0, marginLeft: 8 }}>
                <Pencil size={14} />
              </button>
            )}
          </div>
          <div style={{ height: 12, marginBottom: 8 }} />
          <div style={{ ...body, fontSize: 14, color: C.chalk, marginBottom: 8 }}>
            {pin.chassisCode && <div style={{ marginBottom: 2 }}>{pin.chassisCode}</div>}
            {pin.series && <div style={{ marginBottom: 2 }}>{pin.series}</div>}
            {pin.variant && <div>{pin.variant}</div>}
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
  const canSave = f.chassisCode && f.name;

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
            <div style={{ ...mono, fontSize: 11, color: C.steel }}>{pin.variant}</div>
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
