"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
const AdminInbox = dynamic(() => import("./AdminInbox"), { ssr: false, loading: () => <div style={{ color: "#8B7F72", padding: 60, textAlign: "center" }}>Loading email client...</div> });

// ─── Tab types ───
type Tab = "dashboard" | "gallery" | "shop" | "events" | "email" | "site-editor" | "settings";
type EditorPage = "homepage" | "about" | "gallery" | "global";

// ─── Types ───
interface Artwork {
  _id: string; title: string; medium?: string; dimensions?: string; price?: number;
  status?: string; category?: string; year?: number; featured?: boolean;
  description?: string; imageUrl?: string; image?: { asset: { _ref: string } }; slug?: { current: string };
}
interface Event { _id: string; title: string; date: string; location?: string; type?: string; rsvpUrl?: string; description?: string; }
interface ShopItem { _id: string; title: string; price: number; badge?: string; type?: string; inStock?: boolean; medium?: string; imageUrl?: string; }
interface Stats { artworkCount: number; availableCount: number; shopCount: number; eventCount: number; }

// ─── Colors ───
const C = {
  bg: "#0a0906", bg2: "#141210", bg3: "#1c1915",
  border: "rgba(245,240,232,0.06)", border2: "rgba(245,240,232,0.12)",
  text: "#F5F0E8", muted: "#8B7F72", dim: "#4a4440",
  terra: "#C47D5A", gold: "#C4A86E", sage: "#8B9A7E", cream: "#EDE7DB",
};

// ─── NavItem ───
function NavItem({ icon, label, active, onClick, badge }: {
  icon: string; label: string; active: boolean; onClick: () => void; badge?: number;
}) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", borderRadius: 10,
      border: "none", cursor: "pointer", fontFamily: "inherit",
      background: active ? `rgba(196,125,90,0.15)` : "transparent",
      color: active ? C.terra : C.muted, fontSize: 13, fontWeight: active ? 600 : 400,
      transition: "all 0.2s", borderLeft: active ? `2px solid ${C.terra}` : "2px solid transparent", position: "relative",
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
      {badge != null && badge > 0 && (
        <span style={{ background: C.terra, color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10, minWidth: 18, textAlign: "center" }}>{badge}</span>
      )}
    </button>
  );
}

// ─── Upload zone ───
function UploadZone({ onFile, uploading, progress }: { onFile: (f: File) => void; uploading: boolean; progress: number; }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div onClick={() => !uploading && ref.current?.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
      style={{ border: `2px dashed ${drag ? C.terra : C.border2}`, borderRadius: 12, padding: 32, textAlign: "center",
        cursor: uploading ? "not-allowed" : "pointer", background: drag ? "rgba(196,125,90,0.05)" : "transparent",
        transition: "all 0.2s", opacity: uploading ? 0.7 : 1 }}>
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
      {uploading ? (
        <div>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⏫</div>
          <div style={{ color: C.muted, fontSize: 13, marginBottom: 8 }}>Uploading to Sanity...</div>
          <div style={{ width: 160, height: 4, background: C.bg3, borderRadius: 4, margin: "0 auto", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: C.terra, borderRadius: 4, transition: "width 0.3s" }} />
          </div>
          <div style={{ color: C.dim, fontSize: 11, marginTop: 6 }}>{progress}%</div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🖼️</div>
          <div style={{ color: C.muted, fontSize: 13 }}>Drop image here or click to upload</div>
          <div style={{ color: C.dim, fontSize: 11, marginTop: 4 }}>JPG, PNG, WEBP — any size</div>
        </div>
      )}
    </div>
  );
}

