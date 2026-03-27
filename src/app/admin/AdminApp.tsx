"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Tab types ───
type Tab =
  | "dashboard"
  | "gallery"
  | "shop"
  | "events"
  | "inquiries"
  | "blog"
  | "community"
  | "email"
  | "site-editor"
  | "collectors"
  | "settings";

// ─── Artwork type ───
interface Artwork {
  _id: string;
  title: string;
  medium?: string;
  dimensions?: string;
  price?: number;
  status?: string;
  category?: string;
  year?: number;
  featured?: boolean;
  description?: string;
  imageUrl?: string;
  image?: { asset: { _ref: string } };
  slug?: { current: string };
}

interface Event {
  _id: string;
  title: string;
  date: string;
  location?: string;
  type?: string;
  rsvpUrl?: string;
  description?: string;
}

interface ShopItem {
  _id: string;
  title: string;
  price: number;
  badge?: string;
  type?: string;
  inStock?: boolean;
  medium?: string;
  imageUrl?: string;
}

interface Stats {
  artworkCount: number;
  availableCount: number;
  shopCount: number;
  eventCount: number;
}

// ─── Colors ───
const C = {
  bg: "#0a0906",
  bg2: "#141210",
  bg3: "#1c1915",
  border: "rgba(245,240,232,0.06)",
  border2: "rgba(245,240,232,0.12)",
  text: "#F5F0E8",
  muted: "#8B7F72",
  dim: "#4a4440",
  terra: "#C47D5A",
  gold: "#C4A86E",
  sage: "#8B9A7E",
  cream: "#EDE7DB",
};

// ─── NavItem ───
function NavItem({ icon, label, active, onClick, badge }: {
  icon: string; label: string; active: boolean; onClick: () => void; badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        width: "100%", padding: "10px 14px", borderRadius: 10,
        border: "none", cursor: "pointer", fontFamily: "inherit",
        background: active ? `rgba(196,125,90,0.15)` : "transparent",
        color: active ? C.terra : C.muted,
        fontSize: 13, fontWeight: active ? 600 : 400,
        transition: "all 0.2s",
        borderLeft: active ? `2px solid ${C.terra}` : "2px solid transparent",
        position: "relative",
      }}
    >
      <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
      {badge != null && badge > 0 && (
        <span style={{
          background: C.terra, color: "#fff", fontSize: 10, fontWeight: 700,
          padding: "1px 6px", borderRadius: 10, minWidth: 18, textAlign: "center",
        }}>{badge}</span>
      )}
    </button>
  );
}

