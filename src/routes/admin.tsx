import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { DEFAULT_CATALOG, loadCatalog, saveCatalog, resetCatalog, type CatalogProduct, type ProductVariant, type ProductCategory } from "@/lib/catalog";

export const Route = createFileRoute("/admin")({ component: AdminPage });

const money = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0);
const uid = () => `hsn-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
const blankVariant = (): ProductVariant => ({ id: uid(), label: "New Color", swatch: "#777777", front: "", back: "" });
const blankProduct = (): CatalogProduct => ({ id: uid(), name: "Produk Baru Axceilla", category: "dress", weight: 1, price: 0, description: "", sizes: ["S","M","L","XL"], active: true, variants: [blankVariant()], createdAt: Date.now() });

async function imageToWebp(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("File harus berupa gambar.");
  const image = await createImageBitmap(file);
  const scale = Math.min(1, 1400 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Browser tidak mendukung pemrosesan gambar.");
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/webp", 0.82);
}

function AdminPage() {
  const [products, setProducts] = useState<CatalogProduct[]>(() => DEFAULT_CATALOG);
  const [editing, setEditing] = useState<CatalogProduct | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all"|ProductCategory>("all");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [showInactive, setShowInactive] = useState(true);

  useEffect(() => {
    setProducts(loadCatalog());
    setAuthenticated(sessionStorage.getItem("axceilla_admin_session") === "active");
  }, []);

  const visible = useMemo(() => products.filter(p =>
    (filter === "all" || p.category === filter) &&
    (showInactive || p.active) &&
    `${p.name} ${p.id}`.toLowerCase().includes(query.toLowerCase())
  ), [products, filter, query, showInactive]);

  const persist = (next: CatalogProduct[], message = "Perubahan berhasil disimpan.") => {
    try {
      saveCatalog(next);
      setProducts(next);
      setNotice(message);
      setError("");
      window.setTimeout(() => setNotice(""), 3200);
    } catch {
      setError("Penyimpanan gagal. Ukuran gambar mungkin terlalu besar. Coba gunakan gambar yang lebih kecil.");
    }
  };
  const updateField = <K extends keyof CatalogProduct,>(key: K, value: CatalogProduct[K]) => {
    if (editing) setEditing({ ...editing, [key]: value });
  };
  const updateVariant = (id: string, patch: Partial<ProductVariant>) => {
    if (editing) setEditing({ ...editing, variants: editing.variants.map(v => v.id === id ? { ...v, ...patch } : v) });
  };
  const upload = async (variantId: string, side: "front"|"back", file?: File) => {
    if (!file || !editing) return;
    try {
      setError("");
      const data = await imageToWebp(file);
      updateVariant(variantId, { [side]: data });
      setNotice(`${side === "front" ? "Gambar depan" : "Gambar belakang"} berhasil dimuat.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal memproses gambar."); }
  };
  const saveEditor = () => {
    if (!editing) return;
    if (!editing.name.trim()) return setError("Nama produk wajib diisi.");
    if (!Number.isFinite(editing.price) || editing.price < 0) return setError("Harga harus berupa angka positif.");
    if (!editing.variants.length || editing.variants.some(v => !v.label.trim() || !v.front || !v.back)) return setError("Setiap warna wajib memiliki nama serta gambar depan dan belakang.");
    const next = products.some(p => p.id === editing.id) ? products.map(p => p.id === editing.id ? editing : p) : [editing, ...products];
    persist(next, "Produk berhasil disimpan.");
    setEditing(null);
  };
  const deleteProduct = (product: CatalogProduct) => {
    if (!confirm(`Hapus "${product.name}" dari katalog?`)) return;
    persist(products.filter(p => p.id !== product.id), "Produk dihapus.");
    if (editing?.id === product.id) setEditing(null);
  };
  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(products, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `hsn-catalog-backup-${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url);
  };
  const importBackup = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed) || parsed.some(p => !p.id || !p.name || !Array.isArray(p.variants))) throw new Error("Format file katalog tidak valid.");
      persist(parsed, "Backup katalog berhasil diimpor.");
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal mengimpor backup."); }
  };

  if (!authenticated) return (
    <main className="hsn-admin-login">
      <div className="hsn-login-card">
        <div className="hsn-admin-mark">AXCEILLA<span> / CONTROL</span></div>
        <div className="hsn-admin-kicker">PRIVATE ADMIN ACCESS</div>
        <h1>Welcome back.</h1>
        <p>Masuk ke dashboard pengelolaan katalog AXCEILLA.</p>
        <form onSubmit={e => { e.preventDefault(); if (pin === "AXCEILLA2026") { sessionStorage.setItem("axceilla_admin_session","active"); setAuthenticated(true); setPin(""); } else setError("PIN tidak sesuai."); }}>
          <label>ADMIN ACCESS PIN</label>
          <input type="password" value={pin} onChange={e=>setPin(e.target.value)} placeholder="Masukkan PIN admin" autoFocus />
          {error && <div className="hsn-admin-error">{error}</div>}
          <button className="hsn-primary-btn" type="submit">ACCESS DASHBOARD <span>↗</span></button>
        </form>
        <Link to="/" className="hsn-admin-back">← Kembali ke showroom</Link>
        <small>PIN demo awal: AXCEILLA2026 · Ganti sebelum deployment.</small>
      </div>
    </main>
  );

  const activeCount = products.filter(p=>p.active).length;
  const totalVariants = products.reduce((n,p)=>n+p.variants.length,0);

  return (
    <main className="hsn-admin">
      <aside className="hsn-admin-sidebar">
        <Link to="/" className="hsn-admin-brand">AXCEILLA<span>CONTROL</span></Link>
        <div className="hsn-sidebar-label">WORKSPACE</div>
        <a className="hsn-sidebar-link active" href="#overview">▦ <span>Overview</span></a>
        <a className="hsn-sidebar-link" href="#products">◫ <span>Products & Catalog</span></a>
        <a className="hsn-sidebar-link" href="#backup">⇧ <span>Backup & Restore</span></a>
        <div className="hsn-sidebar-bottom"><span className="hsn-online-dot"/> SYSTEM ONLINE <button onClick={()=>{sessionStorage.removeItem("axceilla_admin_session");setAuthenticated(false);}}>LOG OUT ↗</button></div>
      </aside>
      <section className="hsn-admin-content">
        <header className="hsn-admin-topbar"><div><span>AXCEILLA STUDIO</span><b> / ADMIN DASHBOARD</b></div><Link to="/">VIEW STOREFRONT ↗</Link></header>
        <div className="hsn-admin-inner">
          <div className="hsn-admin-welcome" id="overview"><div><span className="hsn-admin-kicker">CONTROL CENTER / 001</span><h1>Catalog management<span>.</span></h1><p>Kelola produk, varian warna, gambar, ukuran, harga, dan visibilitas katalog AXCEILLA.</p></div><button className="hsn-primary-btn" onClick={()=>{setEditing(blankProduct());setError("");}}>＋ ADD NEW PRODUCT</button></div>
          {notice && <div className="hsn-admin-notice">✓ {notice}</div>}
          {error && <div className="hsn-admin-error">{error}</div>}
          <div className="hsn-stat-grid">
            <div className="hsn-stat"><span>TOTAL PRODUK</span><strong>{products.length.toString().padStart(2,"0")}</strong><small>Semua produk tersimpan</small></div>
            <div className="hsn-stat"><span>ACTIVE PRODUK</span><strong>{activeCount.toString().padStart(2,"0")}</strong><small>Ditampilkan di showroom</small></div>
            <div className="hsn-stat"><span>COLOR VARIANTS</span><strong>{totalVariants.toString().padStart(2,"0")}</strong><small>Total pilihan warna</small></div>
            <div className="hsn-stat"><span>COLLECTIONS</span><strong>02</strong><small>Dress, setelan, atasan, bawahan & aksesori</small></div>
          </div>

          {editing && <section className="hsn-editor" aria-label="Editor produk">
            <div className="hsn-editor-head"><div><span className="hsn-admin-kicker">PRODUCT EDITOR / {products.some(p=>p.id===editing.id) ? "UPDATE" : "CREATE"}</span><h2>{editing.name || "New product"}</h2></div><button className="hsn-quiet-btn" onClick={()=>setEditing(null)}>✕ CLOSE</button></div>
            <div className="hsn-form-grid">
              <label className="hsn-field hsn-field-wide">PRODUCT NAME<input value={editing.name} onChange={e=>updateField("name",e.target.value)} placeholder="Nama produk"/></label>
              <label className="hsn-field">CATEGORY<select value={editing.category} onChange={e=>updateField("category",e.target.value as CatalogProduct["category"])}><option value="dress">Dress</option><option value="setelan">Setelan</option><option value="atasan">Atasan</option><option value="bawahan">Bawahan</option><option value="aksesoris">Aksesori</option></select></label>
              <label className="hsn-field">PRICE (IDR)<input type="number" min="0" value={editing.price} onChange={e=>updateField("price",Number(e.target.value))}/></label>
              <label className="hsn-field hsn-field-wide">DESCRIPTION<textarea rows={3} value={editing.description} onChange={e=>updateField("description",e.target.value)} placeholder="Deskripsi produk"/></label>
              <label className="hsn-field">AVAILABLE SIZES<input value={editing.sizes.join(", ")} onChange={e=>updateField("sizes",e.target.value.split(",").map(x=>x.trim()).filter(Boolean))} placeholder="S, M, L, XL"/><small>Pisahkan ukuran dengan koma.</small></label>
              <label className="hsn-field">RACK WIDTH<input type="number" min=".5" max="2" step=".05" value={editing.weight} onChange={e=>updateField("weight",Number(e.target.value))}/><small>Proporsi lebar relatif di rak.</small></label>
              <label className="hsn-field hsn-field-check"><input type="checkbox" checked={editing.active} onChange={e=>updateField("active",e.target.checked)}/> Tampilkan produk di showroom</label>
            </div>
            <div className="hsn-variants-head"><div><span className="hsn-admin-kicker">COLOR SYSTEM</span><h3>Color variants <em>({editing.variants.length})</em></h3></div><button className="hsn-outline-btn" onClick={()=>updateField("variants",[...editing.variants,blankVariant()])}>＋ ADD COLOR</button></div>
            <div className="hsn-variant-editor-list">
              {editing.variants.map((v,i)=><div className="hsn-variant-editor" key={v.id}>
                <div className="hsn-variant-title"><span>0{i+1}</span><strong>{v.label || "New color"}</strong><button onClick={()=>updateField("variants",editing.variants.filter(x=>x.id!==v.id))}>REMOVE ×</button></div>
                <div className="hsn-variant-fields">
                  <label className="hsn-field">COLOR NAME<input value={v.label} onChange={e=>updateVariant(v.id,{label:e.target.value})}/></label>
                  <label className="hsn-field">SWATCH COLOR<div className="hsn-swatch-input"><input type="color" value={/^#[0-9a-f]{6}$/i.test(v.swatch)?v.swatch:"#777777"} onChange={e=>updateVariant(v.id,{swatch:e.target.value})}/><span>{v.swatch}</span></div></label>
                  <label className="hsn-image-upload">FRONT IMAGE<input type="file" accept="image/*" onChange={e=>upload(v.id,"front",e.target.files?.[0])}/>{v.front ? <img src={v.front} alt={`${v.label} front`}/> : <span className="hsn-upload-placeholder">＋ Upload front</span>}</label>
                  <label className="hsn-image-upload">BACK IMAGE<input type="file" accept="image/*" onChange={e=>upload(v.id,"back",e.target.files?.[0])}/>{v.back ? <img src={v.back} alt={`${v.label} back`}/> : <span className="hsn-upload-placeholder">＋ Upload back</span>}</label>
                </div>
              </div>)}
            </div>
            <div className="hsn-editor-actions"><button className="hsn-quiet-btn" onClick={()=>setEditing(null)}>CANCEL</button><button className="hsn-primary-btn" onClick={saveEditor}>SAVE PRODUCT <span>↗</span></button></div>
          </section>}

          <section id="products" className="hsn-products-section">
            <div className="hsn-section-heading"><div><span className="hsn-admin-kicker">INVENTORY / CATALOG</span><h2>All products <em>({visible.length})</em></h2></div><div className="hsn-product-tools"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search product..."/><select value={filter} onChange={e=>setFilter(e.target.value as typeof filter)}><option value="all">All categories</option><option value="dress">Dress</option><option value="setelan">Setelan</option><option value="atasan">Atasan</option><option value="bawahan">Bawahan</option><option value="aksesoris">Aksesori</option></select><label><input type="checkbox" checked={showInactive} onChange={e=>setShowInactive(e.target.checked)}/> Inactive</label></div></div>
            <div className="hsn-product-table-wrap"><table className="hsn-product-table"><thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>PRICE</th><th>COLORS</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>
              {visible.map(p=><tr key={p.id}><td><strong>{p.name}</strong><small>{p.id}</small></td><td>{p.category.toUpperCase()}</td><td>{money(p.price)}</td><td><div className="hsn-color-dots">{p.variants.map(v=><i key={v.id} title={v.label} style={{background:v.swatch}}/>)}</div><small>{p.variants.length} variant(s)</small></td><td><span className={`hsn-status ${p.active?"on":"off"}`}>{p.active?"ACTIVE":"HIDDEN"}</span></td><td><button onClick={()=>{setEditing(p);setError("");}}>EDIT</button><button className="danger" onClick={()=>deleteProduct(p)}>DELETE</button></td></tr>)}
              {!visible.length && <tr><td colSpan={6} className="hsn-empty">Tidak ada produk yang cocok.</td></tr>}
            </tbody></table></div>
          </section>
          <section className="hsn-backup-section" id="backup"><div><span className="hsn-admin-kicker">DATA SAFETY</span><h2>Backup & restore</h2><p>Ekspor seluruh data katalog termasuk gambar yang diunggah. Simpan file backup sebelum pindah browser atau perangkat.</p></div><div className="hsn-backup-actions"><button className="hsn-outline-btn" onClick={exportBackup}>↓ EXPORT JSON</button><label className="hsn-outline-btn">↑ IMPORT JSON<input type="file" accept="application/json,.json" onChange={e=>importBackup(e.target.files?.[0])}/></label><button className="hsn-danger-btn" onClick={()=>{if(confirm("Kembalikan katalog ke data awal AXCEILLA? Perubahan lokal akan hilang.")){resetCatalog();setProducts(DEFAULT_CATALOG);setEditing(null);setNotice("Katalog awal berhasil dipulihkan.");}}}>RESET CATALOG</button></div></section>
          <footer className="hsn-admin-footer">AXCEILLA STUDIO / CATALOG CONTROL <span>LOCAL BROWSER STORAGE · DEMO MODE</span></footer>
        </div>
      </section>
    </main>
  );
}