// ─── Artwork Edit Modal ───
function ArtworkModal({ artwork, onClose, onSave }: {
  artwork: Partial<Artwork> | null; onClose: () => void;
  onSave: (data: Partial<Artwork>, imageFile?: File) => Promise<void>;
}) {
  const isNew = !artwork?._id;
  const [form, setForm] = useState<Partial<Artwork>>(artwork || {});
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [imagePreview, setImagePreview] = useState<string | undefined>(artwork?.imageUrl);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof Artwork, v: unknown) => setForm(p => ({ ...p, [k]: v }));
  const handleImage = (f: File) => { setImageFile(f); const r = new FileReader(); r.onload = e => setImagePreview(e.target?.result as string); r.readAsDataURL(f); };
  const handleSave = async () => {
    if (!form.title) return alert("Title is required");
    setSaving(true); try { await onSave(form, imageFile); } finally { setSaving(false); }
  };
  const inputStyle = { width: "100%", padding: "10px 12px", background: C.bg3, border: `1px solid ${C.border2}`, borderRadius: 8, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const };
  const labelStyle = { display: "block", fontSize: 11, color: C.muted, marginBottom: 5, textTransform: "uppercase" as const, letterSpacing: "0.08em" };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(10,9,6,0.9)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 20, width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: C.text, margin: 0 }}>{isNew ? "Add Artwork" : "Edit Artwork"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Title *</label><input value={form.title || ""} onChange={e => set("title", e.target.value)} style={inputStyle} placeholder="Artwork title" /></div>
          <div><label style={labelStyle}>Medium</label>
            <select value={form.medium || ""} onChange={e => set("medium", e.target.value)} style={inputStyle}>
              <option value="">Select medium</option><option value="watercolor">Watercolor</option><option value="acrylic">Acrylic</option>
              <option value="mixed-media">Mixed Media</option><option value="oil">Oil</option><option value="digital">Digital</option><option value="other">Other</option>
            </select></div>
          <div><label style={labelStyle}>Category</label>
            <select value={form.category || ""} onChange={e => set("category", e.target.value)} style={inputStyle}>
              <option value="">Select category</option><option value="fine-art">Fine Art</option><option value="commercial">Commercial</option>
              <option value="daily">Daily Painting</option><option value="commission">Commission</option>
            </select></div>
          <div><label style={labelStyle}>Dimensions</label><input value={form.dimensions || ""} onChange={e => set("dimensions", e.target.value)} style={inputStyle} placeholder="e.g. 18 × 24 in" /></div>
          <div><label style={labelStyle}>Year</label><input type="number" value={form.year || ""} onChange={e => set("year", parseInt(e.target.value))} style={inputStyle} placeholder="2024" /></div>
          <div><label style={labelStyle}>Price ($)</label><input type="number" value={form.price || ""} onChange={e => set("price", parseFloat(e.target.value))} style={inputStyle} placeholder="1200" /></div>
          <div><label style={labelStyle}>Status</label>
            <select value={form.status || "available"} onChange={e => set("status", e.target.value)} style={inputStyle}>
              <option value="available">Available</option><option value="sold">Sold</option><option value="nfs">Not For Sale</option><option value="print-only">Print Only</option>
            </select></div>
          <div style={{ gridColumn: "1 / -1" }}><label style={labelStyle}>Description</label>
            <textarea value={form.description || ""} onChange={e => set("description", e.target.value)} style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} placeholder="Describe this artwork..." /></div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="checkbox" id="featured" checked={!!form.featured} onChange={e => set("featured", e.target.checked)} />
            <label htmlFor="featured" style={{ color: C.muted, fontSize: 13 }}>Featured on homepage</label></div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Image</label>
          {imagePreview && <div style={{ marginBottom: 12, borderRadius: 10, overflow: "hidden", maxHeight: 200 }}><img src={imagePreview} alt="" style={{ width: "100%", height: 200, objectFit: "cover" }} /></div>}
          <UploadZone onFile={handleImage} uploading={false} progress={0} />
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "10px 24px", background: "none", border: `1px solid ${C.border2}`, borderRadius: 8, color: C.muted, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: "10px 28px", background: C.terra, border: "none", borderRadius: 8, color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, opacity: saving ? 0.7 : 1 }}>{saving ? "Saving..." : isNew ? "Add Artwork" : "Save Changes"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Gallery Manager ───
function GalleryManager() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Partial<Artwork> | null | "new">(null);
  const [filter, setFilter] = useState("all");
  const [toast, setToast] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };
  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/artwork").catch(() => null);
    if (r?.ok) setArtworks(await r.json());
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleSave = async (data: Partial<Artwork>, imageFile?: File) => {
    let imageAssetId: string | undefined;
    if (imageFile) {
      const configRes = await fetch("/api/admin/upload-config");
      if (!configRes.ok) throw new Error("Could not get upload config");
      const { token, dataset, apiVersion } = await configRes.json();
      const assetData = await new Promise<{ _id: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `https://mwzx64sx.api.sanity.io/v${apiVersion}/assets/images/${dataset}?filename=${encodeURIComponent(imageFile.name)}`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.setRequestHeader("Content-Type", imageFile.type || "image/jpeg");
        xhr.onload = () => { if (xhr.status >= 200 && xhr.status < 300) { try { resolve(JSON.parse(xhr.responseText).document); } catch { reject(new Error("Bad response")); } } else { reject(new Error(`Upload failed: ${xhr.status}`)); } };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(imageFile);
      });
      imageAssetId = assetData._id;
    }
    const isNew = !(modal as Artwork)?._id;
    const payload = { ...data, ...(imageAssetId ? { imageAssetId } : {}) };
    const r = await fetch("/api/admin/artwork", { method: isNew ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (r.ok) { showToast(isNew ? "Artwork added!" : "Artwork updated!"); setModal(null); load(); }
    else { const err = await r.json().catch(() => ({})); throw new Error(err.error || "Save failed"); }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    const r = await fetch(`/api/admin/artwork?id=${id}`, { method: "DELETE" });
    if (r.ok) { showToast("Artwork deleted"); load(); } else showToast("Delete failed");
    setDeleting(null);
  };

  const filtered = artworks.filter(a => {
    if (filter === "all") return true; if (filter === "available") return a.status === "available";
    if (filter === "sold") return a.status === "sold"; if (filter === "featured") return a.featured;
    return a.category === filter;
  });
  const filters = [{ key: "all", label: "All" }, { key: "available", label: "Available" }, { key: "featured", label: "Featured" }, { key: "sold", label: "Sold" }, { key: "fine-art", label: "Fine Art" }, { key: "watercolor", label: "Watercolor" }];

  return (
    <div>
      {toast && <div style={{ position: "fixed", top: 20, right: 20, zIndex: 2000, background: C.terra, color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: "0 8px 30px rgba(0,0,0,0.4)" }}>{toast}</div>}
      {modal != null && <ArtworkModal artwork={modal === "new" ? {} : modal as Artwork} onClose={() => setModal(null)} onSave={handleSave} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: C.text, margin: 0 }}>Gallery</h2>
          <p style={{ color: C.muted, fontSize: 12, margin: "4px 0 0" }}>{artworks.length} artworks · {artworks.filter(a => a.status === "available").length} available</p>
        </div>
        <button onClick={() => setModal("new")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: C.terra, border: "none", borderRadius: 10, color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600 }}>+ Add Artwork</button>
      </div>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 20, paddingBottom: 4 }}>
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${filter === f.key ? C.terra : C.border}`, background: filter === f.key ? "rgba(196,125,90,0.15)" : "transparent", color: filter === f.key ? C.terra : C.muted, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0 }}>{f.label}</button>
        ))}
      </div>
      {loading ? <div style={{ textAlign: "center", color: C.muted, padding: 60 }}>Loading artworks...</div>
      : filtered.length === 0 ? <div style={{ textAlign: "center", padding: 60, border: `2px dashed ${C.border2}`, borderRadius: 16, color: C.muted }}><div style={{ fontSize: 40, marginBottom: 12 }}>🖼️</div><p style={{ fontSize: 14 }}>No artworks yet. Click "Add Artwork" to get started.</p></div>
      : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {filtered.map(art => (
            <div key={art._id} style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", transition: "border-color 0.2s" }}>
              <div style={{ aspectRatio: "4/3", background: C.bg3, position: "relative", overflow: "hidden" }}>
                {art.imageUrl ? <img src={art.imageUrl} alt={art.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: C.dim, fontSize: 12, fontStyle: "italic" }}>No image</div>}
                <div style={{ position: "absolute", top: 10, right: 10, padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: art.status === "available" ? "rgba(139,154,126,0.9)" : art.status === "sold" ? "rgba(196,125,90,0.9)" : "rgba(42,37,32,0.9)", color: "#fff" }}>{art.status || "available"}</div>
                {art.featured && <div style={{ position: "absolute", top: 10, left: 10, padding: "3px 8px", borderRadius: 20, fontSize: 9, fontWeight: 700, background: "rgba(196,168,110,0.9)", color: "#fff" }}>★ Featured</div>}
              </div>
              <div style={{ padding: "14px 16px" }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: C.text, marginBottom: 3 }}>{art.title}</div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>{[art.medium, art.dimensions].filter(Boolean).join(" · ")}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 600, color: C.terra }}>{art.price ? `$${art.price.toLocaleString()}` : "—"}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setModal(art)} style={{ padding: "5px 12px", background: "none", border: `1px solid ${C.border2}`, borderRadius: 6, color: C.muted, cursor: "pointer", fontFamily: "inherit", fontSize: 11 }}>Edit</button>
                    <button onClick={() => handleDelete(art._id, art.title)} disabled={deleting === art._id} style={{ padding: "5px 10px", background: "none", border: "1px solid rgba(196,125,90,0.2)", borderRadius: 6, color: C.terra, cursor: "pointer", fontFamily: "inherit", fontSize: 11, opacity: deleting === art._id ? 0.5 : 1 }}>{deleting === art._id ? "..." : "✕"}</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Events Manager ───
function EventsManager() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Event> | null>(null);
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => { setLoading(true); const r = await fetch("/api/admin/events").catch(() => null); if (r?.ok) setEvents(await r.json()); setLoading(false); }, []);
  useEffect(() => { load(); }, [load]);
  const save = async () => {
    if (!editing?.title || !editing?.date) return alert("Title and date are required");
    setSaving(true);
    const isNew = !editing._id;
    const r = await fetch("/api/admin/events", { method: isNew ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing) });
    if (r.ok) { setEditing(null); load(); } else alert("Save failed");
    setSaving(false);
  };
  const del = async (id: string, title: string) => { if (!confirm(`Delete "${title}"?`)) return; await fetch(`/api/admin/events?id=${id}`, { method: "DELETE" }); load(); };
  const inputStyle = { width: "100%", padding: "9px 12px", background: C.bg3, border: `1px solid ${C.border2}`, borderRadius: 8, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const };
  const labelStyle = { fontSize: 11, color: C.muted, display: "block", marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: "0.07em" };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: C.text, margin: 0 }}>Events</h2>
        <button onClick={() => setEditing({})} style={{ padding: "10px 20px", background: C.terra, border: "none", borderRadius: 10, color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600 }}>+ Add Event</button>
      </div>
      {editing != null && (
        <div onClick={() => setEditing(null)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(10,9,6,0.9)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 20, width: "100%", maxWidth: 520, padding: 28 }}>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: C.text, marginBottom: 20 }}>{editing._id ? "Edit Event" : "Add Event"}</h3>
            <div style={{ display: "grid", gap: 14 }}>
              <div><label style={labelStyle}>Event Name *</label><input value={editing.title || ""} onChange={e => setEditing(p => ({ ...p, title: e.target.value }))} style={inputStyle} /></div>
              <div><label style={labelStyle}>Date *</label><input type="date" value={editing.date || ""} onChange={e => setEditing(p => ({ ...p, date: e.target.value }))} style={inputStyle} /></div>
              <div><label style={labelStyle}>Location</label><input value={editing.location || ""} onChange={e => setEditing(p => ({ ...p, location: e.target.value }))} style={inputStyle} placeholder="e.g. CityArts Orlando" /></div>
              <div><label style={labelStyle}>Type</label>
                <select value={editing.type || ""} onChange={e => setEditing(p => ({ ...p, type: e.target.value }))} style={inputStyle}>
                  <option value="">Select type</option><option value="exhibition">Exhibition</option><option value="festival">Art Festival</option><option value="open-house">Studio Open House</option><option value="workshop">Workshop</option><option value="other">Other</option>
                </select></div>
              <div><label style={labelStyle}>RSVP URL</label><input type="url" value={editing.rsvpUrl || ""} onChange={e => setEditing(p => ({ ...p, rsvpUrl: e.target.value }))} style={inputStyle} placeholder="https://..." /></div>
              <div><label style={labelStyle}>Description</label><textarea value={editing.description || ""} onChange={e => setEditing(p => ({ ...p, description: e.target.value }))} style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} /></div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => setEditing(null)} style={{ padding: "9px 20px", background: "none", border: `1px solid ${C.border2}`, borderRadius: 8, color: C.muted, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
              <button onClick={save} disabled={saving} style={{ padding: "9px 24px", background: C.terra, border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>{saving ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </div>
      )}
      {loading ? <div style={{ color: C.muted, padding: 40, textAlign: "center" }}>Loading...</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {events.length === 0 && <div style={{ color: C.muted, padding: 40, textAlign: "center", border: `2px dashed ${C.border2}`, borderRadius: 12 }}>No events. Click "Add Event" to get started.</div>}
          {events.map(evt => {
            const d = new Date(evt.date + "T00:00:00");
            return (
              <div key={evt._id} style={{ display: "grid", gridTemplateColumns: "80px 1fr auto", gap: 16, alignItems: "center", padding: "16px 20px", background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: C.terra, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>{d.toLocaleString("en", { month: "short" })}</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: C.text, lineHeight: 1.1 }}>{String(d.getDate()).padStart(2, "0")}</div>
                </div>
                <div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: C.text }}>{evt.title}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{evt.location}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setEditing(evt)} style={{ padding: "6px 12px", background: "none", border: `1px solid ${C.border2}`, borderRadius: 6, color: C.muted, cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>Edit</button>
                  <button onClick={() => del(evt._id, evt.title)} style={{ padding: "6px 10px", background: "none", border: "1px solid rgba(196,125,90,0.2)", borderRadius: 6, color: C.terra, cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Shop Manager ───
function ShopManager() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); const r = await fetch("/api/admin/shop").catch(() => null); if (r?.ok) setItems(await r.json()); setLoading(false); }, []);
  useEffect(() => { load(); }, [load]);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: C.text, margin: 0 }}>Shop</h2>
        <button style={{ padding: "10px 20px", background: C.terra, border: "none", borderRadius: 10, color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600 }}>+ Add Item</button>
      </div>
      {loading ? <div style={{ color: C.muted, padding: 40, textAlign: "center" }}>Loading...</div> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
          {items.length === 0 && <div style={{ gridColumn: "1/-1", color: C.muted, padding: 40, textAlign: "center", border: `2px dashed ${C.border2}`, borderRadius: 12 }}>No shop items yet.</div>}
          {items.map(item => (
            <div key={item._id} style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
              {item.imageUrl && <img src={item.imageUrl} alt={item.title} style={{ width: "100%", height: 160, objectFit: "cover" }} />}
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 14, color: C.text, marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>{item.medium}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: C.terra, fontWeight: 700 }}>${item.price}</span>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: item.inStock ? "rgba(139,154,126,0.2)" : "rgba(196,125,90,0.2)", color: item.inStock ? C.sage : C.terra }}>{item.inStock ? "In Stock" : "Out"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SITE EDITOR — Page-based tabbed content editor
// ═══════════════════════════════════════════════════════

// Shared section/field components
function EditorSection({ title, desc, icon, children, defaultOpen = false }: {
  title: string; desc?: string; icon: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 16, marginBottom: 12, overflow: "hidden" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "18px 22px",
        background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left",
      }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: C.text }}>{title}</div>
          {desc && <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{desc}</div>}
        </div>
        <span style={{ color: C.muted, fontSize: 18, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }}>▾</span>
      </button>
      {open && <div style={{ padding: "0 22px 22px", borderTop: `1px solid ${C.border}` }}>{children}</div>}
    </div>
  );
}

function ContentField({ label, value, onChange, onSave, saving, saved, multi, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; onSave: () => void;
  saving: boolean; saved: boolean; multi?: boolean; placeholder?: string;
}) {
  const inputStyle = { flex: 1, padding: "9px 12px", background: C.bg3, border: `1px solid ${C.border2}`, borderRadius: 8, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none" } as const;
  return (
    <div style={{ marginBottom: 14, marginTop: 14 }}>
      <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</label>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        {multi
          ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} placeholder={placeholder} />
          : <input value={value} onChange={e => onChange(e.target.value)} style={inputStyle} placeholder={placeholder} />}
        <button onClick={onSave} disabled={saving} style={{
          padding: "9px 16px", background: saved ? C.sage : C.terra, border: "none", borderRadius: 8,
          color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0,
          transition: "background 0.2s",
        }}>{saving ? "..." : saved ? "✓" : "Save"}</button>
      </div>
    </div>
  );
}

function PageTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "10px 22px", borderRadius: "10px 10px 0 0", border: `1px solid ${active ? C.border2 : "transparent"}`,
      borderBottom: active ? `2px solid ${C.terra}` : "2px solid transparent",
      background: active ? C.bg2 : "transparent", color: active ? C.terra : C.muted,
      cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: active ? 600 : 400,
      transition: "all 0.2s",
    }}>{label}</button>
  );
}

// ─── Hero Frame Image Upload ───
function HeroFrameUpload({ label, fieldName, preview, onUploaded }: {
  label: string; fieldName: string; preview?: string; onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(preview);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (preview) setPreviewUrl(preview); }, [preview]);

  const handleFile = async (file: File) => {
    setUploading(true); setProgress(0);
    try {
      const configRes = await fetch("/api/admin/upload-config");
      const { token, dataset, apiVersion } = await configRes.json();
      const assetData = await new Promise<{ _id: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `https://mwzx64sx.api.sanity.io/v${apiVersion}/assets/images/${dataset}?filename=${encodeURIComponent(file.name)}`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.setRequestHeader("Content-Type", file.type || "image/jpeg");
        xhr.upload.onprogress = e => { if (e.lengthComputable) setProgress(Math.round(e.loaded / e.total * 100)); };
        xhr.onload = () => { if (xhr.status >= 200 && xhr.status < 300) { try { resolve(JSON.parse(xhr.responseText).document); } catch { reject(); } } else { reject(); } };
        xhr.onerror = reject;
        xhr.send(file);
      });
      await fetch("/api/admin/settings", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: fieldName, imageAssetId: assetData._id }),
      });
      const reader = new FileReader();
      reader.onload = e => { setPreviewUrl(e.target?.result as string); onUploaded(e.target?.result as string); };
      reader.readAsDataURL(file);
      setDone(true); setTimeout(() => setDone(false), 2500);
    } catch { alert("Upload failed"); }
    finally { setUploading(false); setProgress(0); }
  };

  return (
    <div style={{ flex: "1 1 140px", minWidth: 140 }}>
      <label style={{ fontSize: 10, color: C.muted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</label>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
      <div onClick={() => !uploading && inputRef.current?.click()} style={{
        width: "100%", aspectRatio: "3/4", borderRadius: 10, overflow: "hidden", cursor: "pointer",
        background: C.bg3, border: `2px dashed ${done ? C.sage : C.border2}`,
        display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
        transition: "border-color 0.2s",
      }}>
        {previewUrl ? (
          <img src={previewUrl} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ textAlign: "center", padding: 8 }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>🖼️</div>
            <div style={{ fontSize: 10, color: C.dim }}>Click to upload</div>
          </div>
        )}
        {uploading && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(10,9,6,0.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <div style={{ width: 60, height: 3, background: C.bg, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: C.terra, transition: "width 0.3s" }} />
            </div>
            <div style={{ fontSize: 10, color: C.muted }}>{progress}%</div>
          </div>
        )}
        {done && !uploading && (
          <div style={{ position: "absolute", top: 6, right: 6, background: C.sage, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>✓</div>
        )}
      </div>
    </div>
  );
}

// ─── Main Site Editor ───
function SiteEditor() {
  const [activePage, setActivePage] = useState<EditorPage>("homepage");
  const [pageContent, setPageContent] = useState<Record<string, any>>({});
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [artist, setArtist] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [portraitPreview, setPortraitPreview] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const portraitRef = useRef<HTMLInputElement>(null);
  const [statSaving, setStatSaving] = useState(false);
  const [statSaved, setStatSaved] = useState(false);
  const defaultStats = [
    { value: 40, suffix: "+", label: "Years Creating Art" },
    { value: 14, suffix: "+", label: "Years Exhibiting" },
    { value: 8, suffix: "", label: "Major Clients" },
    { value: 5, suffix: "", label: "States Exhibited" },
  ];
  const [localStats, setLocalStats] = useState<any[]>(defaultStats);
  const [heroPreview1, setHeroPreview1] = useState<string | undefined>();
  const [heroPreview2, setHeroPreview2] = useState<string | undefined>();
  const [heroPreview3, setHeroPreview3] = useState<string | undefined>();

  // Local field state for all editable fields
  const [fields, setFields] = useState<Record<string, string>>({});
  const setField = (key: string, val: string) => setFields(p => ({ ...p, [key]: val }));

  // Load all data
  useEffect(() => {
    Promise.all([
      fetch("/api/admin/page-content").then(r => r.json()).catch(() => ({})),
      fetch("/api/admin/settings").then(r => r.json()).catch(() => ({})),
      fetch("/api/admin/artist").then(r => r.json()).catch(() => ({})),
    ]).then(([pc, s, a]) => {
      setPageContent(pc || {});
      setSettings(s || {});
      setArtist(a || {});

      // Default values for all page content fields (shown when Sanity document is empty)
      const fieldDefaults: Record<string, string> = {
        "homeHero.ctaPrimary": "Explore the Gallery", "homeHero.ctaSecondary": "Shop Originals & Prints",
        "homeGallery.eyebrow": "Featured Works", "homeGallery.title": "The Collection",
        "homeGallery.description": "From watercolors of historic Florida architecture to bold mixed-media explorations — each piece carries emotion, story, and soul.",
        "homeGallery.ctaText": "View Full Collection",
        "homeAbout.eyebrow": "The Artist", "homeAbout.heading": "From AOL & Disney to Fine Art",
        "homeAbout.paragraph1": "Born in Towson, Maryland, and raised in Winter Park, Florida, Carolyn Jenkins has been painting and creating since childhood. Her artistic journey spans from the Maitland Center of the Arts and Rollins College to founding her own design firm, Storm Hill Studio.",
        "homeAbout.paragraph2": "Her commercial career began in the pre-digital era at Tom Griffin Commercial Art Studio in Winter Park. She went on to create original icon art for AOL's early user interface, design menus for Walt Disney World and Darden Restaurants, illustrate for the Wayne Taylor Indy Racing team, and create packaging for brands like Juice Bowl.",
        "homeAbout.paragraph3": "Now based in {studioLocation}, Carolyn continues to create works in acrylic and watercolor, with over fourteen years exhibiting in art festivals across Florida.",
        "homeCommercial.eyebrow": "Commercial Work", "homeCommercial.title": "Design & Illustration",
        "homeCommercial.description": "Decades of professional design work for iconic brands.",
        "homeShop.eyebrow": "Shop", "homeShop.title": "Bring Art Home",
        "homeShop.description": "Original paintings, limited edition prints, and commissions. Each piece ships with a certificate of authenticity.",
        "homeEvents.eyebrow": "Community", "homeEvents.title": "Shows & Events",
        "homeEvents.description": "Join Carolyn at upcoming exhibitions, art festivals, and studio events.",
        "homeContact.eyebrow": "Get in Touch", "homeContact.title": "Let's Connect",
        "homeContact.description": "Interested in a commission, a purchase, or just want to talk art? Reach out anytime.",
        "aboutHero.eyebrow": "Artist & Designer",
        "aboutHero.subtitle": "From the pre-digital art studios of Winter Park to AOL, Disney World, and award-winning fine art exhibitions across America.",
        "aboutOrigin.eyebrow": "The Beginning", "aboutOrigin.heading": "Born to Create",
        "aboutOrigin.paragraph1": "Born in Towson, Maryland, and raised in Winter Park, Florida, I have been painting and creating since childhood. My artistic journey has taken me from the Maitland Center of the Arts and Rollins College to establishing my own design firm, Storm Hill Studio.",
        "aboutOrigin.paragraph2": "Now based in Deltona, I continue to create works in acrylic and watercolor, drawing inspiration from a lifetime of artistic exploration.",
        "aboutSacrifice.heading": "The Sacrifice",
        "aboutSacrifice.paragraph1": "In 1972, I was accepted into the prestigious Ringling School of Art. However, faced with a family emergency, I chose to redirect my college funds to pay for my Godmother's life-saving open-heart surgery.",
        "aboutSacrifice.highlight": "That decision blessed me with her presence for another twenty years.",
        "aboutSacrifice.closing": "Today, I create with a sense of gratitude and freedom, aiming to learn without judgment and share the joy of art with others.",
        "aboutCareer.eyebrow": "Commercial Design & Illustration", "aboutCareer.heading": "The Professional Journey",
        "aboutCareer.description": "My career began in the pre-digital era at Tom Griffin Commercial Art Studio in Winter Park, specializing in hand-drawn designs for packaging, logos, and brochures.",
        "aboutExhibitions.eyebrow": "Fine Art & Exhibitions", "aboutExhibitions.heading": "Returning to the Canvas",
        "aboutExhibitions.paragraph1": "In addition to commercial work, I have spent over fourteen years exhibiting in art festivals across Florida, earning multiple awards for my watercolor paintings — including 1st, 2nd, 3rd place and Honorable Mentions for detailed watercolors of old buildings and Victorian-era houses.",
        "aboutExhibitions.paragraph2": "I entered a show in Orlando benefiting Harbor House, a haven for domestic abuse survivors. Out of 4,000 entries, only three hundred were chosen. My work was among them.",
        "aboutExhibitions.paragraph3": "My work has been featured in gallery exhibits including City Arts Orlando. I am currently an active member of the West Volusia Artists.",
        "aboutQuote.text": "What I tell anyone who wants to create is simple: Do it. It doesn't matter what others think — create for yourself. It is good for the soul and well-being. Feel the freedom!",
        "aboutQuote.attribution": "Carolyn Jenkins",
        "aboutPersonalNote.eyebrow": "A Personal Note", "aboutPersonalNote.heading": "Gratitude & Freedom",
        "aboutPersonalNote.paragraph1": "My path as an artist has been defined by both passion and sacrifice. The decision to forgo Ringling in 1972 shaped everything that followed — it taught me that art is not just what you put on canvas, but the choices you make with your life.",
        "aboutPersonalNote.paragraph2": "I am not inspired by any single artist. I feel if I was, I would just be considered a copier. I proceed because it's my way naturally — to project my emotions, my method of communication, my heart and soul.",
        "aboutPersonalNote.paragraph3": "I love to utilize recycled pieces in some of my paintings and explore as far as I can with my work. Every day I paint, I exceed my own limitations and imagination.",
        "aboutPersonalNote.ctaPrimary": "View My Work", "aboutPersonalNote.ctaSecondary": "Get in Touch",
        "galleryPage.heading": "The Gallery", "galleryPage.subtitle": "Original paintings, watercolors, and mixed-media works",
        "galleryPage.ctaBannerHeading": "Interested in a piece?",
        "galleryPage.ctaBannerDescription": "Originals, prints, and custom commissions available. Every piece ships with a certificate of authenticity.",
        "galleryPage.ctaPrimary": "Commission a Piece", "galleryPage.ctaSecondary": "Browse the Shop",
        "settings.heroTitle": "Art from the Soul", "settings.heroSubtitle": "",
        "settings.newsletterHeading": "Stay in the Studio",
        "settings.newsletterText": "New works, behind-the-scenes stories, and exhibition announcements — delivered to your inbox.",
        "settings.footerText": "© 2026 Palm Art Studio — Carolyn Jenkins. All rights reserved.",
        "settings.siteTitle": "Palm Art Studio", "settings.siteDescription": "",
        "settings.announcementText": "", "settings.announcementLink": "",
        "artist.name": "Carolyn Jenkins", "artist.tagline": "Artist & Designer",
        "artist.studioLocation": "Deltona, FL", "artist.phone": "(352) 217-9709",
        "artist.email": "cj@palmartstudio.com", "artist.quote": "It doesn't matter what others think—create for yourself. It is good for the soul and well-being. Feel the freedom!",
      };

      // Start with defaults, then overlay with actual Sanity data
      const flat: Record<string, string> = { ...fieldDefaults };
      for (const [section, obj] of Object.entries(pc || {})) {
        if (obj && typeof obj === "object" && !Array.isArray(obj) && section !== "_id" && section !== "_type" && section !== "_rev" && section !== "_createdAt" && section !== "_updatedAt") {
          for (const [key, val] of Object.entries(obj as Record<string, any>)) {
            if (typeof val === "string") flat[`${section}.${key}`] = val;
          }
        }
      }
      // Flatten settings (overlay on defaults)
      for (const [key, val] of Object.entries(s || {})) {
        if (typeof val === "string") flat[`settings.${key}`] = val;
      }
      // Flatten artist (overlay on defaults)
      for (const [key, val] of Object.entries(a || {})) {
        if (typeof val === "string") flat[`artist.${key}`] = val;
      }
      setFields(flat);

      // Load stats from Sanity or use defaults
      if (pc?.aboutStats && Array.isArray(pc.aboutStats) && pc.aboutStats.length > 0) {
        setLocalStats(pc.aboutStats.map((s: any) => ({ ...s })));
      }

      // Portrait preview
      if (a?.portrait?.asset?._ref) {
        fetch(`/api/admin/upload-config`).then(r => r.json()).then(({ dataset }) => {
          const refToUrl = (ref: string) => `https://cdn.sanity.io/images/mwzx64sx/${dataset}/${ref.replace("image-","").replace(/-(\w+)$/,".$1")}`;
          setPortraitPreview(refToUrl(a.portrait.asset._ref));
        }).catch(() => {});
      }

      // Hero image previews
      fetch(`/api/admin/upload-config`).then(r => r.json()).then(({ dataset }) => {
        const refToUrl = (ref: string) => `https://cdn.sanity.io/images/mwzx64sx/${dataset}/${ref.replace("image-","").replace(/-(\w+)$/,".$1")}`;
        if (s?.heroImage1?.asset?._ref) setHeroPreview1(refToUrl(s.heroImage1.asset._ref));
        if (s?.heroImage2?.asset?._ref) setHeroPreview2(refToUrl(s.heroImage2.asset._ref));
        if (s?.heroImage3?.asset?._ref) setHeroPreview3(refToUrl(s.heroImage3.asset._ref));
      }).catch(() => {});
    }).finally(() => setLoading(false));
  }, []);

  const markSaved = (key: string) => { setSaved(key); setTimeout(() => setSaved(null), 2000); };

  // Save a pageContent field: section="homeGallery", field="title"
  const savePageField = async (section: string, field: string) => {
    const key = `${section}.${field}`;
    setSaving(key);
    await fetch("/api/admin/page-content", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section, field, value: fields[key] || "" }),
    });
    setSaving(null); markSaved(key);
  };

  // Save a settings field
  const saveSettingsField = async (field: string) => {
    const key = `settings.${field}`;
    setSaving(key);
    await fetch("/api/admin/settings", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field, value: fields[key] || "" }),
    });
    setSaving(null); markSaved(key);
  };

  // Save an artist field
  const saveArtistField = async (field: string) => {
    const key = `artist.${field}`;
    setSaving(key);
    await fetch("/api/admin/artist", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field, value: fields[key] || "" }),
    });
    setSaving(null); markSaved(key);
  };

  // Portrait upload handler
  const handlePortraitUpload = async (file: File) => {
    setUploading(true); setUploadProgress(0);
    try {
      const configRes = await fetch("/api/admin/upload-config");
      const { token, dataset, apiVersion } = await configRes.json();
      const assetData = await new Promise<{ _id: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `https://mwzx64sx.api.sanity.io/v${apiVersion}/assets/images/${dataset}?filename=${encodeURIComponent(file.name)}`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.setRequestHeader("Content-Type", file.type || "image/jpeg");
        xhr.upload.onprogress = e => { if (e.lengthComputable) setUploadProgress(Math.round(e.loaded / e.total * 100)); };
        xhr.onload = () => { if (xhr.status >= 200 && xhr.status < 300) { try { resolve(JSON.parse(xhr.responseText).document); } catch { reject(); } } else { reject(); } };
        xhr.onerror = reject;
        xhr.send(file);
      });
      await fetch("/api/admin/artist", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: "portrait", imageAssetId: assetData._id }),
      });
      const reader = new FileReader();
      reader.onload = e => setPortraitPreview(e.target?.result as string);
      reader.readAsDataURL(file);
      markSaved("portrait");
    } catch { alert("Upload failed"); }
    finally { setUploading(false); setUploadProgress(0); }
  };

  // Helper: create a page-content field component
  const PF = (section: string, field: string, label: string, multi?: boolean, placeholder?: string) => {
    const key = `${section}.${field}`;
    return <ContentField label={label} value={fields[key] || ""} onChange={v => setField(key, v)}
      onSave={() => savePageField(section, field)} saving={saving === key} saved={saved === key} multi={multi} placeholder={placeholder} />;
  };
  // Helper: settings field
  const SF = (field: string, label: string, multi?: boolean) => {
    const key = `settings.${field}`;
    return <ContentField label={label} value={fields[key] || ""} onChange={v => setField(key, v)}
      onSave={() => saveSettingsField(field)} saving={saving === key} saved={saved === key} multi={multi} />;
  };
  // Helper: artist field
  const AF = (field: string, label: string, multi?: boolean) => {
    const key = `artist.${field}`;
    return <ContentField label={label} value={fields[key] || ""} onChange={v => setField(key, v)}
      onSave={() => saveArtistField(field)} saving={saving === key} saved={saved === key} multi={multi} />;
  };

  // Social links saver (special case — array field)
  const SocialField = ({ platform, linkKey }: { platform: string; linkKey: string }) => {
    const currentLinks: any[] = artist.socialLinks || [];
    const existing = currentLinks.find((s: any) => s.platform === platform);
    const [val, setVal] = useState(existing?.url || "");
    const isSaving = saving === linkKey;
    const isSaved = saved === linkKey;
    const saveSocial = async () => {
      setSaving(linkKey);
      const updated = [...currentLinks.filter((s: any) => s.platform !== platform)];
      if (val) updated.push({ platform, url: val, label: platform.slice(0, 2).toUpperCase() });
      await fetch("/api/admin/artist", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: "socialLinks", value: updated }),
      });
      setArtist((a: any) => ({ ...a, socialLinks: updated }));
      setSaving(null); markSaved(linkKey);
    };
    return (
      <div style={{ marginBottom: 14, marginTop: 14 }}>
        <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em" }}>{platform} URL</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={val} onChange={e => setVal(e.target.value)} placeholder="https://..."
            style={{ flex: 1, padding: "9px 12px", background: C.bg3, border: `1px solid ${C.border2}`, borderRadius: 8, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
          <button onClick={saveSocial} disabled={isSaving} style={{
            padding: "9px 16px", background: isSaved ? C.sage : C.terra, border: "none", borderRadius: 8,
            color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
          }}>{isSaving ? "..." : isSaved ? "✓" : "Save"}</button>
        </div>
      </div>
    );
  };

  if (loading) return <div style={{ color: C.muted, padding: 60, textAlign: "center" }}>Loading site editor...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: C.text, margin: 0 }}>Site Editor</h2>
          <p style={{ color: C.muted, fontSize: 12, margin: "4px 0 0" }}>Edit every section of your website — page by page</p>
        </div>
      </div>

      {/* Page tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${C.border}`, overflowX: "auto" }}>
        <PageTab label="🏠 Homepage" active={activePage === "homepage"} onClick={() => setActivePage("homepage")} />
        <PageTab label="👩‍🎨 About" active={activePage === "about"} onClick={() => setActivePage("about")} />
        <PageTab label="🖼️ Gallery" active={activePage === "gallery"} onClick={() => setActivePage("gallery")} />
        <PageTab label="⚙️ Global" active={activePage === "global"} onClick={() => setActivePage("global")} />
      </div>

      {/* ═══ HOMEPAGE TAB ═══ */}
      {activePage === "homepage" && (
        <div>
          <EditorSection title="Hero Section" desc="The first thing visitors see" icon="🌅" defaultOpen>
            {SF("heroTitle", "Hero Title")}
            {SF("heroSubtitle", "Hero Subtitle", true)}
            {PF("homeHero", "ctaPrimary", "Primary Button Text")}
            {PF("homeHero", "ctaSecondary", "Secondary Button Text")}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
              <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.07em" }}>Hero Frame Images</label>
              <p style={{ fontSize: 12, color: C.dim, marginBottom: 14, marginTop: 0 }}>These three images appear in the hero section frames. Best size: portrait orientation, at least 600×750px.</p>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <HeroFrameUpload label="Featured Artwork" fieldName="heroImage1" preview={heroPreview1} onUploaded={setHeroPreview1} />
                <HeroFrameUpload label="Recent Work" fieldName="heroImage2" preview={heroPreview2} onUploaded={setHeroPreview2} />
                <HeroFrameUpload label="Daily Study" fieldName="heroImage3" preview={heroPreview3} onUploaded={setHeroPreview3} />
              </div>
            </div>
          </EditorSection>

          <EditorSection title="Gallery Section" desc="Featured artwork showcase" icon="🎨">
            {PF("homeGallery", "eyebrow", "Eyebrow Text")}
            {PF("homeGallery", "title", "Section Title")}
            {PF("homeGallery", "description", "Description", true)}
            {PF("homeGallery", "ctaText", "CTA Button Text")}
          </EditorSection>

          <EditorSection title="About Section" desc="Artist bio preview on homepage" icon="📖">
            {PF("homeAbout", "eyebrow", "Eyebrow Text")}
            {PF("homeAbout", "heading", "Section Heading")}
            {PF("homeAbout", "paragraph1", "Paragraph 1", true)}
            {PF("homeAbout", "paragraph2", "Paragraph 2", true)}
            {PF("homeAbout", "paragraph3", "Paragraph 3 (use {studioLocation} for dynamic location)", true)}
          </EditorSection>

          <EditorSection title="Commercial Section" desc="Design & illustration showcase" icon="💼">
            {PF("homeCommercial", "eyebrow", "Eyebrow Text")}
            {PF("homeCommercial", "title", "Section Title")}
            {PF("homeCommercial", "description", "Description", true)}
          </EditorSection>

          <EditorSection title="Shop Section" desc="Product showcase" icon="🛒">
            {PF("homeShop", "eyebrow", "Eyebrow Text")}
            {PF("homeShop", "title", "Section Title")}
            {PF("homeShop", "description", "Description", true)}
          </EditorSection>

          <EditorSection title="Events Section" desc="Shows & community" icon="📅">
            {PF("homeEvents", "eyebrow", "Eyebrow Text")}
            {PF("homeEvents", "title", "Section Title")}
            {PF("homeEvents", "description", "Description", true)}
          </EditorSection>

          <EditorSection title="Contact Section" desc="Inquiry CTA area" icon="📬">
            {PF("homeContact", "eyebrow", "Eyebrow Text")}
            {PF("homeContact", "title", "Section Title")}
            {PF("homeContact", "description", "Description", true)}
          </EditorSection>
        </div>
      )}

      {/* ═══ ABOUT PAGE TAB ═══ */}
      {activePage === "about" && (
        <div>
          <EditorSection title="Hero Section" desc="Page header with name and tagline" icon="✨" defaultOpen>
            {PF("aboutHero", "eyebrow", "Eyebrow Tag (e.g. Artist & Designer)")}
            {PF("aboutHero", "subtitle", "Subtitle Paragraph", true)}
          </EditorSection>

          <EditorSection title="Origin Story" desc="'Born to Create' section" icon="🌱">
            {PF("aboutOrigin", "eyebrow", "Eyebrow Text")}
            {PF("aboutOrigin", "heading", "Heading")}
            {PF("aboutOrigin", "paragraph1", "Paragraph 1", true)}
            {PF("aboutOrigin", "paragraph2", "Paragraph 2", true)}
          </EditorSection>

          <EditorSection title="The Sacrifice" desc="Ringling story — emotional highlight" icon="💛">
            {PF("aboutSacrifice", "heading", "Heading")}
            {PF("aboutSacrifice", "paragraph1", "Main Paragraph", true)}
            {PF("aboutSacrifice", "highlight", "Highlighted Closing Line", true)}
            {PF("aboutSacrifice", "closing", "Closing Paragraph", true)}
          </EditorSection>

          <EditorSection title="Career Timeline" desc="Commercial design horizontal scroll" icon="💼">
            {PF("aboutCareer", "eyebrow", "Eyebrow Text")}
            {PF("aboutCareer", "heading", "Heading")}
            {PF("aboutCareer", "description", "Description", true)}
          </EditorSection>

          <EditorSection title="Stats" desc="Numbers that count up on scroll" icon="📊">
            <p style={{ color: C.dim, fontSize: 12, marginTop: 14, marginBottom: 8 }}>Edit the 4 stats shown in the green banner. Changes save to Sanity as a group.</p>
            <div>
              {localStats.map((s: any, i: number) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "80px 60px 1fr", gap: 10, alignItems: "end", marginBottom: 10, marginTop: 10 }}>
                  <div>
                    <label style={{ fontSize: 10, color: C.dim, display: "block", marginBottom: 4 }}>NUMBER</label>
                    <input type="number" value={s.value || 0} onChange={e => { const v = [...localStats]; v[i] = { ...v[i], value: parseInt(e.target.value) || 0 }; setLocalStats(v); }}
                      style={{ width: "100%", padding: "8px 10px", background: C.bg3, border: `1px solid ${C.border2}`, borderRadius: 6, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: C.dim, display: "block", marginBottom: 4 }}>SUFFIX</label>
                    <input value={s.suffix || ""} onChange={e => { const v = [...localStats]; v[i] = { ...v[i], suffix: e.target.value }; setLocalStats(v); }}
                      style={{ width: "100%", padding: "8px 10px", background: C.bg3, border: `1px solid ${C.border2}`, borderRadius: 6, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none" }} placeholder="+" />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: C.dim, display: "block", marginBottom: 4 }}>LABEL</label>
                    <input value={s.label || ""} onChange={e => { const v = [...localStats]; v[i] = { ...v[i], label: e.target.value }; setLocalStats(v); }}
                      style={{ width: "100%", padding: "8px 10px", background: C.bg3, border: `1px solid ${C.border2}`, borderRadius: 6, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                  </div>
                </div>
              ))}
              <button onClick={async () => {
                setStatSaving(true);
                await fetch("/api/admin/page-content", {
                  method: "PATCH", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ section: "aboutStats", field: "_full", value: localStats }),
                });
                setStatSaving(false); setStatSaved(true); setTimeout(() => setStatSaved(false), 2000);
              }} disabled={statSaving} style={{
                marginTop: 10, padding: "9px 20px", background: statSaved ? C.sage : C.terra, border: "none",
                borderRadius: 8, color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600,
              }}>{statSaving ? "Saving..." : statSaved ? "✓ Saved!" : "Save All Stats"}</button>
            </div>
          </EditorSection>

          <EditorSection title="Fine Art & Exhibitions" desc="Exhibition history and awards" icon="🏛️">
            {PF("aboutExhibitions", "eyebrow", "Eyebrow Text")}
            {PF("aboutExhibitions", "heading", "Heading")}
            {PF("aboutExhibitions", "paragraph1", "Paragraph 1", true)}
            {PF("aboutExhibitions", "paragraph2", "Paragraph 2", true)}
            {PF("aboutExhibitions", "paragraph3", "Paragraph 3", true)}
          </EditorSection>

          <EditorSection title="Artist Quote" desc="Full-width quote banner" icon="💬">
            {PF("aboutQuote", "text", "Quote Text", true)}
            {PF("aboutQuote", "attribution", "Attribution")}
          </EditorSection>

          <EditorSection title="Personal Note" desc="Closing personal statement" icon="✍️">
            {PF("aboutPersonalNote", "eyebrow", "Eyebrow Text")}
            {PF("aboutPersonalNote", "heading", "Heading")}
            {PF("aboutPersonalNote", "paragraph1", "Paragraph 1", true)}
            {PF("aboutPersonalNote", "paragraph2", "Paragraph 2", true)}
            {PF("aboutPersonalNote", "paragraph3", "Paragraph 3", true)}
            {PF("aboutPersonalNote", "ctaPrimary", "Primary CTA Button Text")}
            {PF("aboutPersonalNote", "ctaSecondary", "Secondary CTA Button Text")}
          </EditorSection>
        </div>
      )}

      {/* ═══ GALLERY PAGE TAB ═══ */}
      {activePage === "gallery" && (
        <div>
          <EditorSection title="Gallery Page Header" desc="Main heading and subtitle" icon="🖼️" defaultOpen>
            {PF("galleryPage", "heading", "Page Heading")}
            {PF("galleryPage", "subtitle", "Subtitle", true)}
          </EditorSection>

          <EditorSection title="CTA Banner" desc="Bottom call-to-action banner" icon="📢">
            {PF("galleryPage", "ctaBannerHeading", "Banner Heading")}
            {PF("galleryPage", "ctaBannerDescription", "Banner Description", true)}
            {PF("galleryPage", "ctaPrimary", "Primary Button Text")}
            {PF("galleryPage", "ctaSecondary", "Secondary Button Text")}
          </EditorSection>

          <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 12 }}>
            <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>💡 To manage artwork entries (add, edit, delete images), use the <strong style={{ color: C.terra }}>Gallery</strong> tab in the sidebar.</p>
          </div>
        </div>
      )}

      {/* ═══ GLOBAL SETTINGS TAB ═══ */}
      {activePage === "global" && (
        <div>
          <EditorSection title="Artist Portrait & Hero Image" desc="Main photo shown across the site" icon="📷" defaultOpen>
            <input ref={portraitRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handlePortraitUpload(f); e.target.value = ""; }} />
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap", marginTop: 14 }}>
              <div onClick={() => !uploading && portraitRef.current?.click()} style={{
                width: 160, height: 200, borderRadius: 12, overflow: "hidden", cursor: "pointer",
                background: C.bg3, border: `2px dashed ${saved === "portrait" ? C.sage : C.border2}`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative",
              }}>
                {portraitPreview
                  ? <img src={portraitPreview} alt="Portrait" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ textAlign: "center", padding: 12 }}><div style={{ fontSize: 28, marginBottom: 6 }}>📷</div><div style={{ fontSize: 11, color: C.muted }}>Click to upload</div></div>}
                {uploading && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(10,9,6,0.8)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <div style={{ width: 80, height: 4, background: C.bg3, borderRadius: 2, overflow: "hidden" }}><div style={{ height: "100%", width: `${uploadProgress}%`, background: C.terra, transition: "width 0.3s" }} /></div>
                    <div style={{ fontSize: 11, color: C.muted }}>{uploadProgress}%</div>
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.6, marginTop: 0 }}>This photo appears as the main hero image on the homepage and in the About section. Best size: portrait orientation, at least 800×1000px.</p>
                <button onClick={() => portraitRef.current?.click()} disabled={uploading} style={{
                  padding: "10px 20px", background: C.terra, border: "none", borderRadius: 8,
                  color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600,
                }}>{uploading ? `Uploading ${uploadProgress}%...` : saved === "portrait" ? "✓ Uploaded!" : "Choose Photo"}</button>
              </div>
            </div>
          </EditorSection>

          <EditorSection title="Artist Info" desc="Name, location, contact details" icon="👩‍🎨">
            {AF("name", "Artist Name")}
            {AF("tagline", "Tagline")}
            {AF("studioLocation", "Studio Location")}
            {AF("phone", "Phone Number")}
            {AF("email", "Email Address")}
            {AF("quote", "Artist Quote", true)}
          </EditorSection>

          <EditorSection title="Social Links" desc="URLs for social media icons" icon="🔗">
            <SocialField platform="TikTok" linkKey="tiktokUrl" />
            <SocialField platform="Instagram" linkKey="instagramUrl" />
            <SocialField platform="Saatchi Art" linkKey="saatchiUrl" />
            <SocialField platform="Facebook" linkKey="facebookUrl" />
          </EditorSection>

          <EditorSection title="Newsletter" desc="Email capture section" icon="📰">
            {SF("newsletterHeading", "Heading")}
            {SF("newsletterText", "Description", true)}
          </EditorSection>

          <EditorSection title="Footer" desc="Copyright text" icon="📄">
            {SF("footerText", "Copyright Text")}
          </EditorSection>

          <EditorSection title="Announcement Banner" desc="Optional top banner (leave blank to hide)" icon="📢">
            {SF("announcementText", "Banner Text")}
            {SF("announcementLink", "Banner Link URL")}
          </EditorSection>

          <EditorSection title="SEO & Meta" desc="Search engine and social sharing" icon="🔍">
            {SF("siteTitle", "Site Title")}
            {SF("siteDescription", "Meta Description", true)}
          </EditorSection>
        </div>
      )}
    </div>
  );
}