// ─── Upload zone ───
function UploadZone({ onFile, uploading, progress }: {
  onFile: (f: File) => void;
  uploading: boolean;
  progress: number;
}) {
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div
      onClick={() => !uploading && ref.current?.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
      style={{
        border: `2px dashed ${drag ? C.terra : C.border2}`,
        borderRadius: 12, padding: 32, textAlign: "center", cursor: uploading ? "not-allowed" : "pointer",
        background: drag ? "rgba(196,125,90,0.05)" : "transparent",
        transition: "all 0.2s", opacity: uploading ? 0.7 : 1,
      }}
    >
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
  artwork: Partial<Artwork> | null;
  onClose: () => void;
  onSave: (data: Partial<Artwork>, imageFile?: File) => Promise<void>;
}) {
  const isNew = !artwork?._id;
  const [form, setForm] = useState<Partial<Artwork>>(artwork || {});
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [imagePreview, setImagePreview] = useState<string | undefined>(artwork?.imageUrl);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const set = (k: keyof Artwork, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  const handleImage = (f: File) => {
    setImageFile(f);
    const r = new FileReader();
    r.onload = e => setImagePreview(e.target?.result as string);
    r.readAsDataURL(f);
  };

  const handleSave = async () => {
    if (!form.title) return alert("Title is required");
    setSaving(true);
    try {
      await onSave(form, imageFile);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "10px 12px", background: C.bg3, border: `1px solid ${C.border2}`,
    borderRadius: 8, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none",
    boxSizing: "border-box" as const,
  };
  const labelStyle = { display: "block", fontSize: 11, color: C.muted, marginBottom: 5, textTransform: "uppercase" as const, letterSpacing: "0.08em" };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 1000, background: "rgba(10,9,6,0.9)",
      backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 20,
        width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto",
        padding: 28,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: C.text, margin: 0 }}>
            {isNew ? "Add Artwork" : "Edit Artwork"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Title *</label>
            <input value={form.title || ""} onChange={e => set("title", e.target.value)} style={inputStyle} placeholder="Artwork title" />
          </div>
          <div>
            <label style={labelStyle}>Medium</label>
            <select value={form.medium || ""} onChange={e => set("medium", e.target.value)} style={inputStyle}>
              <option value="">Select medium</option>
              <option value="watercolor">Watercolor</option>
              <option value="acrylic">Acrylic</option>
              <option value="mixed-media">Mixed Media</option>
              <option value="oil">Oil</option>
              <option value="digital">Digital</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <select value={form.category || ""} onChange={e => set("category", e.target.value)} style={inputStyle}>
              <option value="">Select category</option>
              <option value="fine-art">Fine Art</option>
              <option value="commercial">Commercial</option>
              <option value="daily">Daily Painting</option>
              <option value="commission">Commission</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Dimensions</label>
            <input value={form.dimensions || ""} onChange={e => set("dimensions", e.target.value)} style={inputStyle} placeholder="e.g. 18 × 24 in" />
          </div>
          <div>
            <label style={labelStyle}>Year</label>
            <input type="number" value={form.year || ""} onChange={e => set("year", parseInt(e.target.value))} style={inputStyle} placeholder="2024" />
          </div>
          <div>
            <label style={labelStyle}>Price ($)</label>
            <input type="number" value={form.price || ""} onChange={e => set("price", parseFloat(e.target.value))} style={inputStyle} placeholder="1200" />
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select value={form.status || "available"} onChange={e => set("status", e.target.value)} style={inputStyle}>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="nfs">Not For Sale</option>
              <option value="print-only">Print Only</option>
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Description</label>
            <textarea value={form.description || ""} onChange={e => set("description", e.target.value)}
              style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} placeholder="Describe this artwork..." />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="checkbox" id="featured" checked={!!form.featured} onChange={e => set("featured", e.target.checked)} />
            <label htmlFor="featured" style={{ color: C.muted, fontSize: 13 }}>Featured on homepage</label>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Image</label>
          {imagePreview && (
            <div style={{ marginBottom: 12, borderRadius: 10, overflow: "hidden", maxHeight: 200 }}>
              <img src={imagePreview} alt="" style={{ width: "100%", height: 200, objectFit: "cover" }} />
            </div>
          )}
          <UploadZone onFile={handleImage} uploading={uploading} progress={uploadProgress} />
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{
            padding: "10px 24px", background: "none", border: `1px solid ${C.border2}`,
            borderRadius: 8, color: C.muted, cursor: "pointer", fontFamily: "inherit", fontSize: 13,
          }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: "10px 28px", background: C.terra, border: "none",
            borderRadius: 8, color: "#fff", cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "inherit", fontSize: 13, fontWeight: 600, opacity: saving ? 0.7 : 1,
          }}>{saving ? "Saving..." : isNew ? "Add Artwork" : "Save Changes"}</button>
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

    // Upload image first if provided
    if (imageFile) {
      const configRes = await fetch("/api/admin/upload-config");
      if (!configRes.ok) throw new Error("Could not get upload config");
      const { token, dataset, apiVersion } = await configRes.json();

      const assetData = await new Promise<{ _id: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `https://mwzx64sx.api.sanity.io/v${apiVersion}/assets/images/${dataset}?filename=${encodeURIComponent(imageFile.name)}`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.setRequestHeader("Content-Type", imageFile.type || "image/jpeg");
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText).document); } catch { reject(new Error("Bad response")); }
          } else { reject(new Error(`Upload failed: ${xhr.status}`)); }
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(imageFile);
      });
      imageAssetId = assetData._id;
    }

    const isNew = !(modal as Artwork)?._id;
    const payload = {
      ...data,
      ...(imageAssetId ? { imageAssetId } : {}),
    };

    const r = await fetch("/api/admin/artwork", {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (r.ok) {
      showToast(isNew ? "Artwork added!" : "Artwork updated!");
      setModal(null);
      load();
    } else {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.error || "Save failed");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    const r = await fetch(`/api/admin/artwork?id=${id}`, { method: "DELETE" });
    if (r.ok) { showToast("Artwork deleted"); load(); } else showToast("Delete failed");
    setDeleting(null);
  };

  const filtered = artworks.filter(a => {
    if (filter === "all") return true;
    if (filter === "available") return a.status === "available";
    if (filter === "sold") return a.status === "sold";
    if (filter === "featured") return a.featured;
    return a.category === filter;
  });

  const filters = [
    { key: "all", label: "All" },
    { key: "available", label: "Available" },
    { key: "featured", label: "Featured" },
    { key: "sold", label: "Sold" },
    { key: "fine-art", label: "Fine Art" },
    { key: "watercolor", label: "Watercolor" },
  ];

  return (
    <div>
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 2000,
          background: C.terra, color: "#fff", padding: "12px 20px", borderRadius: 10,
          fontSize: 13, fontWeight: 600, boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
        }}>{toast}</div>
      )}

      {modal != null && (
        <ArtworkModal
          artwork={modal === "new" ? {} : modal as Artwork}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: C.text, margin: 0 }}>Gallery</h2>
          <p style={{ color: C.muted, fontSize: 12, margin: "4px 0 0" }}>{artworks.length} artworks · {artworks.filter(a => a.status === "available").length} available</p>
        </div>
        <button onClick={() => setModal("new")} style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 20px", background: C.terra, border: "none",
          borderRadius: 10, color: "#fff", cursor: "pointer",
          fontFamily: "inherit", fontSize: 13, fontWeight: 600,
        }}>+ Add Artwork</button>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 20, paddingBottom: 4 }}>
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: "6px 14px", borderRadius: 20, border: `1px solid ${filter === f.key ? C.terra : C.border}`,
            background: filter === f.key ? "rgba(196,125,90,0.15)" : "transparent",
            color: filter === f.key ? C.terra : C.muted,
            cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 500,
            whiteSpace: "nowrap", flexShrink: 0,
          }}>{f.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: C.muted, padding: 60 }}>Loading artworks...</div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: "center", padding: 60, border: `2px dashed ${C.border2}`,
          borderRadius: 16, color: C.muted,
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🖼️</div>
          <p style={{ fontSize: 14 }}>No artworks yet. Click "Add Artwork" to get started.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {filtered.map(art => (
            <div key={art._id} style={{
              background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 14,
              overflow: "hidden", transition: "border-color 0.2s",
            }}>
              {/* Image */}
              <div style={{ aspectRatio: "4/3", background: C.bg3, position: "relative", overflow: "hidden" }}>
                {art.imageUrl ? (
                  <img src={art.imageUrl} alt={art.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: C.dim, fontSize: 12, fontStyle: "italic" }}>No image</div>
                )}
                {/* Status badge */}
                <div style={{
                  position: "absolute", top: 10, right: 10,
                  padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700,
                  background: art.status === "available" ? "rgba(139,154,126,0.9)" : art.status === "sold" ? "rgba(196,125,90,0.9)" : "rgba(42,37,32,0.9)",
                  color: "#fff",
                }}>{art.status || "available"}</div>
                {art.featured && (
                  <div style={{
                    position: "absolute", top: 10, left: 10,
                    padding: "3px 8px", borderRadius: 20, fontSize: 9, fontWeight: 700,
                    background: "rgba(196,168,110,0.9)", color: "#fff",
                  }}>★ Featured</div>
                )}
              </div>
              {/* Info */}
              <div style={{ padding: "14px 16px" }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: C.text, marginBottom: 3 }}>{art.title}</div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>
                  {[art.medium, art.dimensions].filter(Boolean).join(" · ")}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 600, color: C.terra }}>
                    {art.price ? `$${art.price.toLocaleString()}` : "—"}
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setModal(art)} style={{
                      padding: "5px 12px", background: "none", border: `1px solid ${C.border2}`,
                      borderRadius: 6, color: C.muted, cursor: "pointer", fontFamily: "inherit", fontSize: 11,
                    }}>Edit</button>
                    <button onClick={() => handleDelete(art._id, art.title)} disabled={deleting === art._id} style={{
                      padding: "5px 10px", background: "none", border: "1px solid rgba(196,125,90,0.2)",
                      borderRadius: 6, color: C.terra, cursor: "pointer", fontFamily: "inherit", fontSize: 11,
                      opacity: deleting === art._id ? 0.5 : 1,
                    }}>{deleting === art._id ? "..." : "✕"}</button>
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

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/events").catch(() => null);
    if (r?.ok) setEvents(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!editing?.title || !editing?.date) return alert("Title and date are required");
    setSaving(true);
    const isNew = !editing._id;
    const r = await fetch("/api/admin/events", {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    if (r.ok) { setEditing(null); load(); } else alert("Save failed");
    setSaving(false);
  };

  const del = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    await fetch(`/api/admin/events?id=${id}`, { method: "DELETE" });
    load();
  };

  const inputStyle = {
    width: "100%", padding: "9px 12px", background: C.bg3, border: `1px solid ${C.border2}`,
    borderRadius: 8, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const,
  };
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
              <div>
                <label style={labelStyle}>Type</label>
                <select value={editing.type || ""} onChange={e => setEditing(p => ({ ...p, type: e.target.value }))} style={inputStyle}>
                  <option value="">Select type</option>
                  <option value="exhibition">Exhibition</option>
                  <option value="festival">Art Festival</option>
                  <option value="open-house">Studio Open House</option>
                  <option value="workshop">Workshop</option>
                  <option value="other">Other</option>
                </select>
              </div>
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

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/shop").catch(() => null);
    if (r?.ok) setItems(await r.json());
    setLoading(false);
  }, []);
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
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: item.inStock ? "rgba(139,154,126,0.2)" : "rgba(196,125,90,0.2)", color: item.inStock ? C.sage : C.terra }}>
                    {item.inStock ? "In Stock" : "Out"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Site Editor ───
function SiteEditor() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [artist, setArtist] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [portraitPreview, setPortraitPreview] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const portraitRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/settings").then(r => r.json()).catch(() => ({})),
      fetch("/api/admin/artist").then(r => r.json()).catch(() => ({})),
    ]).then(([s, a]) => {
      setSettings(s || {});
      setArtist(a || {});
      if (a?.portrait?.asset?._ref) {
        // show existing portrait from Sanity CDN
        fetch(`/api/admin/upload-config`).then(r => r.json()).then(({ dataset }) => {
          const ref = a.portrait.asset._ref.replace("image-", "").replace(/-(\w+)$/, ".$1").replace(/-(\d+x\d+)-/, "-$1-");
          setPortraitPreview(`https://cdn.sanity.io/images/mwzx64sx/${dataset}/${a.portrait.asset._ref.replace("image-","").replace(/-(\w+)$/,".$1")}`);
        }).catch(() => {});
      }
    }).finally(() => setLoading(false));
  }, []);

  const saveSettings = async (field: string, value: string) => {
    setSaving(field);
    await fetch("/api/admin/settings", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field, value }),
    });
    setSaving(null); setSaved(field); setTimeout(() => setSaved(null), 2000);
  };

  const saveArtist = async (field: string, value: string) => {
    setSaving(`a_${field}`);
    await fetch("/api/admin/artist", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field, value }),
    });
    setSaving(null); setSaved(`a_${field}`); setTimeout(() => setSaved(null), 2000);
  };

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
      // Save image ref to artistBio
      await fetch("/api/admin/artist", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: "portrait", imageAssetId: assetData._id }),
      });
      // Show preview
      const reader = new FileReader();
      reader.onload = e => setPortraitPreview(e.target?.result as string);
      reader.readAsDataURL(file);
      setSaved("portrait"); setTimeout(() => setSaved(null), 2000);
    } catch { alert("Upload failed"); }
    finally { setUploading(false); setUploadProgress(0); }
  };

  const Section = ({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) => (
    <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 16 }}>
      <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: C.text, margin: "0 0 4px" }}>{title}</h3>
      {desc && <p style={{ fontSize: 12, color: C.muted, margin: "0 0 20px" }}>{desc}</p>}
      {children}
    </div>
  );

  const Field = ({ k, label, multi, api }: { k: string; label: string; multi?: boolean; api?: "artist" | "settings" }) => {
    const source = api === "artist" ? artist : settings;
    const saveFn  = api === "artist" ? saveArtist : saveSettings;
    const savedKey = api === "artist" ? `a_${k}` : k;
    const [val, setVal] = useState(source[k] || "");
    useEffect(() => { setVal(source[k] || ""); }, [source[k]]);
    const isSaving = saving === savedKey;
    const isSaved  = saved  === savedKey;
    const inputStyle = { flex: 1, padding: "9px 12px", background: C.bg3, border: `1px solid ${C.border2}`, borderRadius: 8, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none" } as const;
    return (
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5, textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>{label}</label>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          {multi
            ? <textarea value={val} onChange={e => setVal(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            : <input value={val} onChange={e => setVal(e.target.value)} style={inputStyle} />}
          <button onClick={() => saveFn(k, val)} disabled={isSaving} style={{ padding: "9px 16px", background: isSaved ? C.sage : C.terra, border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>
            {isSaving ? "..." : isSaved ? "✓" : "Save"}
          </button>
        </div>
      </div>
    );
  };

  if (loading) return <div style={{ color: C.muted, padding: 60, textAlign: "center" }}>Loading settings...</div>;

  return (
    <div>
      <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: C.text, marginBottom: 24 }}>Site Editor</h2>

      {/* Portrait / Hero Image */}
      <Section title="Artist Portrait & Hero Image" desc="Appears in the hero section and about section of the homepage">
        <input ref={portraitRef} type="file" accept="image/*" style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handlePortraitUpload(f); e.target.value = ""; }} />
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* Preview */}
          <div onClick={() => !uploading && portraitRef.current?.click()} style={{
            width: 160, height: 200, borderRadius: 12, overflow: "hidden", cursor: "pointer",
            background: C.bg3, border: `2px dashed ${saved === "portrait" ? C.sage : C.border2}`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            position: "relative",
          }}>
            {portraitPreview
              ? <img src={portraitPreview} alt="Portrait" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ textAlign: "center", padding: 12 }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
                  <div style={{ fontSize: 11, color: C.muted }}>Click to upload portrait</div>
                </div>}
            {uploading && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(10,9,6,0.8)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <div style={{ width: 80, height: 4, background: C.bg3, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${uploadProgress}%`, background: C.terra, transition: "width 0.3s" }} />
                </div>
                <div style={{ fontSize: 11, color: C.muted }}>{uploadProgress}%</div>
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.6 }}>
              This photo appears as the main hero image on the homepage and in the About section. Best size: portrait orientation, at least 800×1000px.
            </p>
            <button onClick={() => portraitRef.current?.click()} disabled={uploading} style={{
              padding: "10px 20px", background: C.terra, border: "none", borderRadius: 8,
              color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600,
            }}>{uploading ? `Uploading ${uploadProgress}%...` : saved === "portrait" ? "✓ Uploaded!" : "Choose Photo"}</button>
          </div>
        </div>
      </Section>

      {/* Artist Info */}
      <Section title="Artist Info" desc="Name, location, and contact details shown across the site">
        <Field k="name"          label="Artist Name"     api="artist" />
        <Field k="tagline"       label="Tagline"         api="artist" />
        <Field k="studioLocation" label="Studio Location" api="artist" />
        <Field k="phone"         label="Phone Number"    api="artist" />
        <Field k="email"         label="Email Address"   api="artist" />
        <Field k="quote"         label="Artist Quote"    api="artist" multi />
      </Section>

      {/* Social Links */}
      <Section title="Social Links" desc="URLs for social media icons in the contact section">
        {[
          { platform: "TikTok", key: "tiktokUrl" },
          { platform: "Instagram", key: "instagramUrl" },
          { platform: "Saatchi Art", key: "saatchiUrl" },
          { platform: "Facebook", key: "facebookUrl" },
        ].map(({ platform, key }) => {
          const currentLinks: any[] = artist.socialLinks || [];
          const existing = currentLinks.find((s: any) => s.platform === platform);
          const [val, setVal] = useState(existing?.url || "");
          const isSaving = saving === key;
          const isSaved  = saved  === key;
          const save = async () => {
            setSaving(key);
            const updated = [...currentLinks.filter((s: any) => s.platform !== platform)];
            if (val) updated.push({ platform, url: val, label: platform.slice(0, 2).toUpperCase() });
            await fetch("/api/admin/artist", {
              method: "PATCH", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ field: "socialLinks", value: updated }),
            });
            setArtist(a => ({ ...a, socialLinks: updated }));
            setSaving(null); setSaved(key); setTimeout(() => setSaved(null), 2000);
          };
          return (
            <div key={key} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 5, textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>{platform} URL</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={val} onChange={e => setVal(e.target.value)} placeholder={`https://...`}
                  style={{ flex: 1, padding: "9px 12px", background: C.bg3, border: `1px solid ${C.border2}`, borderRadius: 8, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                <button onClick={save} disabled={isSaving} style={{ padding: "9px 16px", background: isSaved ? C.sage : C.terra, border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                  {isSaving ? "..." : isSaved ? "✓" : "Save"}
                </button>
              </div>
            </div>
          );
        })}
      </Section>

      {/* Hero */}
      <Section title="Hero Section" desc="The main headline visitors see first">
        <Field k="heroTitle"    label="Hero Title"    />
        <Field k="heroSubtitle" label="Hero Subtitle" multi />
      </Section>

      {/* Newsletter */}
      <Section title="Newsletter" desc="Email capture section at the bottom of the page">
        <Field k="newsletterHeading" label="Heading" />
        <Field k="newsletterText"    label="Description" multi />
      </Section>

      {/* Footer */}
      <Section title="Footer">
        <Field k="footerText" label="Copyright Text" />
      </Section>

      {/* Announcement */}
      <Section title="Announcement Banner" desc="Optional banner shown at the top of the site (leave blank to hide)">
        <Field k="announcementText" label="Banner Text" />
        <Field k="announcementLink" label="Banner Link URL" />
      </Section>
    </div>
  );
}

// ─── Collectors CRM ───
function CollectorsCRM() {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: C.text, margin: 0 }}>Collectors & Contacts</h2>
        <button style={{ padding: "10px 20px", background: C.terra, border: "none", borderRadius: 10, color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600 }}>+ Add Contact</button>
      </div>
      <div style={{ background: C.bg2, border: `2px dashed ${C.border2}`, borderRadius: 16, padding: 60, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
        <p style={{ color: C.muted, fontSize: 14 }}>Collector & buyer CRM — coming soon.</p>
        <p style={{ color: C.dim, fontSize: 12 }}>Track high-end buyers, law firms, stagers, and commission clients.</p>
      </div>
    </div>
  );
}

