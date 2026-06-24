import { useState, useMemo, useEffect, useCallback } from "react";

// ─── PERSISTENCE ────────────────────────────────────────────────
function usePersist(key, init) {
  const [state, setState] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; }
    catch { return init; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(state)); } catch {} }, [key, state]);
  return [state, setState];
}

// ─── HELPERS ────────────────────────────────────────────────────
const C$S  = n => `C$ ${(+n||0).toLocaleString("es-NI",{minimumFractionDigits:0,maximumFractionDigits:0})}`;
const C$   = n => `C$ ${(+n||0).toLocaleString("es-NI",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const uid  = () => Date.now() + Math.floor(Math.random()*9999);
const todayISO = () => new Date().toISOString().split("T")[0];
const nowTime  = () => new Date().toTimeString().slice(0,5);
const fmtD = d => new Date(d+"T12:00").toLocaleDateString("es-NI",{day:"2-digit",month:"short",year:"numeric"});
const fmtS = d => new Date(d+"T12:00").toLocaleDateString("es-NI",{day:"2-digit",month:"short"});
const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

// ─── REAL BUSINESS DATA ─────────────────────────────────────────
// Tipo de cambio Amazon: C$36.6242
// Pinolero ya cobrado: C$153/u (9 unidades en mano)
// Pinolero estimado pendiente: ~C$150/u

const SEED_CATS = ["Fire TV HD","Fire TV 4K","Premium","Accesorio","Otro"];

const SEED_PRODUCTS = [
  {
    id:1, name:"Fire TV HD (WiFi 6)", sku:"FTV-HD-W6",
    buyPrice:747,   // Amazon C$594 + Pinolero C$153
    sellPrice:1400,
    stock:8,        // 9 compradas - 1 vendida hoy
    notes:"Nuevo modelo WiFi6 sin cubo. Amazon: C$594/u · Pinolero: C$153/u · Landed: C$747/u",
    minStock:3, category:"Fire TV HD"
  },
  {
    id:2, name:"Fire TV 4K Select", sku:"FTV-4K-SEL",
    buyPrice:821,   // Amazon C$668 + Pinolero C$153
    sellPrice:1600,
    stock:12,       // 4 cuentas × 3 unidades
    notes:"Amazon: C$668/u · Pinolero: C$153/u · Landed: C$821/u",
    minStock:3, category:"Fire TV 4K"
  },
  {
    id:3, name:"Fire TV 4K Plus", sku:"FTV-4K-PLS",
    buyPrice:928,   // Amazon C$928/u · Pinolero pendiente (~C$150)
    sellPrice:1700,
    stock:6,        // 2 cuentas × 3 unidades
    notes:"Amazon: C$928/u · Pinolero pendiente ~C$150/u · En tránsito avión",
    minStock:2, category:"Fire TV 4K"
  },
  {
    id:4, name:"Fire TV 4K Max", sku:"FTV-4K-MAX",
    buyPrice:1299,  // Amazon C$1,299/u · Pinolero pendiente (~C$150)
    sellPrice:1900,
    stock:3,        // Cta. Marjorie
    notes:"Amazon: C$1,299/u · Pinolero pendiente ~C$150/u · En tránsito avión",
    minStock:1, category:"Fire TV 4K"
  },
];

// Todas las compras reales + venta del 27 abril
// Lote B: fin de semana 25-26 abril
// Lote A: 27 abril (hoy)
// Pinolero pagado hoy: C$1,380 por 9 unidades
const SEED_TXS = [
  // ─── LOTE B — Fin de semana (25 abril) ───────────────────────
  // Cuenta Marjorie — Barco ~3 semanas — C$3,784.81 total (3HD + 3SELECT)
  { id:101, type:"purchase", productId:1, qty:3, unitPrice:594, total:1781,
    date:"2025-04-25", time:null, notes:"Lote B · Cta. Marjorie · BARCO ~3 sem.", discount:0, clientId:null },
  { id:102, type:"purchase", productId:2, qty:3, unitPrice:668, total:2004,
    date:"2025-04-25", time:null, notes:"Lote B · Cta. Marjorie · BARCO ~3 sem.", discount:0, clientId:null },
  // Cuenta Yisleni — Avión — YA EN MANO — C$3,784.81 total (3HD + 3SELECT)
  { id:103, type:"purchase", productId:1, qty:3, unitPrice:594, total:1781,
    date:"2025-04-25", time:null, notes:"Lote B · Cta. Yisleni · ✅ YA EN MANO", discount:0, clientId:null },
  { id:104, type:"purchase", productId:2, qty:3, unitPrice:668, total:2004,
    date:"2025-04-25", time:null, notes:"Lote B · Cta. Yisleni · ✅ YA EN MANO", discount:0, clientId:null },
  // Cuenta Gago — Avión — YA EN MANO — C$2,003.79 total (3SELECT)
  { id:105, type:"purchase", productId:2, qty:3, unitPrice:668, total:2004,
    date:"2025-04-25", time:null, notes:"Lote B · Cta. Gago · ✅ YA EN MANO", discount:0, clientId:null },
  // Cuenta Relatos — Avión — ETA jueves próximo — C$3,784.81 total (3HD + 3SELECT)
  { id:106, type:"purchase", productId:1, qty:3, unitPrice:594, total:1781,
    date:"2025-04-25", time:null, notes:"Lote B · Cta. Relatos · ✈ ETA jueves", discount:0, clientId:null },
  { id:107, type:"purchase", productId:2, qty:3, unitPrice:668, total:2004,
    date:"2025-04-25", time:null, notes:"Lote B · Cta. Relatos · ✈ ETA jueves", discount:0, clientId:null },

  // ─── LOTE A — 27 abril (hoy) ─────────────────────────────────
  // Cuenta Marjorie — Avión — ETA mar/mié próxima semana
  // C$6,680.79 total (3 PLUS + 3 MAX). Pinolero pendiente
  { id:108, type:"purchase", productId:3, qty:3, unitPrice:928, total:2784,
    date:"2025-04-27", time:null, notes:"Lote A · Cta. Marjorie · ✈ ETA mar/mié · Pinolero pendiente", discount:0, clientId:null },
  { id:109, type:"purchase", productId:4, qty:3, unitPrice:1299, total:3897,
    date:"2025-04-27", time:null, notes:"Lote A · Cta. Marjorie · ✈ ETA mar/mié · Pinolero pendiente", discount:0, clientId:null },
  // Cuenta Yisleni — Avión — ETA mar/mié próxima semana
  // C$2,783.48 total (3 PLUS). Pinolero pendiente
  { id:110, type:"purchase", productId:3, qty:3, unitPrice:928, total:2784,
    date:"2025-04-27", time:null, notes:"Lote A · Cta. Yisleni · ✈ ETA mar/mié · Pinolero pendiente", discount:0, clientId:null },

  // ─── PINOLERO — 27 abril ─────────────────────────────────────
  // C$1,380 por 9 unidades en mano (6 Yisleni + 3 SELECT Gago)
  // 6 libras · $37.50 · C$153/u
  { id:111, type:"purchase", productId:null, qty:9, unitPrice:153, total:1380,
    date:"2025-04-27", time:null, notes:"Pinolero Box · 9 u. · 6 lbs · $37.50 · C$153/u · (6 Yisleni + 3 SELECT Gago)", discount:0, clientId:null },

  // ─── VENTA — 27 abril ────────────────────────────────────────
  // Fire TV HD · C$1,400 (incluye C$100 delivery) · Ganancia neta ~C$653
  { id:112, type:"sale", productId:1, qty:1, unitPrice:1400, total:1400,
    date:"2025-04-27", time:"", notes:"Incluye C$100 delivery · Ganancia neta ~C$653", discount:0, clientId:null },
];

const SEED_CLIENTS = [];

// ─── DESIGN TOKENS ──────────────────────────────────────────────
const R = {
  card:  { background:"var(--bg1)", border:"0.5px solid var(--brd3)", borderRadius:16, padding:"1rem 1.25rem", marginBottom:10 },
  surf:  { background:"var(--bg2)", borderRadius:12, padding:"0.875rem 1rem" },
  row:   { display:"flex", alignItems:"center" },
  rowB:  { display:"flex", alignItems:"center", justifyContent:"space-between" },
  col:   { display:"flex", flexDirection:"column" },
  label: { fontSize:11, fontWeight:700, color:"var(--c-ter)", textTransform:"uppercase", letterSpacing:"0.09em" },
};

// ─── PRIMITIVES ─────────────────────────────────────────────────
function Badge({v="neutral",icon,children,sm}) {
  const m={positive:["var(--bg-pos)","var(--c-pos)"],warning:["var(--bg-war)","var(--c-war)"],danger:["var(--bg-dan)","var(--c-dan)"],info:["var(--bg-inf)","var(--c-inf)"],neutral:["var(--bg2)","var(--c-sec)"],brand:["var(--bg-bra)","var(--brand)"]};
  const [bg,tc]=m[v]||m.neutral;
  return <span style={{display:"inline-flex",alignItems:"center",gap:3,padding:sm?"2px 8px":"4px 10px",borderRadius:99,fontSize:sm?11:12,fontWeight:700,background:bg,color:tc,whiteSpace:"nowrap"}}>
    {icon&&<i className={`ti ${icon}`} style={{fontSize:sm?10:12}} aria-hidden/>}{children}
  </span>;
}

function Btn({onClick,v="ghost",full,sm,lg,children,sx={},disabled,icon}) {
  const m={
    ghost:       {bg:"transparent",     bo:"1px solid var(--brd2)", tc:"var(--c-pri)"},
    brand:       {bg:"var(--brand)",     bo:"none", tc:"#fff", sh:"0 4px 18px var(--brand-glow)"},
    positive:    {bg:"var(--c-pos)",     bo:"none", tc:"var(--bg1)"},
    warning:     {bg:"var(--c-war)",     bo:"none", tc:"#fff"},
    danger:      {bg:"var(--c-dan)",     bo:"none", tc:"#fff"},
    info:        {bg:"var(--c-inf)",     bo:"none", tc:"#fff"},
    dark:        {bg:"var(--c-pri)",     bo:"none", tc:"var(--bg1)"},
    "ghost-brand":{bg:"var(--bg-bra)",  bo:"none", tc:"var(--brand)"},
    "ghost-pos": {bg:"var(--bg-pos)",   bo:"none", tc:"var(--c-pos)"},
    "ghost-war": {bg:"var(--bg-war)",   bo:"none", tc:"var(--c-war)"},
    "ghost-dan": {bg:"var(--bg-dan)",   bo:"none", tc:"var(--c-dan)"},
  };
  const {bg,bo,tc,sh}=m[v]||m.ghost;
  return <button onClick={onClick} disabled={disabled} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:7,padding:lg?"14px 24px":sm?"6px 14px":"10px 20px",borderRadius:10,fontWeight:700,fontSize:lg?16:sm?12:14,cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",background:bg,border:bo,color:tc,width:full?"100%":"auto",opacity:disabled?0.45:1,boxShadow:sh||"none",...sx}}>
    {icon&&<i className={`ti ${icon}`} aria-hidden/>}{children}
  </button>;
}

function IconBtn({onClick,icon,size=36,sx={}}) {
  return <button onClick={onClick} style={{width:size,height:size,borderRadius:size/3,background:"var(--bg2)",border:"none",cursor:"pointer",color:"var(--c-sec)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,...sx}}>
    <i className={`ti ${icon}`} style={{fontSize:size*0.5}} aria-hidden/>
  </button>;
}

function StatCard({label,value,sub,icon,color="brand"}) {
  const m={
    brand:   {g:"linear-gradient(135deg,#ff6b2b,#ff4500)", sh:"0 8px 24px var(--brand-glow)"},
    positive:{g:"linear-gradient(135deg,#00c4cc,#0099cc)", sh:"0 8px 24px rgba(0,196,204,0.35)"},
    info:    {g:"linear-gradient(135deg,#7c3aed,#6d28d9)", sh:"0 8px 24px rgba(124,58,237,0.35)"},
    warning: {g:"linear-gradient(135deg,#f59e0b,#d97706)", sh:"0 8px 24px rgba(245,158,11,0.3)"},
    neutral: {g:"var(--bg2)", sh:"none", dark:true},
  };
  const {g,sh,dark}=m[color]||m.neutral;
  return <div style={{background:g,borderRadius:18,padding:"1.1rem 1.2rem",boxShadow:sh,border:dark?"0.5px solid var(--brd3)":"none"}}>
    <div style={{...R.rowB,marginBottom:10}}>
      <span style={{fontSize:11,fontWeight:700,color:dark?"var(--c-ter)":"rgba(255,255,255,0.6)",textTransform:"uppercase",letterSpacing:"0.08em"}}>{label}</span>
      <div style={{width:30,height:30,borderRadius:9,background:dark?"var(--bg3)":"rgba(255,255,255,0.18)",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <i className={`ti ${icon}`} style={{fontSize:17,color:dark?"var(--c-sec)":"#fff"}} aria-hidden/>
      </div>
    </div>
    <div style={{fontSize:22,fontWeight:800,color:dark?"var(--c-pri)":"#fff",letterSpacing:"-0.5px",fontVariantNumeric:"tabular-nums"}}>{value}</div>
    {sub&&<div style={{fontSize:12,color:dark?"var(--c-ter)":"rgba(255,255,255,0.65)",marginTop:3}}>{sub}</div>}
  </div>;
}

function Card({children,sx={},onClick,noPad,shadow}) {
  return <div onClick={onClick} style={{...R.card,padding:noPad?0:R.card.padding,boxShadow:shadow?"0 2px 16px rgba(0,0,0,0.07)":"none",cursor:onClick?"pointer":"default",...sx}}>{children}</div>;
}

function ProgressBar({val,max,color="var(--brand)",h=5}) {
  const w=max>0?Math.min(100,Math.max(2,(val/max)*100)):0;
  return <div style={{height:h,background:"var(--brd3)",borderRadius:h/2,overflow:"hidden"}}>
    <div style={{height:"100%",width:w+"%",background:color,borderRadius:h/2}}/>
  </div>;
}

function Divider({my=8}) { return <div style={{height:"0.5px",background:"var(--brd3)",margin:`${my}px 0`}}/>; }

function StockBadge({stock,min=2}) {
  if(stock===0) return <Badge v="danger" icon="ti-alert-circle">Sin stock</Badge>;
  if(stock<=min) return <Badge v="warning" icon="ti-alert-triangle">{stock} u.</Badge>;
  return <Badge v="positive">{stock} u.</Badge>;
}

function SparkBar({data,color="var(--brand)",height=44}) {
  if(!data?.length) return null;
  const max=Math.max(...data,1);
  return <div style={{display:"flex",alignItems:"flex-end",gap:3,height}}>
    {data.map((v,i)=><div key={i} style={{flex:1,height:Math.max(3,(v/max)*height),background:color,borderRadius:3,opacity:i===data.length-1?1:0.4}}/>)}
  </div>;
}

function Toast({toast}) {
  if(!toast) return null;
  const ok=toast.type!=="err";
  return <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:999,maxWidth:360,width:"calc(100% - 32px)",display:"flex",alignItems:"center",gap:10,padding:"12px 18px",borderRadius:14,fontSize:14,fontWeight:700,background:ok?"var(--c-pos)":"var(--c-dan)",color:ok?"#fff":"#fff",boxShadow:"0 8px 32px rgba(0,0,0,0.3)",animation:"slideDown 0.25s ease"}}>
    <i className={`ti ${ok?"ti-circle-check":"ti-alert-circle"}`} style={{fontSize:20,flexShrink:0}} aria-hidden/>{toast.msg}
  </div>;
}

function Modal({title,onClose,children}) {
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center",backdropFilter:"blur(3px)"}}>
    <div style={{background:"var(--bg1)",borderRadius:"24px 24px 0 0",width:"100%",maxWidth:480,maxHeight:"92vh",overflow:"auto",paddingBottom:"env(safe-area-inset-bottom,16px)"}}>
      <div style={{...R.rowB,padding:"20px 20px 0",marginBottom:4}}>
        <span style={{fontSize:17,fontWeight:700,color:"var(--c-pri)"}}>{title}</span>
        <IconBtn onClick={onClose} icon="ti-x"/>
      </div>
      <div style={{padding:"16px 20px 20px"}}>{children}</div>
    </div>
  </div>;
}

function ConfirmModal({title,msg,onConfirm,onCancel}) {
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:24,backdropFilter:"blur(4px)"}}>
    <div style={{background:"var(--bg1)",borderRadius:22,padding:"28px 24px",width:"100%",maxWidth:340,textAlign:"center",boxShadow:"0 24px 64px rgba(0,0,0,0.35)"}}>
      <div style={{width:64,height:64,borderRadius:20,background:"var(--bg-dan)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
        <i className="ti ti-alert-triangle" style={{fontSize:30,color:"var(--c-dan)"}} aria-hidden/>
      </div>
      <div style={{fontSize:17,fontWeight:700,color:"var(--c-pri)",marginBottom:8}}>{title}</div>
      <div style={{fontSize:14,color:"var(--c-sec)",marginBottom:24,lineHeight:1.55}}>{msg}</div>
      <div style={{display:"flex",gap:10}}>
        <Btn onClick={onCancel} full>Cancelar</Btn>
        <Btn onClick={onConfirm} v="danger" full>Confirmar</Btn>
      </div>
    </div>
  </div>;
}

function Field({label,error,hint,children}) {
  return <div style={{...R.col,gap:6}}>
    <label style={{fontSize:13,fontWeight:600,color:"var(--c-sec)"}}>{label}</label>
    {children}
    {hint&&!error&&<span style={{fontSize:12,color:"var(--c-ter)"}}>{hint}</span>}
    {error&&<span style={{fontSize:12,color:"var(--c-dan)",display:"flex",alignItems:"center",gap:4}}>
      <i className="ti ti-alert-circle" style={{fontSize:12}} aria-hidden/>{error}
    </span>}
  </div>;
}

function BackHeader({title,sub,onBack,action}) {
  return <div style={{...R.rowB,padding:"16px 20px",borderBottom:"0.5px solid var(--brd3)"}}>
    <div style={{...R.row,gap:12}}>
      <IconBtn onClick={onBack} icon="ti-arrow-left"/>
      <div>
        <div style={{fontSize:17,fontWeight:700,color:"var(--c-pri)"}}>{title}</div>
        {sub&&<div style={{fontSize:12,color:"var(--c-sec)"}}>{sub}</div>}
      </div>
    </div>
    {action}
  </div>;
}

function Empty({icon,title,text,action}) {
  return <div style={{textAlign:"center",padding:"60px 20px",color:"var(--c-ter)"}}>
    <div style={{width:72,height:72,borderRadius:20,background:"var(--bg2)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
      <i className={`ti ${icon}`} style={{fontSize:36}} aria-hidden/>
    </div>
    {title&&<div style={{fontSize:16,fontWeight:700,color:"var(--c-sec)",marginBottom:6}}>{title}</div>}
    <div style={{fontSize:14,marginBottom:action?20:0,lineHeight:1.5}}>{text}</div>
    {action}
  </div>;
}

function SectionLabel({text,action}) {
  return <div style={{...R.rowB,marginBottom:12}}>
    <span style={R.label}>{text}</span>
    {action}
  </div>;
}

function Avatar({name,size=40}) {
  const colors=["#ff6b2b","#00c4cc","#7c3aed","#f59e0b","#ef4444"];
  const bg=colors[(name?.charCodeAt(0)||0)%colors.length];
  return <div style={{width:size,height:size,borderRadius:size/3,background:bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontWeight:800,fontSize:size*0.38,color:"#fff"}}>
    {name?.[0]?.toUpperCase()||"?"}
  </div>;
}

// ─── CATEGORY MANAGER ────────────────────────────────────────────
function CategoryManager({categories,onSave,onClose}) {
  const [cats,setCats]=useState([...categories]);
  const [newCat,setNewCat]=useState("");
  const [err,setErr]=useState("");
  const add=()=>{
    const v=newCat.trim();
    if(!v){setErr("Escribe un nombre");return;}
    if(cats.map(c=>c.toLowerCase()).includes(v.toLowerCase())){setErr("Ya existe esa categoría");return;}
    setCats(c=>[...c,v]);setNewCat("");setErr("");
  };
  const remove=cat=>{if(cats.length<=1){setErr("Debe haber al menos una categoría");return;}setCats(c=>c.filter(x=>x!==cat));};
  return <Modal title="Gestionar categorías" onClose={onClose}>
    <div style={{...R.col,gap:14}}>
      <p style={{fontSize:13,color:"var(--c-sec)",lineHeight:1.6,margin:0}}>Agrega o elimina categorías libremente. Si eliminas una usada en un producto, ese producto quedará sin categoría.</p>
      <div style={{...R.col,gap:6}}>
        {cats.map(c=>(
          <div key={c} style={{...R.rowB,background:"var(--bg2)",borderRadius:10,padding:"10px 14px"}}>
            <div style={{...R.row,gap:8}}>
              <div style={{width:8,height:8,borderRadius:99,background:"var(--brand)",flexShrink:0}}/>
              <span style={{fontSize:14,fontWeight:600,color:"var(--c-pri)"}}>{c}</span>
            </div>
            <IconBtn onClick={()=>remove(c)} icon="ti-trash" sx={{background:"var(--bg-dan)",color:"var(--c-dan)"}} size={30}/>
          </div>
        ))}
      </div>
      {err&&<span style={{fontSize:12,color:"var(--c-dan)",fontWeight:600}}>{err}</span>}
      <Divider my={2}/>
      <Field label="Nueva categoría">
        <div style={{...R.row,gap:8}}>
          <input value={newCat} onChange={e=>{setNewCat(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="Ej: Auriculares, Smartwatch…" style={{flex:1}}/>
          <Btn onClick={add} v="brand" icon="ti-plus">Agregar</Btn>
        </div>
      </Field>
      <Btn onClick={()=>onSave(cats)} v="dark" full lg>Guardar cambios</Btn>
    </div>
  </Modal>;
}

// ─── PRODUCT FORM ────────────────────────────────────────────────
function ProductForm({product,categories,onSave,onDelete,onBack}) {
  const isEdit=!!product?.id;
  const [f,setF]=useState(product||{name:"",sku:"",buyPrice:"",sellPrice:"",stock:"0",notes:"",minStock:"2",category:categories[0]||""});
  const [err,setErr]=useState({});
  const [confirm,setConfirm]=useState(false);
  const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const margin=f.sellPrice&&f.buyPrice?+f.sellPrice-+f.buyPrice:null;
  const mPct=margin!==null&&+f.sellPrice>0?((margin/+f.sellPrice)*100).toFixed(1):null;
  const validate=()=>{const e={};if(!f.name)e.name="Requerido";if(!+f.buyPrice)e.buyPrice="Requerido";if(!+f.sellPrice)e.sellPrice="Requerido";setErr(e);return!Object.keys(e).length;};
  return <div>
    {confirm&&<ConfirmModal title="¿Eliminar producto?" msg={`Se eliminará "${f.name}" y todo su historial. Esta acción no se puede deshacer.`} onConfirm={()=>onDelete(f.id)} onCancel={()=>setConfirm(false)}/>}
    <BackHeader title={isEdit?"Editar producto":"Nuevo producto"} sub={isEdit?f.sku||"Sin SKU":null} onBack={onBack}
      action={<Btn onClick={()=>{if(validate())onSave(f);}} v="brand" sm icon="ti-check">Guardar</Btn>}/>
    <div style={{padding:"20px",...R.col,gap:16}}>
      <Field label="Categoría">
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {categories.map(c=>(
            <button key={c} onClick={()=>setF(p=>({...p,category:c}))} style={{padding:"6px 14px",borderRadius:99,fontSize:13,fontWeight:600,border:"1.5px solid",cursor:"pointer",fontFamily:"inherit",borderColor:f.category===c?"var(--brand)":"var(--brd2)",background:f.category===c?"var(--brand)":"transparent",color:f.category===c?"#fff":"var(--c-sec)"}}>
              {c}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Nombre del producto *" error={err.name}>
        <input value={f.name} onChange={set("name")} placeholder="Ej: Fire TV 4K Max" style={{width:"100%",borderColor:err.name?"var(--c-dan)":""}}/>
      </Field>
      <Field label="SKU / Código">
        <input value={f.sku} onChange={set("sku")} placeholder="Ej: FTV-4K-MAX" style={{width:"100%"}}/>
      </Field>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Field label="Precio compra (C$) *" error={err.buyPrice}>
          <input type="number" min="0" value={f.buyPrice} onChange={set("buyPrice")} placeholder="0" style={{width:"100%",borderColor:err.buyPrice?"var(--c-dan)":""}}/>
        </Field>
        <Field label="Precio venta (C$) *" error={err.sellPrice}>
          <input type="number" min="0" value={f.sellPrice} onChange={set("sellPrice")} placeholder="0" style={{width:"100%",borderColor:err.sellPrice?"var(--c-dan)":""}}/>
        </Field>
      </div>
      {margin!==null&&<div style={{background:"var(--bg-bra)",borderRadius:12,padding:"12px 16px",...R.rowB}}>
        <span style={{fontSize:13,color:"var(--brand)",fontWeight:600}}>Ganancia por unidad</span>
        <div>
          <span style={{fontWeight:800,color:margin>=0?"var(--c-pos)":"var(--c-dan)",fontSize:17}}>{C$S(margin)}</span>
          <span style={{fontSize:12,color:"var(--c-sec)",marginLeft:6}}>({mPct}%)</span>
        </div>
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Field label="Stock actual"><input type="number" min="0" value={f.stock} onChange={set("stock")} style={{width:"100%"}}/></Field>
        <Field label="Alerta mínima"><input type="number" min="0" value={f.minStock} onChange={set("minStock")} placeholder="2" style={{width:"100%"}}/></Field>
      </div>
      <Field label="Notas / Costos detallados">
        <textarea value={f.notes} onChange={set("notes")} rows={3} placeholder="Amazon, Pinolero, costo total, variante…" style={{width:"100%",resize:"vertical",fontFamily:"inherit"}}/>
      </Field>
      {isEdit&&<><Divider my={4}/><Btn onClick={()=>setConfirm(true)} v="danger" full lg icon="ti-trash">Eliminar producto</Btn></>}
    </div>
  </div>;
}

// ─── SALE FORM ────────────────────────────────────────────────────
function SaleForm({products,clients,initPid,onSave,onBack}) {
  const def=products.find(p=>p.id===initPid)||products.find(p=>p.stock>0)||products[0];
  const [f,setF]=useState({productId:def?.id||"",qty:"1",unitPrice:def?.sellPrice||"",discount:"0",date:todayISO(),time:nowTime(),notes:"",clientId:""});
  const [err,setErr]=useState({});
  const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const chProd=e=>{const p=products.find(x=>x.id===+e.target.value);setF(pv=>({...pv,productId:e.target.value,unitPrice:p?.sellPrice||""}));};
  const prod=products.find(p=>p.id===+f.productId);
  const disc=Math.min(+(f.discount)||0,100);
  const finalP=(+f.unitPrice||0)*(1-disc/100);
  const total=finalP*(+f.qty||0);
  const gain=prod?(finalP-prod.buyPrice)*(+f.qty||0):null;
  const validate=()=>{const e={};if(!f.productId)e.productId="Selecciona un producto";if(!+f.qty||+f.qty<1)e.qty="Cantidad inválida";if(!+f.unitPrice)e.unitPrice="Precio requerido";if(prod&&+f.qty>prod.stock)e.qty=`Solo hay ${prod.stock} u. en stock`;setErr(e);return!Object.keys(e).length;};
  return <div>
    <BackHeader title="Nueva venta" onBack={onBack}
      action={<Btn onClick={()=>{if(validate())onSave({...f,discount:disc});}} v="positive" sm icon="ti-check">Registrar</Btn>}/>
    <div style={{padding:"20px",...R.col,gap:14}}>
      <Field label="Producto *" error={err.productId}>
        <select value={f.productId} onChange={chProd} style={{width:"100%",fontFamily:"inherit",borderColor:err.productId?"var(--c-dan)":""}}>
          <option value="">— Seleccionar producto —</option>
          {products.map(p=><option key={p.id} value={p.id} disabled={p.stock===0}>{p.name} {p.stock===0?"(sin stock)":`· ${C$S(p.sellPrice)} · ${p.stock} u.`}</option>)}
        </select>
      </Field>
      {prod&&<div style={{...R.surf,display:"flex",flexWrap:"wrap",gap:"6px 20px"}}>
        <span style={{fontSize:13,color:"var(--c-sec)"}}>Precio: <strong style={{color:"var(--c-pos)"}}>{C$S(prod.sellPrice)}</strong></span>
        <span style={{fontSize:13,color:"var(--c-sec)"}}>Stock: <strong>{prod.stock} u.</strong></span>
        <span style={{fontSize:13,color:"var(--c-sec)"}}>Costo: <strong style={{color:"var(--c-war)"}}>{C$S(prod.buyPrice)}</strong></span>
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Field label="Cantidad" error={err.qty}>
          <input type="number" min="1" value={f.qty} onChange={set("qty")} style={{width:"100%",borderColor:err.qty?"var(--c-dan)":""}}/>
        </Field>
        <Field label="Precio de venta (C$)" error={err.unitPrice}>
          <input type="number" min="0" value={f.unitPrice} onChange={set("unitPrice")} style={{width:"100%",borderColor:err.unitPrice?"var(--c-dan)":""}}/>
        </Field>
      </div>
      <Field label={`Descuento %${disc>0?` → Precio final: ${C$S(finalP)}/u`:""}`}>
        <input type="number" min="0" max="100" value={f.discount} onChange={set("discount")} style={{width:"100%"}}/>
      </Field>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Field label="Fecha de la venta">
          <input type="date" value={f.date} onChange={set("date")} style={{width:"100%"}}/>
        </Field>
        <Field label="Hora de la venta" hint="Formato 24h">
          <div style={{position:"relative"}}>
            <input type="time" value={f.time} onChange={set("time")} style={{width:"100%",paddingRight:36}}/>
            <i className="ti ti-clock" style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",color:"var(--c-ter)",fontSize:16,pointerEvents:"none"}} aria-hidden/>
          </div>
        </Field>
      </div>
      <Field label="Cliente (opcional)">
        <select value={f.clientId} onChange={set("clientId")} style={{width:"100%",fontFamily:"inherit"}}>
          <option value="">— Sin cliente —</option>
          {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <Field label="Notas">
        <input value={f.notes} onChange={set("notes")} placeholder="Ej: Incluye delivery C$100…" style={{width:"100%"}}/>
      </Field>
      {total>0&&<div style={{background:"linear-gradient(135deg,#00c4cc,#0099cc)",borderRadius:16,padding:"18px 20px",boxShadow:"0 6px 20px rgba(0,196,204,0.35)"}}>
        <div style={R.rowB}>
          <span style={{fontSize:14,color:"rgba(255,255,255,0.8)"}}>Total de venta</span>
          <span style={{fontSize:34,fontWeight:800,color:"#fff"}}>{C$S(total)}</span>
        </div>
        {gain!==null&&<><Divider my={12}/><div style={R.rowB}>
          <span style={{fontSize:13,color:"rgba(255,255,255,0.75)"}}>Ganancia estimada</span>
          <span style={{fontSize:17,fontWeight:800,color:"#fff"}}>{C$S(gain)}</span>
        </div></>}
      </div>}
    </div>
  </div>;
}

// ─── PURCHASE FORM ────────────────────────────────────────────────
function PurchaseForm({products,initPid,onSave,onBack}) {
  const def=products.find(p=>p.id===initPid)||products[0];
  const [f,setF]=useState({productId:def?.id||"",qty:"1",unitPrice:def?.buyPrice||"",date:todayISO(),notes:""});
  const [err,setErr]=useState({});
  const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const chProd=e=>{const p=products.find(x=>x.id===+e.target.value);setF(pv=>({...pv,productId:e.target.value,unitPrice:p?.buyPrice||""}));};
  const prod=products.find(p=>p.id===+f.productId);
  const total=(+f.unitPrice||0)*(+f.qty||0);
  const validate=()=>{const e={};if(!f.qty)e.qty="Requerido";if(!+f.unitPrice)e.unitPrice="Requerido";setErr(e);return!Object.keys(e).length;};
  return <div>
    <BackHeader title="Nueva compra / gasto" onBack={onBack}
      action={<Btn onClick={()=>{if(validate())onSave(f);}} v="warning" sm icon="ti-check">Registrar</Btn>}/>
    <div style={{padding:"20px",...R.col,gap:14}}>
      <Field label="Producto (opcional — dejar en blanco para gastos logísticos)" error={err.productId}>
        <select value={f.productId} onChange={chProd} style={{width:"100%",fontFamily:"inherit"}}>
          <option value="">— Gasto logístico / sin producto —</option>
          {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>
      {prod&&<div style={R.surf}>
        <span style={{fontSize:13,color:"var(--c-sec)"}}>Costo habitual: <strong style={{color:"var(--c-war)"}}>{C$S(prod.buyPrice)}</strong></span>
        <span style={{fontSize:13,color:"var(--c-sec)",marginLeft:20}}>Stock actual: <strong>{prod.stock} u.</strong></span>
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Field label="Cantidad" error={err.qty}>
          <input type="number" min="1" value={f.qty} onChange={set("qty")} style={{width:"100%",borderColor:err.qty?"var(--c-dan)":""}}/>
        </Field>
        <Field label="Precio unitario (C$)" error={err.unitPrice}>
          <input type="number" min="0" value={f.unitPrice} onChange={set("unitPrice")} style={{width:"100%",borderColor:err.unitPrice?"var(--c-dan)":""}}/>
        </Field>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Field label="Fecha"><input type="date" value={f.date} onChange={set("date")} style={{width:"100%"}}/></Field>
        <Field label="Proveedor / Cuenta / Notas"><input value={f.notes} onChange={set("notes")} placeholder="Cta. Marjorie, Pinolero…" style={{width:"100%"}}/></Field>
      </div>
      {total>0&&<div style={{background:"linear-gradient(135deg,#f59e0b,#d97706)",borderRadius:16,padding:"18px 20px",boxShadow:"0 6px 20px rgba(245,158,11,0.3)"}}>
        <div style={R.rowB}>
          <span style={{fontSize:14,color:"rgba(255,255,255,0.8)"}}>Total a registrar</span>
          <span style={{fontSize:34,fontWeight:800,color:"#fff"}}>{C$S(total)}</span>
        </div>
      </div>}
    </div>
  </div>;
}

// ─── PRODUCT DETAIL ──────────────────────────────────────────────
function ProductDetail({product,txs,clients,onEdit,onSale,onPurchase,onBack}) {
  const myTxs=[...txs].filter(t=>t.productId===product.id).sort((a,b)=>(b.date+(b.time||"")).localeCompare(a.date+(a.time||"")));
  const sales=myTxs.filter(t=>t.type==="sale");
  const soldQty=sales.reduce((s,t)=>s+t.qty,0);
  const revenue=sales.reduce((s,t)=>s+t.total,0);
  const profit=revenue-soldQty*product.buyPrice;
  const margin=product.sellPrice-product.buyPrice;
  const mPct=product.sellPrice>0?((margin/product.sellPrice)*100).toFixed(1):0;
  const n=new Date();
  const spark=Array.from({length:6},(_,i)=>{const d=new Date(n);d.setMonth(d.getMonth()-5+i);const m=d.getMonth(),y=d.getFullYear();return myTxs.filter(t=>t.type==="sale"&&new Date(t.date+"T12:00").getMonth()===m&&new Date(t.date+"T12:00").getFullYear()===y).reduce((s,t)=>s+t.qty,0);});
  return <div>
    <BackHeader title={product.name} sub={`${product.sku||"Sin SKU"} · ${product.category||""}`} onBack={onBack} action={<Btn onClick={onEdit} sm icon="ti-edit">Editar</Btn>}/>
    <div style={{background:"linear-gradient(160deg,#0f0f0f,#1e1200)",padding:"24px 20px 20px"}}>
      <div style={{...R.rowB,marginBottom:20}}>
        <div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Stock</div>
          <div style={{fontSize:64,fontWeight:800,lineHeight:1,color:product.stock>0?"var(--c-pos)":"var(--c-dan)"}}>{product.stock}</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginTop:4}}>unidades</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Valor inventario</div>
          <div style={{fontSize:22,fontWeight:800,color:"var(--brand)"}}>{C$S(product.buyPrice*product.stock)}</div>
          <SparkBar data={spark} color="var(--brand)" height={42}/>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:4}}>Últ. 6 meses (u. vendidas)</div>
        </div>
      </div>
      <ProgressBar val={product.stock} max={Math.max(product.stock+soldQty,10)} color="var(--brand)" h={4}/>
    </div>
    <div style={{padding:"16px 20px"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        {[["Costo landed",C$(product.buyPrice),"war"],["Precio venta",C$(product.sellPrice),"pos"],["Margen/unidad",`${C$S(margin)} (${mPct}%)`,"brand"],["Ganancia total",C$S(profit),"pos"],["Unid. vendidas",`${soldQty} u.`,"inf"],["Ingresos",C$S(revenue),"inf"]].map(([l,v,c])=>(
          <div key={l} style={R.surf}>
            <div style={{...R.label,marginBottom:4}}>{l}</div>
            <div style={{fontSize:15,fontWeight:800,color:c==="brand"?"var(--brand)":`var(--c-${c})`}}>{v}</div>
          </div>
        ))}
      </div>
      {product.notes&&<div style={{...R.surf,marginBottom:14}}><div style={{...R.label,marginBottom:4}}>Notas / Costos</div><div style={{fontSize:13,color:"var(--c-pri)",lineHeight:1.6}}>{product.notes}</div></div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
        <Btn onClick={onSale}     v="positive" full lg icon="ti-receipt">Vender</Btn>
        <Btn onClick={onPurchase} v="warning"  full lg icon="ti-package">Restock</Btn>
      </div>
      <SectionLabel text={`Historial · ${myTxs.length} movimientos`}/>
      {myTxs.length===0&&<Empty icon="ti-list" text="Sin movimientos registrados"/>}
      {myTxs.map(t=>{
        const cli=clients.find(c=>c.id===t.clientId);
        return <Card key={t.id} sx={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{...R.row,gap:12}}>
            <div style={{width:42,height:42,borderRadius:13,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:t.type==="sale"?"var(--bg-pos)":"var(--bg-war)"}}>
              <i className={`ti ${t.type==="sale"?"ti-trending-up":"ti-trending-down"}`} style={{fontSize:20,color:t.type==="sale"?"var(--c-pos)":"var(--c-war)"}} aria-hidden/>
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:"var(--c-pri)"}}>{t.type==="sale"?"Venta":"Compra"} · {t.qty} u.</div>
              <div style={{fontSize:12,color:"var(--c-sec)"}}>{fmtS(t.date)}{t.time?` ${t.time}`:""}{cli?` · ${cli.name}`:t.notes?` · ${t.notes}`:""}</div>
            </div>
          </div>
          <div style={{textAlign:"right",flexShrink:0,marginLeft:8}}>
            <div style={{fontWeight:800,color:t.type==="sale"?"var(--c-pos)":"var(--c-war)"}}>{C$S(t.total)}</div>
            <div style={{fontSize:12,color:"var(--c-sec)"}}>{C$S(t.unitPrice)}/u</div>
          </div>
        </Card>;
      })}
    </div>
  </div>;
}

// ─── CLIENT FORM ─────────────────────────────────────────────────
function ClientForm({client,onSave,onDelete,onBack}) {
  const isEdit=!!client?.id;
  const [f,setF]=useState(client||{name:"",phone:"",notes:""});
  const [confirm,setConfirm]=useState(false);
  const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  return <div>
    {confirm&&<ConfirmModal title="¿Eliminar cliente?" msg="Se eliminará este cliente." onConfirm={()=>onDelete(f.id)} onCancel={()=>setConfirm(false)}/>}
    <BackHeader title={isEdit?"Editar cliente":"Nuevo cliente"} onBack={onBack} action={<Btn onClick={()=>onSave(f)} v="brand" sm icon="ti-check">Guardar</Btn>}/>
    <div style={{padding:"20px",...R.col,gap:14}}>
      <Field label="Nombre *"><input value={f.name} onChange={set("name")} placeholder="Juan Pérez" style={{width:"100%"}}/></Field>
      <Field label="Teléfono / WhatsApp"><input value={f.phone} onChange={set("phone")} placeholder="8888-0000" style={{width:"100%"}}/></Field>
      <Field label="Notas"><textarea value={f.notes} onChange={set("notes")} rows={3} placeholder="Empresa, dirección, preferencias…" style={{width:"100%",resize:"vertical",fontFamily:"inherit"}}/></Field>
      {isEdit&&<><Divider/><Btn onClick={()=>setConfirm(true)} v="danger" full icon="ti-trash">Eliminar cliente</Btn></>}
    </div>
  </div>;
}

// ══════════════════════════════════════════════════════════════════
//  MAIN APP
// ══════════════════════════════════════════════════════════════════
export default function App() {
  // All hooks at top level (no conditional hooks — fixes "Ver todo" / Movimientos bug)
  const [products,   setProducts]   = usePersist("vortex2_products",   SEED_PRODUCTS);
  const [txs,        setTxs]        = usePersist("vortex2_txs",        SEED_TXS);
  const [clients,    setClients]    = usePersist("vortex2_clients",     SEED_CLIENTS);
  const [categories, setCategories] = usePersist("vortex2_categories", SEED_CATS);
  const [view,       setView]       = useState({name:"main"});
  const [tab,        setTab]        = useState("home");
  const [mvTab,      setMvTab]      = useState("sales"); // lifted — was inside render (bug source)
  const [toast,      setToastSt]    = useState(null);
  const [search,     setSearch]     = useState("");
  const [catFilter,  setCat]        = useState("Todos");
  const [stockF,     setStockF]     = useState("all");
  const [quickOpen,  setQuick]      = useState(false);
  const [catMgr,     setCatMgr]     = useState(false);
  const [resetConf,  setResetConf]  = useState(false);

  const go   = useCallback(v=>{setView(v);setQuick(false);},[]);
  const back = useCallback(()=>setView({name:"main"}),[]);
  const getProd  = id=>products.find(p=>p.id===+id);
  const getClient= id=>clients.find(c=>c.id===+id);
  const showToast= useCallback((msg,type="ok")=>{setToastSt({msg,type});setTimeout(()=>setToastSt(null),3000);},[]);

  const stats=useMemo(()=>{
    const invested=txs.filter(t=>t.type==="purchase").reduce((s,t)=>s+t.total,0);
    const revenue =txs.filter(t=>t.type==="sale").reduce((s,t)=>s+t.total,0);
    const cogs    =txs.filter(t=>t.type==="sale").reduce((s,t)=>{const p=getProd(t.productId);return s+(p?p.buyPrice*t.qty:0);},0);
    const invValue=products.reduce((s,p)=>s+p.buyPrice*p.stock,0);
    const units   =products.reduce((s,p)=>s+p.stock,0);
    return{invested,revenue,profit:revenue-cogs,cogs,invValue,units,saleCnt:txs.filter(t=>t.type==="sale").length};
  },[products,txs]);

  const lowStock=products.filter(p=>p.stock<=(+(p.minStock)||2));

  const monthlySales=useMemo(()=>{
    const n=new Date();
    return Array.from({length:6},(_,i)=>{const d=new Date(n);d.setMonth(d.getMonth()-5+i);const m=d.getMonth(),y=d.getFullYear();return txs.filter(t=>t.type==="sale"&&new Date(t.date+"T12:00").getMonth()===m&&new Date(t.date+"T12:00").getFullYear()===y).reduce((s,t)=>s+t.total,0);});
  },[txs]);

  // ── HANDLERS ──
  const saveProduct=useCallback(f=>{
    if(!f.name||!+f.buyPrice||!+f.sellPrice){showToast("Completa los campos requeridos","err");return;}
    const p={...f,buyPrice:+f.buyPrice,sellPrice:+f.sellPrice,stock:+f.stock||0,minStock:+f.minStock||2};
    if(p.id){setProducts(ps=>ps.map(x=>x.id===p.id?p:x));showToast("Producto actualizado ✓");}
    else{setProducts(ps=>[...ps,{...p,id:uid()}]);showToast("Producto agregado ✓");}
    back();
  },[showToast,back]);

  const deleteProduct=useCallback(id=>{
    setProducts(ps=>ps.filter(p=>p.id!==id));
    setTxs(ts=>ts.filter(t=>t.productId!==id));
    showToast("Producto eliminado");back();
  },[showToast,back]);

  const saveSale=useCallback(f=>{
    const p=getProd(f.productId);
    if(!p||!+f.qty||!+f.unitPrice){showToast("Completa todos los campos","err");return;}
    if(+f.qty>p.stock){showToast(`Solo hay ${p.stock} u. disponibles`,"err");return;}
    const disc=Math.min(+(f.discount)||0,100);
    const finalP=(+f.unitPrice)*(1-disc/100);
    const total=finalP*(+f.qty);
    setTxs(ts=>[{id:uid(),type:"sale",productId:+f.productId,qty:+f.qty,unitPrice:finalP,total,date:f.date,time:f.time||null,notes:f.notes||"",discount:disc,clientId:+f.clientId||null},...ts]);
    setProducts(ps=>ps.map(x=>x.id===+f.productId?{...x,stock:x.stock-(+f.qty)}:x));
    showToast(`¡Venta de ${C$S(total)} registrada!`);back();
  },[products,showToast,back]);

  const savePurchase=useCallback(f=>{
    if(!+f.qty||!+f.unitPrice){showToast("Completa los campos","err");return;}
    const total=(+f.unitPrice)*(+f.qty);
    setTxs(ts=>[{id:uid(),type:"purchase",productId:+f.productId||null,qty:+f.qty,unitPrice:+f.unitPrice,total,date:f.date,time:null,notes:f.notes||"",discount:0,clientId:null},...ts]);
    if(f.productId)setProducts(ps=>ps.map(x=>x.id===+f.productId?{...x,stock:x.stock+(+f.qty)}:x));
    showToast(`Compra de ${C$S(total)} registrada`);back();
  },[showToast,back]);

  const saveClient=useCallback(f=>{
    if(!f.name){showToast("El nombre es requerido","err");return;}
    if(f.id){setClients(cs=>cs.map(x=>x.id===f.id?f:x));showToast("Cliente actualizado ✓");}
    else{setClients(cs=>[...cs,{...f,id:uid()}]);showToast("Cliente agregado ✓");}
    back();
  },[showToast,back]);

  const deleteClient=useCallback(id=>{setClients(cs=>cs.filter(c=>c.id!==id));showToast("Cliente eliminado");back();},[showToast,back]);

  const saveCategories=useCallback(cats=>{
    setCategories(cats);
    setProducts(ps=>ps.map(p=>cats.includes(p.category)?p:{...p,category:cats[0]||""}));
    setCatMgr(false);showToast("Categorías actualizadas ✓");
  },[showToast]);

  const exportCSV=useCallback(()=>{
    const h1=["Producto","SKU","Categoría","Costo Landed","P.Venta","Stock","Valor Inv","Margen"];
    const r1=products.map(p=>[p.name,p.sku||"",p.category||"",p.buyPrice,p.sellPrice,p.stock,(p.buyPrice*p.stock).toFixed(0),(p.sellPrice-p.buyPrice).toFixed(0)]);
    const h2=["Tipo","Producto","Cantidad","P.Unitario","Total","Descuento","Fecha","Hora","Cliente","Notas"];
    const r2=[...txs].sort((a,b)=>b.date.localeCompare(a.date)).map(t=>{const p=getProd(t.productId);const c=getClient(t.clientId);return[t.type==="sale"?"Venta":"Compra",p?.name||"(logística)",t.qty,(+t.unitPrice).toFixed(0),t.total.toFixed(0),t.discount?t.discount+"%":"0%",t.date,t.time||"",c?.name||"",t.notes||""];});
    const csv=[h1,...r1,[],[h2],...r2].map(r=>r.join(",")).join("\n");
    const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`vortex_${todayISO()}.csv`;a.click();
    showToast("CSV exportado ✓");
  },[products,txs,clients,showToast]);

  // ── ROUTING ──
  if(view.name==="add-product")    return <ProductForm product={null}      categories={categories} onSave={saveProduct}  onDelete={deleteProduct} onBack={back}/>;
  if(view.name==="edit-product")   return <ProductForm product={view.data}  categories={categories} onSave={saveProduct}  onDelete={deleteProduct} onBack={back}/>;
  if(view.name==="product-detail") return <ProductDetail product={view.data} txs={txs} clients={clients} onEdit={()=>go({name:"edit-product",data:view.data})} onSale={()=>go({name:"add-sale",data:{pid:view.data.id}})} onPurchase={()=>go({name:"add-purchase",data:{pid:view.data.id}})} onBack={back}/>;
  if(view.name==="add-sale")       return <SaleForm     products={products} clients={clients} initPid={view.data?.pid} onSave={saveSale}     onBack={back}/>;
  if(view.name==="add-purchase")   return <PurchaseForm products={products}                  initPid={view.data?.pid} onSave={savePurchase} onBack={back}/>;
  if(view.name==="add-client")     return <ClientForm client={null}      onSave={saveClient} onDelete={deleteClient} onBack={back}/>;
  if(view.name==="edit-client")    return <ClientForm client={view.data}  onSave={saveClient} onDelete={deleteClient} onBack={back}/>;

  // ── MAIN ──
  const TABS=[
    {id:"home",    icon:"ti-home-2",         label:"Inicio"},
    {id:"products",icon:"ti-package",         label:"Productos"},
    {id:"moves",   icon:"ti-arrows-exchange", label:"Movimientos"},
    {id:"clients", icon:"ti-users",           label:"Clientes"},
    {id:"reports", icon:"ti-chart-pie-2",     label:"Reportes"},
  ];

  const allCats=["Todos",...categories];
  const filtProds=products.filter(p=>{
    const ms=!search||p.name.toLowerCase().includes(search.toLowerCase())||(p.sku||"").toLowerCase().includes(search.toLowerCase());
    const mc=catFilter==="Todos"||(p.category||"")===catFilter;
    const mf=stockF==="all"||(stockF==="in"&&p.stock>(+(p.minStock)||2))||(stockF==="low"&&p.stock>0&&p.stock<=(+(p.minStock)||2))||(stockF==="out"&&p.stock===0);
    return ms&&mc&&mf;
  });

  const sortTx=(arr)=>[...arr].sort((a,b)=>(b.date+(b.time||"99:99")).localeCompare(a.date+(a.time||"99:99")));
  const saleTxs=sortTx(txs.filter(t=>t.type==="sale"));
  const purchTxs=sortTx(txs.filter(t=>t.type==="purchase"));
  const mvList=mvTab==="sales"?saleTxs:purchTxs;
  const groupDate=arr=>{const g={};arr.forEach(t=>{if(!g[t.date])g[t.date]=[];g[t.date].push(t);});return Object.entries(g).sort((a,b)=>b[0].localeCompare(a[0]));};

  const TxItem=({t})=>{
    const p=getProd(t.productId);const c=getClient(t.clientId);
    return <Card sx={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{...R.row,gap:12}}>
        <div style={{width:44,height:44,borderRadius:13,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:t.type==="sale"?"var(--bg-pos)":"var(--bg-war)"}}>
          <i className={`ti ${t.type==="sale"?"ti-trending-up":"ti-trending-down"}`} style={{fontSize:22,color:t.type==="sale"?"var(--c-pos)":"var(--c-war)"}} aria-hidden/>
        </div>
        <div style={{minWidth:0}}>
          <div style={{fontSize:14,fontWeight:700,color:"var(--c-pri)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:170}}>{p?.name||"Logística"}</div>
          <div style={{fontSize:12,color:"var(--c-sec)"}}>
            {t.qty} u. · {fmtS(t.date)}{t.time?` ${t.time}`:""}
            {c?` · ${c.name}`:t.notes?` · ${t.notes.slice(0,40)}`:""}{t.discount>0&&<span style={{marginLeft:5}}><Badge v="info" sm>-{t.discount}%</Badge></span>}
          </div>
        </div>
      </div>
      <div style={{fontWeight:800,color:t.type==="sale"?"var(--c-pos)":"var(--c-war)",marginLeft:8,flexShrink:0,fontSize:15}}>{C$S(t.total)}</div>
    </Card>;
  };

  return <div>
    <style>{`@keyframes slideDown{from{opacity:0;transform:translateX(-50%) translateY(-14px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>

    {catMgr&&<CategoryManager categories={categories} onSave={saveCategories} onClose={()=>setCatMgr(false)}/>}
    {resetConf&&<ConfirmModal title="¿Restablecer datos?" msg="Volver a los datos originales del negocio. No se puede deshacer." onConfirm={()=>{setProducts(SEED_PRODUCTS);setTxs(SEED_TXS);setClients(SEED_CLIENTS);setCategories(SEED_CATS);setResetConf(false);showToast("Datos restablecidos");}} onCancel={()=>setResetConf(false)}/>}
    <Toast toast={toast}/>

    {/* HEADER */}
    <div style={{background:"linear-gradient(160deg,#0f0f0f 0%,#1a0a00 100%)",paddingTop:"calc(16px + env(safe-area-inset-top,0px))"}}>
      <div style={{...R.rowB,padding:"0 20px 16px"}}>
        <div style={{...R.row,gap:12}}>
          <div style={{width:40,height:40,borderRadius:12,background:"var(--brand)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 20px var(--brand-glow)"}}>
            <i className="ti ti-storm" style={{fontSize:24,color:"#fff"}} aria-hidden/>
          </div>
          <div>
            <div style={{fontSize:22,fontWeight:900,color:"#fff",letterSpacing:"-0.5px"}}>Vortex</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>Control de inventario</div>
          </div>
        </div>
        <div style={{...R.row,gap:8}}>
          <IconBtn onClick={exportCSV} icon="ti-download" sx={{background:"rgba(255,255,255,0.1)",color:"#fff"}}/>
          <IconBtn onClick={()=>setQuick(q=>!q)} icon={quickOpen?"ti-x":"ti-plus"} sx={{background:"var(--brand)",color:"#fff",boxShadow:"0 4px 12px var(--brand-glow)"}}/>
        </div>
      </div>

      {quickOpen&&<div style={{margin:"0 16px 16px",background:"rgba(255,255,255,0.06)",borderRadius:16,padding:14,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {[["Nueva venta","ti-receipt","var(--c-pos)"],["Nueva compra","ti-package","var(--c-war)"],["Nuevo producto","ti-plus","var(--c-inf)"],["Nuevo cliente","ti-user-plus","var(--brand)"]].map(([l,ic,col])=>(
          <button key={l} onClick={()=>go({name:l==="Nueva venta"?"add-sale":l==="Nueva compra"?"add-purchase":l==="Nuevo producto"?"add-product":"add-client"})} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:12,background:"rgba(255,255,255,0.07)",border:"none",cursor:"pointer",color:"#fff",fontSize:13,fontWeight:600,fontFamily:"inherit"}}>
            <i className={`ti ${ic}`} style={{fontSize:18,color:col}} aria-hidden/>{l}
          </button>
        ))}
      </div>}

      <div style={{display:"flex",overflowX:"auto",scrollbarWidth:"none",padding:"0 12px"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>{setTab(t.id);setQuick(false);}} style={{flex:"0 0 auto",background:"none",border:"none",borderBottom:tab===t.id?"2px solid var(--brand)":"2px solid transparent",padding:"10px 14px 12px",cursor:"pointer",color:tab===t.id?"var(--brand)":"rgba(255,255,255,0.35)",fontSize:11,display:"flex",flexDirection:"column",alignItems:"center",gap:3,fontWeight:tab===t.id?800:400,fontFamily:"inherit",minWidth:62}}>
            <i className={`ti ${t.icon}`} style={{fontSize:20}} aria-hidden/>{t.label}
          </button>
        ))}
      </div>
    </div>

    <div style={{padding:20,paddingBottom:30}}>

      {/* ════ HOME ════ */}
      {tab==="home"&&<>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
          <StatCard label="Ganancia"   value={C$S(stats.profit)}   sub="Acumulada"                  icon="ti-trending-up" color="brand"/>
          <StatCard label="Ventas"     value={C$S(stats.revenue)}  sub={`${stats.saleCnt} transac.`} icon="ti-cash"        color="positive"/>
          <StatCard label="Invertido"  value={C$S(stats.invested)} sub="Total pagado"                icon="ti-coin"        color="warning"/>
          <StatCard label="Inventario" value={C$S(stats.invValue)} sub={`${stats.units} unidades`}   icon="ti-box"         color="neutral"/>
        </div>

        {/* Trend */}
        <Card shadow sx={{marginBottom:20}}>
          <div style={{...R.rowB,marginBottom:14}}>
            <div>
              <div style={{...R.label,marginBottom:2}}>Ventas — últimos 6 meses</div>
              <div style={{fontSize:22,fontWeight:800,color:"var(--c-pri)"}}>{C$S(monthlySales[5]||0)}</div>
              <div style={{fontSize:12,color:"var(--c-sec)"}}>este mes</div>
            </div>
            <SparkBar data={monthlySales} color="var(--brand)" height={56}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            {(()=>{const n=new Date();return Array.from({length:6},(_,i)=>{const d=new Date(n);d.setMonth(d.getMonth()-5+i);return MONTHS[d.getMonth()];});})().map((m,i)=>(
              <span key={i} style={{fontSize:10,color:i===5?"var(--brand)":"var(--c-ter)",fontWeight:i===5?800:400}}>{m}</span>
            ))}
          </div>
        </Card>

        {/* Resumen de lotes en tránsito */}
        <Card sx={{borderColor:"var(--brand)",marginBottom:20}}>
          <SectionLabel text="📦 Lotes en tránsito"/>
          {[
            {icon:"✈",label:"Lote A · ETA mar/mié próx. semana",detail:"6 PLUS + 3 MAX · Ctas. Marjorie & Yisleni"},
            {icon:"✈",label:"Lote B Relatos · ETA jueves próx.",detail:"3 HD + 3 SELECT · Cta. Relatos"},
            {icon:"✈",label:"Lote B Marjorie · ETA ~3 semanas",detail:"3 HD + 3 SELECT · BARCO · Cta. Marjorie"},
          ].map((r,i)=>(
            <div key={i} style={{...R.row,gap:10,padding:"10px 0",borderTop:i>0?"0.5px solid var(--brd3)":"none"}}>
              <span style={{fontSize:20}}>{r.icon}</span>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:"var(--c-pri)"}}>{r.label}</div>
                <div style={{fontSize:12,color:"var(--c-sec)"}}>{r.detail}</div>
              </div>
            </div>
          ))}
        </Card>

        {/* Low stock */}
        {lowStock.length>0&&<Card sx={{borderColor:"var(--c-dan)",marginBottom:20}}>
          <div style={{...R.row,gap:10,marginBottom:12}}>
            <div style={{width:34,height:34,borderRadius:10,background:"var(--bg-dan)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <i className="ti ti-alert-triangle" style={{fontSize:18,color:"var(--c-dan)"}} aria-hidden/>
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:"var(--c-dan)"}}>Stock bajo</div>
              <div style={{fontSize:12,color:"var(--c-sec)"}}>{lowStock.length} producto{lowStock.length>1?"s":""} por reabastecer</div>
            </div>
          </div>
          {lowStock.map(p=>(
            <div key={p.id} style={{...R.rowB,padding:"9px 0",borderTop:"0.5px solid var(--brd3)"}}>
              <div onClick={()=>go({name:"product-detail",data:p})} style={{cursor:"pointer",flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:600,color:"var(--c-pri)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                <StockBadge stock={p.stock} min={+(p.minStock)||2}/>
              </div>
              <Btn onClick={()=>go({name:"add-purchase",data:{pid:p.id}})} v="ghost-war" sm sx={{marginLeft:8}} icon="ti-package">Restock</Btn>
            </div>
          ))}
        </Card>}

        {/* Top productos */}
        {saleTxs.length>0&&(()=>{
          const by={};saleTxs.forEach(t=>{const p=getProd(t.productId);if(p){if(!by[p.id])by[p.id]={name:p.name,rev:0,qty:0};by[p.id].rev+=t.total;by[p.id].qty+=t.qty;}});
          const sorted=Object.values(by).sort((a,b)=>b.rev-a.rev).slice(0,4);
          const maxR=Math.max(...sorted.map(x=>x.rev),1);
          return <Card shadow sx={{marginBottom:20}}>
            <SectionLabel text="🏆 Top productos"/>
            {sorted.map((p,i)=>(
              <div key={p.name} style={{marginBottom:14}}>
                <div style={{...R.rowB,marginBottom:5}}>
                  <div style={{...R.row,gap:8}}>
                    <div style={{width:22,height:22,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,background:i===0?"#FFD700":i===1?"#C0C0C0":i===2?"#CD7F32":"var(--bg2)",color:i<3?"#111":"var(--c-ter)"}}>{i+1}</div>
                    <span style={{fontSize:13,fontWeight:700,color:"var(--c-pri)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:155}}>{p.name}</span>
                  </div>
                  <span style={{fontSize:13,fontWeight:800,color:"var(--brand)",flexShrink:0}}>{C$S(p.rev)}</span>
                </div>
                <ProgressBar val={p.rev} max={maxR} color={i===0?"var(--brand)":"var(--c-inf)"}/>
                <div style={{fontSize:11,color:"var(--c-ter)",marginTop:3}}>{p.qty} unidades vendidas</div>
              </div>
            ))}
          </Card>;
        })()}

        <SectionLabel text="Actividad reciente" action={
          <button onClick={()=>setTab("moves")} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:"var(--brand)",fontFamily:"inherit",fontWeight:700}}>Ver todo →</button>
        }/>
        {txs.length===0&&<Empty icon="ti-clock" text="Sin actividad aún"/>}
        {sortTx(txs).slice(0,5).map(t=><TxItem key={t.id} t={t}/>)}
      </>}

      {/* ════ PRODUCTS ════ */}
      {tab==="products"&&<>
        <div style={{...R.row,gap:8,marginBottom:14}}>
          <div style={{flex:1,position:"relative"}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar nombre o SKU…" style={{width:"100%",paddingLeft:36}}/>
            <i className="ti ti-search" style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:"var(--c-ter)",fontSize:16,pointerEvents:"none"}} aria-hidden/>
            {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--c-ter)",display:"flex"}}><i className="ti ti-x" aria-hidden/></button>}
          </div>
          <Btn onClick={()=>go({name:"add-product"})} v="brand" sm icon="ti-plus">Nuevo</Btn>
        </div>

        <div style={{...R.row,gap:6,marginBottom:10,overflowX:"auto",scrollbarWidth:"none",paddingBottom:4}}>
          {allCats.map(c=>(
            <button key={c} onClick={()=>setCat(c)} style={{padding:"6px 14px",borderRadius:99,fontSize:13,fontWeight:600,border:"1.5px solid",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",borderColor:catFilter===c?"var(--brand)":"var(--brd2)",background:catFilter===c?"var(--brand)":"transparent",color:catFilter===c?"#fff":"var(--c-sec)"}}>
              {c}
            </button>
          ))}
          <button onClick={()=>setCatMgr(true)} style={{padding:"6px 12px",borderRadius:99,fontSize:13,fontWeight:600,border:"1.5px dashed var(--brd2)",cursor:"pointer",fontFamily:"inherit",background:"transparent",color:"var(--c-ter)",whiteSpace:"nowrap",flexShrink:0}}>
            <i className="ti ti-settings" style={{fontSize:13}} aria-hidden/> Gestionar
          </button>
        </div>

        <div style={{...R.row,gap:6,marginBottom:14,flexWrap:"wrap"}}>
          {[["all","Todos"],["in","En stock"],["low","Bajo"],["out","Sin stock"]].map(([v,l])=>(
            <button key={v} onClick={()=>setStockF(v)} style={{padding:"5px 12px",borderRadius:99,fontSize:12,fontWeight:700,border:"1px solid",cursor:"pointer",fontFamily:"inherit",borderColor:stockF===v?"var(--c-pri)":"var(--brd2)",background:stockF===v?"var(--c-pri)":"transparent",color:stockF===v?"var(--bg1)":"var(--c-sec)"}}>
              {l}
            </button>
          ))}
          <span style={{fontSize:12,color:"var(--c-ter)",alignSelf:"center",marginLeft:"auto"}}>{filtProds.length} productos</span>
        </div>

        {filtProds.length===0&&<Empty icon="ti-box-off" title="Sin resultados" text={products.length===0?"Agrega tu primer producto":"Prueba otro filtro"} action={products.length===0&&<Btn onClick={()=>go({name:"add-product"})} v="brand" icon="ti-plus">Agregar producto</Btn>}/>}

        {filtProds.map(p=>(
          <Card key={p.id} onClick={()=>go({name:"product-detail",data:p})} shadow>
            <div style={{...R.rowB,marginBottom:8}}>
              <div style={{...R.row,gap:12,flex:1,minWidth:0}}>
                <div style={{width:46,height:46,borderRadius:13,background:"var(--bg-bra)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <i className="ti ti-device-tv" style={{fontSize:24,color:"var(--brand)"}} aria-hidden/>
                </div>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:15,fontWeight:700,color:"var(--c-pri)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                  <div style={{...R.row,gap:6,marginTop:3}}>
                    {p.sku&&<span style={{fontSize:11,color:"var(--c-ter)"}}>{p.sku}</span>}
                    {p.category&&<Badge v="brand" sm>{p.category}</Badge>}
                  </div>
                </div>
              </div>
              <StockBadge stock={p.stock} min={+(p.minStock)||2}/>
            </div>
            <ProgressBar val={p.stock} max={Math.max(p.stock+3,10)} color={p.stock===0?"var(--c-dan)":p.stock<=(+(p.minStock)||2)?"var(--c-war)":"var(--c-pos)"}/>
            <div style={{...R.rowB,marginTop:10}}>
              <div style={{display:"flex",gap:14,fontSize:13}}>
                <span style={{color:"var(--c-sec)"}}>Costo: <strong style={{color:"var(--c-war)"}}>{C$S(p.buyPrice)}</strong></span>
                <span style={{color:"var(--c-sec)"}}>Venta: <strong style={{color:"var(--c-pos)"}}>{C$S(p.sellPrice)}</strong></span>
                <span style={{color:"var(--c-sec)"}}>Margen: <strong style={{color:"var(--brand)"}}>{C$S(p.sellPrice-p.buyPrice)}</strong></span>
              </div>
              <div style={{display:"flex",gap:6}} onClick={e=>e.stopPropagation()}>
                <IconBtn onClick={()=>go({name:"add-sale",data:{pid:p.id}})}     icon="ti-receipt" sx={{background:"var(--bg-pos)",color:"var(--c-pos)"}} size={30}/>
                <IconBtn onClick={()=>go({name:"add-purchase",data:{pid:p.id}})} icon="ti-package" sx={{background:"var(--bg-war)",color:"var(--c-war)"}} size={30}/>
                <IconBtn onClick={()=>go({name:"edit-product",data:p})}          icon="ti-edit"    size={30}/>
              </div>
            </div>
          </Card>
        ))}
      </>}

      {/* ════ MOVES ════ */}
      {tab==="moves"&&<>
        <div style={{...R.rowB,marginBottom:16}}>
          <div>
            <div style={{...R.label,marginBottom:2}}>{mvTab==="sales"?"Total en ventas":"Total invertido"}</div>
            <div style={{fontSize:28,fontWeight:800,color:mvTab==="sales"?"var(--c-pos)":"var(--c-war)"}}>{C$S(mvList.reduce((s,t)=>s+t.total,0))}</div>
            <div style={{fontSize:12,color:"var(--c-sec)",marginTop:2}}>{mvList.length} registros · {mvList.reduce((s,t)=>s+t.qty,0)} unidades</div>
          </div>
          <Btn onClick={()=>go({name:mvTab==="sales"?"add-sale":"add-purchase"})} v={mvTab==="sales"?"positive":"warning"} icon="ti-plus">Nueva</Btn>
        </div>

        <div style={{display:"flex",background:"var(--bg2)",borderRadius:12,padding:4,marginBottom:16}}>
          {[["sales","Ventas"],["purchases","Compras"]].map(([v,l])=>(
            <button key={v} onClick={()=>setMvTab(v)} style={{flex:1,padding:"9px",borderRadius:9,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:700,background:mvTab===v?"var(--bg1)":"transparent",color:mvTab===v?"var(--c-pri)":"var(--c-sec)",boxShadow:mvTab===v?"0 2px 10px rgba(0,0,0,0.1)":"none"}}>{l}</button>
          ))}
        </div>

        {mvList.length===0&&<Empty icon={mvTab==="sales"?"ti-receipt-off":"ti-shopping-cart-off"} title="Sin registros" text={`No hay ${mvTab==="sales"?"ventas":"compras"} registradas`}/>}

        {groupDate(mvList).map(([date,ts])=>(
          <div key={date} style={{marginBottom:8}}>
            <div style={{...R.rowB,marginBottom:8}}>
              <span style={{fontSize:12,fontWeight:700,color:"var(--c-sec)"}}>{fmtD(date)}</span>
              <span style={{fontSize:12,fontWeight:800,color:mvTab==="sales"?"var(--c-pos)":"var(--c-war)"}}>{C$S(ts.reduce((a,t)=>a+t.total,0))}</span>
            </div>
            {ts.map(t=><TxItem key={t.id} t={t}/>)}
          </div>
        ))}
      </>}

      {/* ════ CLIENTS ════ */}
      {tab==="clients"&&<>
        <div style={{...R.rowB,marginBottom:16}}>
          <div>
            <div style={{...R.label,marginBottom:2}}>Directorio</div>
            <div style={{fontSize:24,fontWeight:800,color:"var(--c-pri)"}}>{clients.length} cliente{clients.length!==1?"s":""}</div>
          </div>
          <Btn onClick={()=>go({name:"add-client"})} v="brand" icon="ti-user-plus">Nuevo</Btn>
        </div>
        {clients.length===0&&<Empty icon="ti-users" title="Sin clientes aún" text="Agrega tus clientes para llevar el control de cada venta" action={<Btn onClick={()=>go({name:"add-client"})} v="brand" icon="ti-user-plus">Agregar cliente</Btn>}/>}
        {clients.map(c=>{
          const cTxs=txs.filter(t=>t.type==="sale"&&t.clientId===c.id);
          const cTotal=cTxs.reduce((s,t)=>s+t.total,0);
          return <Card key={c.id} shadow onClick={()=>go({name:"edit-client",data:c})}>
            <div style={R.rowB}>
              <div style={{...R.row,gap:12}}>
                <Avatar name={c.name} size={46}/>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:"var(--c-pri)"}}>{c.name}</div>
                  <div style={{fontSize:12,color:"var(--c-sec)"}}>{c.phone||"Sin teléfono"}</div>
                  {c.notes&&<div style={{fontSize:11,color:"var(--c-ter)",marginTop:1}}>{c.notes}</div>}
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                {cTotal>0&&<div style={{fontSize:14,fontWeight:800,color:"var(--c-pos)"}}>{C$S(cTotal)}</div>}
                {cTxs.length>0&&<div style={{fontSize:11,color:"var(--c-ter)"}}>{cTxs.length} compra{cTxs.length>1?"s":""}</div>}
              </div>
            </div>
          </Card>;
        })}
      </>}

      {/* ════ REPORTS ════ */}
      {tab==="reports"&&(()=>{
        const gPct=stats.revenue>0?((stats.profit/stats.revenue)*100).toFixed(1):0;
        const roi =stats.invested>0?((stats.profit/stats.invested)*100).toFixed(1):0;
        const avgTk=stats.saleCnt>0?stats.revenue/stats.saleCnt:0;
        const byProd={};
        products.forEach(p=>{byProd[p.id]={id:p.id,name:p.name,buyPrice:p.buyPrice,stock:p.stock,soldQty:0,rev:0,profit:0};});
        txs.forEach(t=>{if(t.type==="sale"&&t.productId&&byProd[t.productId]){byProd[t.productId].soldQty+=t.qty;byProd[t.productId].rev+=t.total;byProd[t.productId].profit+=(t.unitPrice-byProd[t.productId].buyPrice)*t.qty;}});
        const ps=Object.values(byProd).sort((a,b)=>b.rev-a.rev);
        const sold=ps.filter(p=>p.soldQty>0);
        const maxP=Math.max(...ps.map(x=>x.profit),1);
        const n=new Date();
        const monthly=Array.from({length:6},(_,i)=>{const d=new Date(n);d.setMonth(d.getMonth()-5+i);const m=d.getMonth(),y=d.getFullYear();const mTxs=txs.filter(t=>t.type==="sale"&&new Date(t.date+"T12:00").getMonth()===m&&new Date(t.date+"T12:00").getFullYear()===y);return{label:`${MONTHS[m]} ${y}`,rev:mTxs.reduce((s,t)=>s+t.total,0),cnt:mTxs.length};}).reverse();
        // Potential revenue
        const potential=products.reduce((s,p)=>s+p.sellPrice*p.stock,0);
        const potentialProfit=products.reduce((s,p)=>s+(p.sellPrice-p.buyPrice)*p.stock,0);
        return <>
          {/* P&L */}
          <div style={{background:"linear-gradient(160deg,#0f0f0f,#1a0a00)",borderRadius:20,padding:20,marginBottom:16,boxShadow:"0 8px 32px rgba(0,0,0,0.25)"}}>
            <div style={{...R.label,color:"rgba(255,255,255,0.35)",marginBottom:16}}>Estado de resultados</div>
            {[["Ingresos por ventas",C$S(stats.revenue),"var(--c-pos)"],["Costo de ventas",`- ${C$S(stats.cogs)}`,"var(--c-war)"]].map(([l,v,c])=>(
              <div key={l} style={{...R.rowB,marginBottom:12}}><span style={{fontSize:14,color:"rgba(255,255,255,0.5)"}}>{l}</span><span style={{fontSize:14,fontWeight:700,color:c}}>{v}</span></div>
            ))}
            <Divider my={4}/>
            <div style={{...R.rowB,marginTop:12}}>
              <span style={{fontSize:15,fontWeight:700,color:"rgba(255,255,255,0.75)"}}>Ganancia realizada</span>
              <span style={{fontSize:30,fontWeight:800,color:stats.profit>=0?"var(--brand)":"var(--c-dan)"}}>{C$S(stats.profit)}</span>
            </div>
          </div>

          {/* Proyección */}
          <Card shadow sx={{marginBottom:16}}>
            <SectionLabel text="📊 Proyección si se vende todo"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div style={R.surf}><div style={{...R.label,marginBottom:4}}>Ingresos potenciales</div><div style={{fontSize:18,fontWeight:800,color:"var(--c-pos)"}}>{C$S(potential)}</div><div style={{fontSize:11,color:"var(--c-ter)"}}>con stock actual</div></div>
              <div style={R.surf}><div style={{...R.label,marginBottom:4}}>Ganancia potencial</div><div style={{fontSize:18,fontWeight:800,color:"var(--brand)"}}>{C$S(potentialProfit)}</div><div style={{fontSize:11,color:"var(--c-ter)"}}>con stock actual</div></div>
            </div>
          </Card>

          {/* KPIs */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            <StatCard label="Margen bruto"    value={`${gPct}%`}    icon="ti-percentage"  color="brand"/>
            <StatCard label="ROI"             value={`${roi}%`}     icon="ti-trending-up"  color={+roi>=0?"positive":"neutral"}/>
            <StatCard label="Ticket promedio" value={C$S(avgTk)}   icon="ti-receipt"      color="info"/>
            <StatCard label="En inventario"   value={C$S(stats.invValue)} icon="ti-box"  color="warning"/>
          </div>

          {/* By product */}
          <Card shadow sx={{marginBottom:16}}>
            <SectionLabel text="Ganancia por producto"/>
            {sold.length===0&&<div style={{textAlign:"center",padding:"20px 0",color:"var(--c-ter)",fontSize:13}}>Sin ventas registradas aún</div>}
            {sold.map((p,i)=>(
              <div key={p.id} style={{marginBottom:18,cursor:"pointer"}} onClick={()=>go({name:"product-detail",data:products.find(x=>x.id===p.id)})}>
                <div style={{...R.rowB,marginBottom:5}}>
                  <div style={{...R.row,gap:8}}>
                    <div style={{width:24,height:24,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,background:i===0?"#FFD700":i===1?"#C0C0C0":i===2?"#CD7F32":"var(--bg2)",color:i<3?"#111":"var(--c-ter)"}}>{i+1}</div>
                    <span style={{fontSize:13,fontWeight:700,color:"var(--c-pri)",maxWidth:155,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</span>
                  </div>
                  <span style={{fontSize:14,fontWeight:800,color:p.profit>=0?"var(--c-pos)":"var(--c-dan)",flexShrink:0}}>{C$S(p.profit)}</span>
                </div>
                <ProgressBar val={Math.max(0,p.profit)} max={maxP} color={p.profit>=0?"var(--c-pos)":"var(--c-dan)"}/>
                <div style={{display:"flex",gap:16,fontSize:11,color:"var(--c-ter)",marginTop:3}}>
                  <span>{p.soldQty} vendidas</span><span>Ingreso: {C$S(p.rev)}</span><span>Margen: {p.rev>0?((p.profit/p.rev)*100).toFixed(0):0}%</span>
                </div>
              </div>
            ))}
          </Card>

          {/* Monthly */}
          <Card shadow sx={{marginBottom:16}}>
            <SectionLabel text="Ventas por mes (últimos 6)"/>
            {monthly.map((m,i)=>(
              <div key={i} style={{...R.rowB,padding:"9px 0",borderTop:i>0?"0.5px solid var(--brd3)":"none"}}>
                <div><div style={{fontSize:14,fontWeight:600,color:"var(--c-pri)"}}>{m.label}</div><div style={{fontSize:11,color:"var(--c-ter)"}}>{m.cnt} transacciones</div></div>
                <div style={{fontSize:15,fontWeight:800,color:m.rev>0?"var(--c-pos)":"var(--c-ter)"}}>{C$S(m.rev)}</div>
              </div>
            ))}
          </Card>

          {/* Data zone */}
          <Card sx={{borderColor:"var(--brd2)"}}>
            <SectionLabel text="Datos y exportación"/>
            <p style={{fontSize:13,color:"var(--c-sec)",marginBottom:14,lineHeight:1.6}}>Tus datos se guardan automáticamente en este dispositivo cada vez que realizas un cambio.</p>
            <div style={{...R.col,gap:10}}>
              <Btn onClick={exportCSV} full lg icon="ti-file-spreadsheet">Exportar reporte CSV completo</Btn>
              <Btn onClick={()=>setResetConf(true)} v="ghost-dan" full icon="ti-refresh">Restablecer datos iniciales</Btn>
            </div>
          </Card>
        </>;
      })()}

    </div>
  </div>;
}