// ─── Dashboard ───
function Dashboard({ stats, onTab }: { stats: Stats; onTab: (t: Tab) => void }) {
  const StatCard = ({ label, value, accent, onClick }: { label: string; value: string | number; accent: string; onClick?: () => void }) => (
    <div onClick={onClick} style={{
      background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 20px 16px",
      cursor: onClick ? "pointer" : "default", transition: "border-color 0.2s",
    }}>
      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: accent, lineHeight: 1, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
    </div>
  );
  const QuickLink = ({ icon, label, tab, accent }: { icon: string; label: string; tab: Tab; accent: string }) => (
    <button onClick={() => onTab(tab)} style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
      padding: "20px 12px", background: C.bg2, border: `1px solid ${C.border}`,
      borderRadius: 14, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", flex: "1 1 80px",
    }}>
      <span style={{ fontSize: 24 }}>{icon}</span>
      <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{label}</span>
      <div style={{ width: "100%", height: 2, borderRadius: 1, background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
    </button>
  );
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: C.text, margin: "0 0 4px" }}>Dashboard</h2>
        <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Palm Art Studio — {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 28 }}>
        <StatCard label="Total Artworks" value={stats.artworkCount} accent={C.terra} onClick={() => onTab("gallery")} />
        <StatCard label="Available" value={stats.availableCount} accent={C.sage} onClick={() => onTab("gallery")} />
        <StatCard label="Shop Items" value={stats.shopCount} accent={C.gold} onClick={() => onTab("shop")} />
        <StatCard label="Events" value={stats.eventCount} accent={C.cream} onClick={() => onTab("events")} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <p style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Quick Access</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <QuickLink icon="🖼️" label="Gallery" tab="gallery" accent={C.terra} />
          <QuickLink icon="🛒" label="Shop" tab="shop" accent={C.gold} />
          <QuickLink icon="📅" label="Events" tab="events" accent={C.sage} />
          <QuickLink icon="🌐" label="Site Editor" tab="site-editor" accent={C.muted} />
        </div>
      </div>
      {/* ── Big Neon Email Button ── */}
      <button onClick={() => onTab("email")} style={{
        width: "100%", padding: "22px 24px", marginBottom: 24, borderRadius: 18,
        background: "linear-gradient(135deg, rgba(196,125,90,0.12), rgba(196,168,110,0.08))",
        border: "1px solid rgba(196,125,90,0.25)", cursor: "pointer", fontFamily: "inherit",
        display: "flex", alignItems: "center", gap: 16, position: "relative", overflow: "hidden",
        boxShadow: "0 0 30px rgba(196,125,90,0.15), 0 0 60px rgba(196,125,90,0.05), inset 0 1px 0 rgba(255,255,255,0.05)",
        transition: "all 0.3s ease",
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26, background: "rgba(196,125,90,0.15)", boxShadow: "0 0 20px rgba(196,125,90,0.3)",
          animation: "emailGlow 2s ease-in-out infinite alternate",
        }}>✉️</div>
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 2 }}>Email Inbox</div>
          <div style={{ fontSize: 12, color: C.muted }}>Read, compose & manage emails</div>
        </div>
        <div style={{
          fontSize: 22, color: C.terra, fontWeight: 300, opacity: 0.6,
        }}>→</div>
        {/* Animated glow border */}
        <div style={{
          position: "absolute", inset: -1, borderRadius: 18, pointerEvents: "none",
          background: "linear-gradient(135deg, rgba(196,125,90,0.3), transparent, rgba(196,168,110,0.2))",
          opacity: 0.4, animation: "emailGlow 2s ease-in-out infinite alternate",
        }} />
      </button>
      <div style={{ marginTop: 24, padding: "14px 20px", background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>palmartstudio.com</div>
          <div style={{ fontSize: 11, color: C.muted }}>Live on Vercel</div>
        </div>
        <a href="https://palmartstudio.com" target="_blank" rel="noreferrer" style={{ padding: "8px 18px", background: "none", border: `1px solid ${C.border2}`, borderRadius: 8, color: C.muted, textDecoration: "none", fontSize: 12, fontWeight: 500 }}>View Site ↗</a>
      </div>
    </div>
  );
}