// ─── Inquiries ───
function Inquiries() {
  return (
    <div>
      <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: C.text, marginBottom: 24 }}>Inquiries</h2>
      <div style={{ background: C.bg2, border: `2px dashed ${C.border2}`, borderRadius: 16, padding: 60, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
        <p style={{ color: C.muted, fontSize: 14 }}>Contact form submissions & commission requests.</p>
        <p style={{ color: C.dim, fontSize: 12 }}>Wire this up to your contact form API + Sanity to capture leads here.</p>
      </div>
    </div>
  );
}

// ─── Blog / Art Talk ───
function BlogManager() {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: C.text, margin: 0 }}>Art Talk Blog</h2>
        <button style={{ padding: "10px 20px", background: C.terra, border: "none", borderRadius: 10, color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600 }}>+ New Post</button>
      </div>
      <div style={{ background: C.bg2, border: `2px dashed ${C.border2}`, borderRadius: 16, padding: 60, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✍️</div>
        <p style={{ color: C.muted, fontSize: 14 }}>Blog post editor — coming soon.</p>
        <p style={{ color: C.dim, fontSize: 12 }}>Write and publish Art Talk posts directly from here.</p>
      </div>
    </div>
  );
}

// ─── Community ───
function Community() {
  return (
    <div>
      <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: C.text, marginBottom: 24 }}>Community</h2>
      <div style={{ background: C.bg2, border: `2px dashed ${C.border2}`, borderRadius: 16, padding: 60, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🎨</div>
        <p style={{ color: C.muted, fontSize: 14 }}>Community & message board management — coming soon.</p>
        <p style={{ color: C.dim, fontSize: 12 }}>Moderate posts, manage members, and host events.</p>
      </div>
    </div>
  );
}

