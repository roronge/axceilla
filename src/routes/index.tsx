import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { DEFAULT_CATALOG, loadCatalog, type CatalogProduct, type ProductCategory } from "@/lib/catalog";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Axceilla Shop — Baby & Kids Clothing" },
    { name: "description", content: "Koleksi pakaian bayi dan anak Axceilla Shop." },
  ]}),
  component: Index,
});

const categories: { id: ProductCategory | "all"; label: string }[] = [
  {id:"all",label:"ALL PIECES"},{id:"dress",label:"DRESSES"},{id:"setelan",label:"SETS"},
  {id:"atasan",label:"TOPS"},{id:"bawahan",label:"BOTTOMS"},{id:"aksesoris",label:"ACCESSORIES"},
];
const money = (n:number) => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n||0);

function Index() {
  const [catalog,setCatalog] = useState<CatalogProduct[]>(DEFAULT_CATALOG);
  const [category,setCategory] = useState<ProductCategory|"all">("all");
  const [selected,setSelected] = useState<string|null>(null);
  const [side,setSide] = useState<"front"|"back">("front");
  const [size,setSize] = useState("");
  const [cart,setCart] = useState(0);
  const [notice,setNotice] = useState("");
  const [search,setSearch] = useState("");
  useEffect(()=>{
    const refresh=()=>setCatalog(loadCatalog());
    refresh();
    window.addEventListener("axceilla-catalog-updated",refresh);
    window.addEventListener("storage",refresh);
    return ()=>{window.removeEventListener("axceilla-catalog-updated",refresh);window.removeEventListener("storage",refresh);};
  },[]);
  useEffect(()=>{
    const esc=(e:KeyboardEvent)=>{if(e.key==="Escape")setSelected(null);};
    window.addEventListener("keydown",esc);return()=>window.removeEventListener("keydown",esc);
  },[]);
  const items=useMemo(()=>catalog.filter(p=>p.active&&(category==="all"||p.category===category)&&(`${p.name} ${p.description}`).toLowerCase().includes(search.toLowerCase())),[catalog,category,search]);
  const current=items.find(p=>p.id===selected)||null;
  const variant=current?.variants[0];
  const choose=(p:CatalogProduct)=>{setSelected(p.id);setSide("front");setSize(p.sizes[0]||"");setNotice("");};
  return <div className="ax-rack-page">
    <header className="ax-rack-header">
      <button className="ax-rack-brand" onClick={()=>{setSelected(null);window.scrollTo({top:0,behavior:"smooth"});}}>
        <span className="ax-brand-flower">✿</span><span>axceilla<small>SHOP</small></span>
      </button>
      <nav className="ax-rack-categories" aria-label="Kategori pakaian">
        {categories.map(c=><button key={c.id} className={category===c.id?"active":""} onClick={()=>{setCategory(c.id);setSelected(null);}}>{c.label}</button>)}
      </nav>
      <div className="ax-rack-actions"><a href="/admin">ADMIN ↗</a><span className="ax-rack-cart">♡ {cart}</span></div>
    </header>

    <main className="ax-rack-main">
      <div className="ax-rack-intro"><span>THE LITTLE WARDROBE / EST. 2026</span><p>Little outfits, endless memories <i>♡</i></p></div>
      <div className="ax-rack-stage">
        <div className="ax-rack-rail"><span></span></div>
        <div className={`ax-rack-row ${current?"is-muted":""}`}>
          {items.map((p,i)=>{
            const v=p.variants[0];
            return <button key={p.id} className="ax-rack-piece" onClick={()=>choose(p)} aria-label={`Lihat ${p.name}`}>
              <img src={v?.front} alt={p.name} loading="eager"/>
              <span className="ax-rack-piece-name">{p.name}</span>
            </button>;
          })}
        </div>
        {current&&variant&&<div className="ax-rack-focus">
          <div className="ax-focus-label"><span>SELECTED LITTLE PIECE</span><button onClick={()=>setSelected(null)} aria-label="Tutup detail">×</button></div>
          <img src={side==="front"?variant.front:variant.back||variant.front} alt={`${current.name} ${side}`} />
          <div className="ax-focus-side"><button className={side==="front"?"active":""} onClick={()=>setSide("front")}>FRONT</button><button className={side==="back"?"active":""} onClick={()=>setSide("back")}>BACK</button></div>
        </div>}
      </div>

      {current&&variant&&<aside className="ax-rack-detail">
        <div className="ax-detail-top"><span><i></i> AXCEILLA / PRODUCT INFO</span><small>0{items.findIndex(p=>p.id===current.id)+1} — {items.length}</small></div>
        <span className="ax-detail-kicker">A LITTLE SOMETHING SPECIAL</span>
        <h1>{current.name}</h1>
        <div className="ax-detail-price">{money(current.price)}</div>
        <p>{current.description}</p>
        <div className="ax-detail-divider"></div>
        <label>CHOOSE SIZE</label>
        <div className="ax-detail-sizes">{current.sizes.map(s=><button key={s} className={size===s?"active":""} onClick={()=>setSize(s)}>{s}</button>)}</div>
        <button className="ax-detail-add" onClick={()=>{setCart(c=>c+1);setNotice(`${current.name} · ${size} ditambahkan ke keranjang`);}}>ADD TO BAG <span>↗</span></button>
        {notice&&<div className="ax-detail-notice">♡ {notice}</div>}
        <div className="ax-detail-foot"><span>SOFT · SWEET · COMFORTABLE</span><span>IN BAG: {cart}</span></div>
      </aside>}

      {!items.length&&<div className="ax-rack-empty">No little pieces found ♡</div>}
      <div className="ax-rack-hint">{current?"PILIH FRONT / BACK UNTUK MELIHAT DETAIL":"PILIH PAKAIAN DARI RAK UNTUK MELIHAT DETAIL"}</div>
    </main>
    <footer className="ax-rack-footer"><div className="ax-rack-marquee">{Array.from({length:3},(_,i)=><span key={i}>MADE FOR LITTLE MOMENTS <i>✿</i> LITTLE THINGS, BIG LOVE <i>♡</i> BABY & KIDS COLLECTION <i>✿</i></span>)}</div></footer>
  </div>;
}