// ─── Login Screen ───
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!pw) return; setLoading(true); setError("");
    const r = await fetch("/api/admin/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
    if (r.ok) { onLogin(); } else { setError("Incorrect password"); }
    setLoading(false);
  };
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 380, textAlign: "center" }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: C.text, marginBottom: 4 }}>Palm Art Studio</div>
        <div style={{ fontSize: 12, color: C.muted, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 40 }}>Admin Access</div>
        <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 20, padding: 32 }}>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} placeholder="Enter admin password"
            style={{ width: "100%", padding: "14px 16px", background: C.bg3, border: `1px solid ${error ? C.terra : C.border2}`, borderRadius: 10, color: C.text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
          {error && <p style={{ color: C.terra, fontSize: 12, marginBottom: 12 }}>{error}</p>}
          <button onClick={submit} disabled={loading || !pw} style={{
            width: "100%", padding: "14px", background: pw ? C.terra : C.bg3, border: "none", borderRadius: 10,
            color: pw ? "#fff" : C.dim, cursor: pw ? "pointer" : "not-allowed", fontFamily: "inherit", fontSize: 14, fontWeight: 600, transition: "all 0.2s",
          }}>{loading ? "Checking..." : "Enter Studio"}</button>
        </div>
        <a href="/" style={{ display: "block", marginTop: 20, fontSize: 12, color: C.dim, textDecoration: "none" }}>← Back to site</a>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN ADMIN APP
// ═══════════════════════════════════════
export default function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [activeTab, setActiveTabRaw] = useState<Tab>("dashboard");
  // ── History-aware tab navigation (Android back button) ──
  const setActiveTab = (tab: Tab) => { if (tab !== "dashboard") { window.history.pushState({ adminTab: tab }, ""); } setActiveTabRaw(tab); };
  useEffect(() => {
    const onPop = () => {
      // Only handle back if NOT on email tab (email handles its own back flow)
      if (activeTab !== "dashboard" && activeTab !== "email") { setActiveTabRaw("dashboard"); }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [activeTab]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<Stats>({ artworkCount: 0, availableCount: 0, shopCount: 0, eventCount: 0 });

  useEffect(() => { fetch("/api/admin/auth").then(r => { setAuthed(r.ok); }).catch(() => setAuthed(false)); }, []);

  useEffect(() => {
    if (!authed) return;
    Promise.all([
      fetch("/api/admin/artwork").then(r => r.json()).catch(() => []),
      fetch("/api/admin/shop").then(r => r.json()).catch(() => []),
      fetch("/api/admin/events").then(r => r.json()).catch(() => []),
    ]).then(([art, shop, evts]) => {
      setStats({ artworkCount: art.length, availableCount: art.filter((a: Artwork) => a.status === "available").length, shopCount: shop.length, eventCount: evts.length });
    });
  }, [authed]);

  if (authed === null) return <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: C.muted, fontFamily: "'Outfit', sans-serif" }}>Loading...</div></div>;
  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  const navGroups = [
    { label: "Content", items: [
      { icon: "📊", label: "Dashboard", tab: "dashboard" as Tab },
      { icon: "🖼️", label: "Gallery", tab: "gallery" as Tab },
      { icon: "🛒", label: "Shop", tab: "shop" as Tab },
      { icon: "📅", label: "Events", tab: "events" as Tab },
    ]},
    { label: "Communication", items: [
      { icon: "✉️", label: "Email", tab: "email" as Tab },
    ]},
    { label: "Site", items: [
      { icon: "🌐", label: "Site Editor", tab: "site-editor" as Tab },
    ]},
    { label: "Account", items: [
      { icon: "⚙️", label: "Settings", tab: "settings" as Tab },
    ]},
  ];

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard": return <Dashboard stats={stats} onTab={setActiveTab} />;
      case "gallery": return <GalleryManager />;
      case "shop": return <ShopManager />;
      case "events": return <EventsManager />;
      case "email": return <AdminInbox />;
      case "site-editor": return <SiteEditor />;
      case "settings": return (
        <div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: C.text, marginBottom: 24 }}>Settings</h2>
          <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
            <p style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>Signed in as admin.</p>
            <button onClick={async () => { await fetch("/api/admin/auth", { method: "DELETE" }); setAuthed(false); }} style={{
              padding: "9px 20px", background: "none", border: `1px solid rgba(196,125,90,0.3)`, borderRadius: 8, color: C.terra, cursor: "pointer", fontFamily: "inherit", fontSize: 13,
            }}>Sign Out</button>
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { background: ${C.bg}; height: 100%; overflow-x: hidden; }
        body { font-family: 'Outfit', sans-serif; color: ${C.text}; -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { width: 4px; background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.bg3}; border-radius: 2px; }
        input, select, textarea, button { font-family: inherit; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      `}</style>

      {/* Mobile hamburger */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
        display: "none", position: "fixed", top: 16, left: 16, zIndex: 300,
        background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "10px 14px",
        cursor: "pointer", color: C.terra, fontSize: 18,
      }} id="mob-menu-btn">☰</button>

      <style>{`
        @keyframes emailGlow {
          0% { box-shadow: 0 0 15px rgba(196,125,90,0.2); opacity: 0.4; }
          100% { box-shadow: 0 0 30px rgba(196,125,90,0.4), 0 0 60px rgba(196,125,90,0.1); opacity: 0.7; }
        }
        @media (max-width: 860px) {
          #mob-menu-btn { display: block !important; }
          #admin-sidebar { transform: translateX(-100%); transition: transform 0.35s ease; }
          #admin-sidebar.open { transform: translateX(0); }
          #admin-main { margin-left: 0 !important; padding-top: env(safe-area-inset-top) !important; }
          #admin-main-inner { padding-top: 72px !important; }
        }
        @supports(padding-top: env(safe-area-inset-top)) {
          #admin-sidebar { padding-top: env(safe-area-inset-top); }
        }
      `}</style>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(10,9,6,0.7)", zIndex: 200 }} />}

      {/* Sidebar */}
      <aside id="admin-sidebar" className={sidebarOpen ? "open" : ""} style={{
        position: "fixed", top: 0, left: 0, bottom: 0, width: 240,
        background: C.bg2, borderRight: `1px solid ${C.border}`,
        display: "flex", flexDirection: "column", zIndex: 250, overflowY: "auto", paddingBottom: 24,
      }}>
        <div style={{ padding: "24px 20px 16px" }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: C.text }}>Palm Art Studio</div>
          <div style={{ fontSize: 10, color: C.dim, letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 2 }}>Admin Panel</div>
        </div>
        <div style={{ height: 1, background: C.border, margin: "0 16px 12px" }} />
        <nav style={{ flex: 1, padding: "0 12px" }}>
          {navGroups.map(group => (
            <div key={group.label} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: C.dim, letterSpacing: "0.12em", textTransform: "uppercase", padding: "4px 14px 8px", fontWeight: 600 }}>{group.label}</div>
              {group.items.map(item => (
                <NavItem key={item.tab} icon={item.icon} label={item.label} active={activeTab === item.tab}
                  onClick={() => { setActiveTab(item.tab); setSidebarOpen(false); }} />
              ))}
            </div>
          ))}
        </nav>
        <div style={{ padding: "0 16px" }}>
          <div style={{ height: 1, background: C.border, marginBottom: 12 }} />
          <a href="/" target="_blank" style={{ display: "block", padding: "8px 14px", fontSize: 12, color: C.dim, textDecoration: "none" }}>↗ View Live Site</a>
        </div>
      </aside>

      {/* Main */}
      <main id="admin-main" style={{ marginLeft: 240, minHeight: "100vh" }}>
        <div id="admin-main-inner" style={{ padding: "32px 32px 60px", maxWidth: 1200, animation: "fadeIn 0.3s ease" }}>
          {renderTab()}
        </div>
      </main>
    </>
  );
}