// ─── Email Client ───
function EmailClient() {
  return (
    <div>
      <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: C.text, marginBottom: 24 }}>Email</h2>
      <div style={{ background: C.bg2, border: `2px dashed ${C.border2}`, borderRadius: 16, padding: 60, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✉️</div>
        <p style={{ color: C.muted, fontSize: 14 }}>Email client — coming soon.</p>
        <p style={{ color: C.dim, fontSize: 12 }}>Connect your cj@palmartstudio.com SMTP to send & receive here.</p>
      </div>
    </div>
  );
}

// ─── Dashboard ───
function Dashboard({ stats, onTab }: { stats: Stats; onTab: (t: Tab) => void }) {
  const StatCard = ({ label, value, accent, onClick }: { label: string; value: string | number; accent: string; onClick?: () => void }) => (
    <div onClick={onClick} style={{
      background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 14,
      padding: "20px 20px 16px", cursor: onClick ? "pointer" : "default",
      transition: "border-color 0.2s",
    }}>
      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: accent, lineHeight: 1, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
    </div>
  );

  const QuickLink = ({ icon, label, tab, accent }: { icon: string; label: string; tab: Tab; accent: string }) => (
    <button onClick={() => onTab(tab)} style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
      padding: "20px 12px", background: C.bg2, border: `1px solid ${C.border}`,
      borderRadius: 14, cursor: "pointer", fontFamily: "inherit",
      transition: "all 0.2s", flex: "1 1 80px",
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

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 28 }}>
        <StatCard label="Total Artworks" value={stats.artworkCount} accent={C.terra} onClick={() => onTab("gallery")} />
        <StatCard label="Available" value={stats.availableCount} accent={C.sage} onClick={() => onTab("gallery")} />
        <StatCard label="Shop Items" value={stats.shopCount} accent={C.gold} onClick={() => onTab("shop")} />
        <StatCard label="Events" value={stats.eventCount} accent={C.cream} onClick={() => onTab("events")} />
      </div>

      {/* Quick links */}
      <div style={{ marginBottom: 8 }}>
        <p style={{ fontSize: 11, color: C.dim, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Quick Access</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <QuickLink icon="🖼️" label="Gallery" tab="gallery" accent={C.terra} />
          <QuickLink icon="🛒" label="Shop" tab="shop" accent={C.gold} />
          <QuickLink icon="📅" label="Events" tab="events" accent={C.sage} />
          <QuickLink icon="📬" label="Inquiries" tab="inquiries" accent={C.cream} />
          <QuickLink icon="✍️" label="Blog" tab="blog" accent={C.terra} />
          <QuickLink icon="⚙️" label="Site Editor" tab="site-editor" accent={C.muted} />
        </div>
      </div>

      {/* View site link */}
      <div style={{ marginTop: 24, padding: "14px 20px", background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>palmartstudio.com</div>
          <div style={{ fontSize: 11, color: C.muted }}>Live on Netlify</div>
        </div>
        <a href="https://palmartstudio.com" target="_blank" rel="noreferrer" style={{
          padding: "8px 18px", background: "none", border: `1px solid ${C.border2}`,
          borderRadius: 8, color: C.muted, textDecoration: "none", fontSize: 12, fontWeight: 500,
        }}>View Site ↗</a>
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
    if (!pw) return;
    setLoading(true); setError("");
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
          <input
            type="password" value={pw} onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="Enter admin password"
            style={{ width: "100%", padding: "14px 16px", background: C.bg3, border: `1px solid ${error ? C.terra : C.border2}`, borderRadius: 10, color: C.text, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 12 }}
          />
          {error && <p style={{ color: C.terra, fontSize: 12, marginBottom: 12 }}>{error}</p>}
          <button onClick={submit} disabled={loading || !pw} style={{
            width: "100%", padding: "14px", background: pw ? C.terra : C.bg3,
            border: "none", borderRadius: 10, color: pw ? "#fff" : C.dim,
            cursor: pw ? "pointer" : "not-allowed", fontFamily: "inherit",
            fontSize: 14, fontWeight: 600, transition: "all 0.2s",
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
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<Stats>({ artworkCount: 0, availableCount: 0, shopCount: 0, eventCount: 0 });

  // Check existing auth session
  useEffect(() => {
    fetch("/api/admin/auth").then(r => { setAuthed(r.ok); }).catch(() => setAuthed(false));
  }, []);

  // Load stats
  useEffect(() => {
    if (!authed) return;
    Promise.all([
      fetch("/api/admin/artwork").then(r => r.json()).catch(() => []),
      fetch("/api/admin/shop").then(r => r.json()).catch(() => []),
      fetch("/api/admin/events").then(r => r.json()).catch(() => []),
    ]).then(([art, shop, evts]) => {
      setStats({
        artworkCount: art.length,
        availableCount: art.filter((a: Artwork) => a.status === "available").length,
        shopCount: shop.length,
        eventCount: evts.length,
      });
    });
  }, [authed]);

  if (authed === null) {
    return <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: C.muted, fontFamily: "'Outfit', sans-serif" }}>Loading...</div>
    </div>;
  }

  if (!authed) {
    return <LoginScreen onLogin={() => setAuthed(true)} />;
  }

  const navGroups = [
    {
      label: "Content",
      items: [
        { icon: "📊", label: "Dashboard", tab: "dashboard" as Tab },
        { icon: "🖼️", label: "Gallery", tab: "gallery" as Tab },
        { icon: "🛒", label: "Shop", tab: "shop" as Tab },
        { icon: "📅", label: "Events", tab: "events" as Tab },
      ],
    },
    {
      label: "Engagement",
      items: [
        { icon: "📬", label: "Inquiries", tab: "inquiries" as Tab },
        { icon: "✍️", label: "Art Talk Blog", tab: "blog" as Tab },
        { icon: "🎨", label: "Community", tab: "community" as Tab },
        { icon: "✉️", label: "Email", tab: "email" as Tab },
      ],
    },
    {
      label: "Business",
      items: [
        { icon: "👥", label: "Collectors", tab: "collectors" as Tab },
        { icon: "🌐", label: "Site Editor", tab: "site-editor" as Tab },
        { icon: "⚙️", label: "Settings", tab: "settings" as Tab },
      ],
    },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard": return <Dashboard stats={stats} onTab={setActiveTab} />;
      case "gallery": return <GalleryManager />;
      case "shop": return <ShopManager />;
      case "events": return <EventsManager />;
      case "inquiries": return <Inquiries />;
      case "blog": return <BlogManager />;
      case "community": return <Community />;
      case "email": return <EmailClient />;
      case "site-editor": return <SiteEditor />;
      case "collectors": return <CollectorsCRM />;
      case "settings": return (
        <div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: C.text, marginBottom: 24 }}>Settings</h2>
          <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
            <p style={{ color: C.muted }}>Admin settings panel coming soon.</p>
            <button onClick={async () => {
              await fetch("/api/admin/auth", { method: "DELETE" });
              setAuthed(false);
            }} style={{ marginTop: 16, padding: "9px 20px", background: "none", border: `1px solid rgba(196,125,90,0.3)`, borderRadius: 8, color: C.terra, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>
              Sign Out
            </button>
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
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          display: "none",
          position: "fixed", top: 16, left: 16, zIndex: 300,
          background: C.bg2, border: `1px solid ${C.border2}`,
          borderRadius: 10, padding: "10px 14px", cursor: "pointer",
          color: C.terra, fontSize: 18,
        }}
        id="mob-menu-btn"
      >☰</button>

      <style>{`
        @media (max-width: 860px) {
          #mob-menu-btn { display: block !important; }
          #admin-sidebar { transform: translateX(-100%); transition: transform 0.35s ease; }
          #admin-sidebar.open { transform: translateX(0); }
          #admin-main { margin-left: 0 !important; }
          #admin-main-inner { padding-top: 72px !important; }
        }
      `}</style>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(10,9,6,0.7)", zIndex: 200 }} />
      )}

      {/* Sidebar */}
      <aside id="admin-sidebar" className={sidebarOpen ? "open" : ""} style={{
        position: "fixed", top: 0, left: 0, bottom: 0, width: 240,
        background: C.bg2, borderRight: `1px solid ${C.border}`,
        display: "flex", flexDirection: "column", zIndex: 250,
        overflowY: "auto", paddingBottom: 24,
      }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px 16px" }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: C.text }}>Palm Art Studio</div>
          <div style={{ fontSize: 10, color: C.dim, letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 2 }}>Admin Panel</div>
        </div>
        <div style={{ height: 1, background: C.border, margin: "0 16px 12px" }} />

        {/* Nav */}
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

        {/* Bottom */}
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
