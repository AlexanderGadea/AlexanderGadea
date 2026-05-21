import { useState, useMemo, useEffect, useCallback, useRef } from "react";

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
const C$   = n => `C$ ${(+n||0).toLocaleString("es-NI",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const C$S  = n => `C$ ${(+n||0).toLocaleString("es-NI",{minimumFractionDigits:0,maximumFractionDigits:0})}`;
const now  = () => new Date().toISOString().split("T")[0];
const uid  = () => Date.now() + Math.floor(Math.random()*9999);
const fmtD = d  => new Date(d+"T12:00").toLocaleDateString("es-NI",{day:"2-digit",month:"short",year:"numeric"});
const fmtS = d  => new Date(d+"T12:00").toLocaleDateString("es-NI",{day:"2-digit",month:"short"});
const monthLabel = d => new Date(d+"T12:00").toLocaleDateString("es-NI",{month:"long",year:"numeric"});

const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

// ─── SEED DATA ──────────────────────────────────────────────────
const SEED_PRODUCTS = [
  {id:1,name:"Fire TV Stick 4K Max",sku:"FTV-4KM",buyPrice:1400,sellPrice:2400,stock:5,notes:"Gen 2, Alexa Voice Remote Pro",minStock:2,category:"4K"},
  {id:2,name:"Fire TV Stick Lite",  sku:"FTV-LITE",buyPrice:750,sellPrice:1400,stock:8,notes:"Edición compacta 2022",minStock:3,category:"HD"},
  {id:3,name:"Fire TV Stick 4K",    sku:"FTV-4K",  buyPrice:1050,sellPrice:1850,stock:1,notes:"Soporte 4K Ultra HD",minStock:2,category:"4K"},
  {id:4,name:"Fire TV Cube",        sku:"FTV-CUBE",buyPrice:3500,sellPrice:5200,stock:0,notes:"Control manos libres hands-free",minStock:1,category:"Premium"},
  {id:5,name:"Control Remoto Alexa",sku:"RMT-ALX", buyPrice:400,sellPrice:750,stock:4,notes:"Compatible todas las series",minStock:2,category:"Accesorio"},
];
const SEED_TXS = [
  {id:1,type:"purchase",productId:1,qty:5,unitPrice:1400,total:7000,date:"2025-04-10",notes:"Amazon US",discount:0},
  {id:2,type:"purchase",productId:2,qty:8,unitPrice:750, total:6000,date:"2025-04-10",notes:"",discount:0},
  {id:3,type:"purchase",productId:3,qty:3,unitPrice:1050,total:3150,date:"2025-04-18",notes:"",discount:0},
  {id:4,type:"purchase",productId:4,qty:2,unitPrice:3500,total:7000,date:"2025-04-20",notes:"Proveedor US",discount:0},
  {id:5,type:"purchase",productId:5,qty:6,unitPrice:400, total:2400,date:"2025-04-22",notes:"",discount:0},
  {id:6,type:"sale",    productId:1,qty:2,unitPrice:2400,total:4800,date:"2025-05-02",notes:"Cliente: Marcos L.",discount:0},
  {id:7,type:"sale",    productId:2,qty:3,unitPrice:1400,total:4200,date:"2025-05-05",notes:"Cliente: Sofía R.",discount:0},
  {id:8,type:"sale",    productId:4,qty:2,unitPrice:5200,total:10400,date:"2025-05-08",notes:"TechNica S.A.",discount:0},
  {id:9,type:"sale",    productId:3,qty:2,unitPrice:1850,total:3700,date:"2025-05-12",notes:"",discount:0},
  {id:10,type:"sale",   productId:2,qty:2,unitPrice:1400,total:2800,date:"2025-05-14",notes:"Cliente: Pedro M.",discount:5},
  {id:11,type:"purchase",productId:2,qty:5,unitPrice:750,total:3750,date:"2025-05-15",notes:"Restock",discount:0},
  {id:12,type:"sale",   productId:5,qty:3,unitPrice:750,total:2250,date:"2025-05-17",notes:"Combo con stick",discount:0},
];
const SEED_CLIENTS = [
  {id:1,name:"Marcos L.",   phone:"8888-1111",notes:"Cliente frecuente"},
  {id:2,name:"Sofía R.",    phone:"8888-2222",notes:""},
  {id:3,name:"TechNica S.A.",phone:"2222-3333",notes:"Empresa, factura"},
  {id:4,name:"Pedro M.",    phone:"8888-4444",notes:""},
];

const CATEGORIES = ["Todos","4K","HD","Premium","Accesorio","Otro"];

// ─── DESIGN SYSTEM ──────────────────────────────────────────────
const s = {
  // layout
  row:   {display:"flex",alignItems:"center"},
  rowB:  {display:"flex",alignItems:"center",justifyContent:"space-between"},
  col:   {display:"flex",flexDirection:"column"},
  // text
  h1:    {fontSize:26,fontWeight:700,color:"var(--c-pri)",letterSpacing:"-0.5px"},
  h2:    {fontSize:20,fontWeight:600,color:"var(--c-pri)"},
  h3:    {fontSize:16,fontWeight:600,color:"var(--c-pri)"},
  body:  {fontSize:14,color:"var(--c-pri)"},
  small: {fontSize:12,color:"var(--c-sec)"},
  label: {fontSize:11,fontWeight:600,color:"var(--c-ter)",textTransform:"uppercase",letterSpacing:"0.08em"},
};

// ─── PRIMITIVES ─────────────────────────────────────────────────

function Avatar({name, size=38, color="orange"}) {
  const colors = {orange:["#ff6b2b","#fff"],blue:["#185fa5","#fff"],green:["#3b6d11","#fff"],purple:["#6b2fa0","#fff"]};
  const [bg,tc] = colors[color]||colors.orange;
  return <div style={{width:size,height:size,borderRadius:size/3,background:bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontWeight:700,fontSize:size*0.38,color:tc}}>
    {name?.[0]?.toUpperCase()||"?"}
  </div>;
}

function Chip({label, active, onClick, count}) {
  return <button onClick={onClick} style={{
    display:"inline-flex",alignItems:"center",gap:5,
    padding:"6px 14px",borderRadius:99,fontSize:13,fontWeight:500,
    border:"1px solid",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",
    borderColor:  active?"var(--brand)":"var(--brd2)",
    background:   active?"var(--brand)":"transparent",
    color:        active?"#fff":"var(--c-sec)",
    transition:"all 0.15s",
  }}>
    {label}
    {count!==undefined && <span style={{fontSize:11,background:active?"rgba(255,255,255,0.25)":"var(--bg2)",padding:"1px 6px",borderRadius:99}}>{count}</span>}
  </button>;
}

function Badge({v="neutral",icon,children,sm}) {
  const map = {
    success:["var(--bg-suc)","var(--c-suc)"],
    warning:["var(--bg-war)","var(--c-war)"],
    danger: ["var(--bg-dan)","var(--c-dan)"],
    info:   ["var(--bg-inf)","var(--c-inf)"],
    neutral:["var(--bg2)",   "var(--c-sec)"],
    brand:  ["var(--brand-faint)","var(--brand)"],
  };
  const [bg,tc]=map[v]||map.neutral;
  return <span style={{display:"inline-flex",alignItems:"center",gap:3,
    padding:sm?"2px 7px":"3px 10px",borderRadius:99,fontSize:sm?11:12,fontWeight:600,
    background:bg,color:tc,whiteSpace:"nowrap"}}>
    {icon&&<i className={`ti ${icon}`} style={{fontSize:sm?10:12}} aria-hidden/>}{children}
  </span>;
}

function Btn({onClick,v="ghost",full,sm,lg,children,sx={},disabled,icon}) {
  const map = {
    ghost:   {bg:"transparent",          bo:"1px solid var(--brd2)", tc:"var(--c-pri)"},
    brand:   {bg:"var(--brand)",         bo:"none",                  tc:"#fff"},
    success: {bg:"var(--c-suc)",         bo:"none",                  tc:"#fff"},
    warning: {bg:"var(--c-war)",         bo:"none",                  tc:"#fff"},
    danger:  {bg:"var(--c-dan)",         bo:"none",                  tc:"#fff"},
    info:    {bg:"var(--c-inf)",         bo:"none",                  tc:"#fff"},
    faint:   {bg:"var(--brand-faint)",   bo:"none",                  tc:"var(--brand)"},
    "suc-faint":{bg:"var(--bg-suc)",     bo:"none",                  tc:"var(--c-suc)"},
    "war-faint":{bg:"var(--bg-war)",     bo:"none",                  tc:"var(--c-war)"},
    "dan-faint":{bg:"var(--bg-dan)",     bo:"none",                  tc:"var(--c-dan)"},
    dark:    {bg:"var(--c-pri)",         bo:"none",                  tc:"var(--bg1)"},
  };
  const {bg,bo,tc}=map[v]||map.ghost;
  const pad = lg?"14px 24px" : sm?"6px 14px" : "10px 20px";
  const fs  = lg?16 : sm?12 : 14;
  return <button onClick={onClick} disabled={disabled} style={{
    display:"inline-flex",alignItems:"center",justifyContent:"center",gap:7,
    padding:pad,borderRadius:10,fontWeight:600,fontSize:fs,cursor:disabled?"not-allowed":"pointer",
    fontFamily:"inherit",background:bg,border:bo,color:tc,
    width:full?"100%":"auto",opacity:disabled?0.5:1,
    transition:"opacity 0.15s, transform 0.08s",
    boxShadow:v==="brand"?"0 4px 14px rgba(255,107,43,0.35)":"none",
    ...sx
  }}>{icon&&<i className={`ti ${icon}`} aria-hidden/>}{children}</button>;
}

function StatCard({label,value,sub,icon,trend,color="brand",onClick}) {
  const colors={
    brand:  {g:"linear-gradient(135deg,#ff6b2b,#ff8c42)",ic:"rgba(255,255,255,0.25)",tc:"#fff",sc:"rgba(255,255,255,0.75)"},
    success:{g:"linear-gradient(135deg,#2e7d32,#43a047)",ic:"rgba(255,255,255,0.25)",tc:"#fff",sc:"rgba(255,255,255,0.75)"},
    info:   {g:"linear-gradient(135deg,#1565c0,#1976d2)",ic:"rgba(255,255,255,0.25)",tc:"#fff",sc:"rgba(255,255,255,0.75)"},
    warning:{g:"linear-gradient(135deg,#e65100,#ef6c00)",ic:"rgba(255,255,255,0.25)",tc:"#fff",sc:"rgba(255,255,255,0.75)"},
    neutral:{g:"var(--bg2)",ic:"var(--bg3)",tc:"var(--c-pri)",sc:"var(--c-sec)"},
  };
  const c=colors[color]||colors.neutral;
  return <div onClick={onClick} style={{
    background:c.g,borderRadius:16,padding:"1.1rem 1.2rem",cursor:onClick?"pointer":"default",
    boxShadow:color!=="neutral"?"0 6px 20px rgba(0,0,0,0.15)":"none",
    border:color==="neutral"?"0.5px solid var(--brd3)":"none",
  }}>
    <div style={{...s.rowB,marginBottom:12}}>
      <span style={{fontSize:11,fontWeight:600,color:c.sc,textTransform:"uppercase",letterSpacing:"0.08em"}}>{label}</span>
      <div style={{width:32,height:32,borderRadius:10,background:c.ic,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <i className={`ti ${icon}`} style={{fontSize:18,color:c.tc}} aria-hidden/>
      </div>
    </div>
    <div style={{fontSize:24,fontWeight:700,color:c.tc,letterSpacing:"-0.5px",fontVariantNumeric:"tabular-nums"}}>{value}</div>
    <div style={{...s.row,gap:6,marginTop:4}}>
      <span style={{fontSize:12,color:c.sc}}>{sub}</span>
      {trend!==undefined&&<span style={{fontSize:11,fontWeight:600,color:c.tc,background:c.ic,padding:"1px 7px",borderRadius:99}}>{trend>=0?"+":""}{trend}%</span>}
    </div>
  </div>;
}

function Card({children,sx={},onClick,noPad,shadow}) {
  return <div onClick={onClick} style={{
    background:"var(--bg1)",
    border:"0.5px solid var(--brd3)",
    borderRadius:16,
    padding:noPad?0:"1rem 1.25rem",
    marginBottom:10,
    cursor:onClick?"pointer":"default",
    boxShadow:shadow?"0 2px 12px rgba(0,0,0,0.07)":"none",
    ...sx
  }}>{children}</div>;
}

function Section({title,action,children,sx={}}) {
  return <div style={{marginBottom:20,...sx}}>
    <div style={{...s.rowB,marginBottom:12}}>
      <span style={{...s.label}}>{title}</span>
      {action}
    </div>
    {children}
  </div>;
}

function ProgressBar({val,max,color="var(--brand)",h=6}) {
  const w=max>0?Math.min(100,Math.max(2,(val/max)*100)):0;
  return <div style={{height:h,background:"var(--brd3)",borderRadius:h/2,overflow:"hidden"}}>
    <div style={{height:"100%",width:w+"%",background:color,borderRadius:h/2,transition:"width 0.5s ease"}}/>
  </div>;
}

function Divider({my=8}) {
  return <div style={{height:"0.5px",background:"var(--brd3)",margin:`${my}px 0`}}/>;
}

function StockBadge({stock,min=2}) {
  if(stock===0) return <Badge v="danger" icon="ti-alert-circle">Sin stock</Badge>;
  if(stock<=min) return <Badge v="warning" icon="ti-alert-triangle">{stock} u.</Badge>;
  return <Badge v="success">{stock} u.</Badge>;
}

function Toast({toast}) {
  if(!toast) return null;
  const ok=toast.type!=="err";
  return <div style={{
    position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",
    zIndex:999,maxWidth:340,width:"calc(100% - 32px)",
    display:"flex",alignItems:"center",gap:10,
    padding:"12px 18px",borderRadius:14,
    background:ok?"var(--c-suc)":"var(--c-dan)",
    color:"#fff",fontSize:14,fontWeight:600,
    boxShadow:"0 8px 32px rgba(0,0,0,0.25)",
    animation:"slideDown 0.3s ease",
  }}>
    <i className={`ti ${ok?"ti-circle-check":"ti-alert-circle"}`} style={{fontSize:20,flexShrink:0}} aria-hidden/>
    {toast.msg}
  </div>;
}

function Modal({title,onClose,children,full}) {
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",alignItems:full?"stretch":"flex-end",justifyContent:"center",backdropFilter:"blur(2px)"}}>
    <div style={{background:"var(--bg1)",borderRadius:full?"0":"24px 24px 0 0",width:"100%",maxWidth:480,maxHeight:"90vh",overflow:"auto",padding:"0 0 env(safe-area-inset-bottom,16px)"}}>
      <div style={{...s.rowB,padding:"20px 20px 0",marginBottom:4}}>
        <div style={{...s.h3}}>{title}</div>
        <button onClick={onClose} style={{background:"var(--bg2)",border:"none",borderRadius:8,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--c-sec)"}}>
          <i className="ti ti-x" style={{fontSize:18}} aria-hidden/>
        </button>
      </div>
      <div style={{padding:"16px 20px 20px"}}>{children}</div>
    </div>
  </div>;
}

function ConfirmModal({title,msg,onConfirm,onCancel,variant="danger"}) {
  const map={danger:["var(--c-dan)","ti-trash"],warning:["var(--c-war)","ti-alert-triangle"]};
  const [col,icon]=map[variant]||map.danger;
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:24,backdropFilter:"blur(3px)"}}>
    <div style={{background:"var(--bg1)",borderRadius:20,padding:"28px 24px",width:"100%",maxWidth:340,textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
      <div style={{width:64,height:64,borderRadius:20,background:"var(--bg-dan)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
        <i className={`ti ${icon}`} style={{fontSize:30,color:col}} aria-hidden/>
      </div>
      <div style={{...s.h3,marginBottom:8}}>{title}</div>
      <div style={{fontSize:14,color:"var(--c-sec)",marginBottom:24,lineHeight:1.5}}>{msg}</div>
      <div style={{display:"flex",gap:10}}>
        <Btn onClick={onCancel} full>Cancelar</Btn>
        <Btn onClick={onConfirm} v={variant==="danger"?"danger":"warning"} full>Confirmar</Btn>
      </div>
    </div>
  </div>;
}

function Field({label,error,hint,children}) {
  return <div style={{...s.col,gap:6}}>
    <label style={{fontSize:13,fontWeight:600,color:"var(--c-sec)"}}>{label}</label>
    {children}
    {hint&&!error&&<span style={{fontSize:12,color:"var(--c-ter)"}}>{hint}</span>}
    {error&&<span style={{fontSize:12,color:"var(--c-dan)",display:"flex",alignItems:"center",gap:4}}>
      <i className="ti ti-alert-circle" style={{fontSize:12}} aria-hidden/>{error}
    </span>}
  </div>;
}

function BackHeader({title,sub,onBack,action}) {
  return <div style={{...s.rowB,padding:"16px 20px",borderBottom:"0.5px solid var(--brd3)"}}>
    <div style={{...s.row,gap:12}}>
      <button onClick={onBack} style={{width:36,height:36,borderRadius:10,background:"var(--bg2)",border:"none",cursor:"pointer",color:"var(--c-pri)",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <i className="ti ti-arrow-left" style={{fontSize:20}} aria-hidden/>
      </button>
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
    {title&&<div style={{fontSize:16,fontWeight:600,color:"var(--c-sec)",marginBottom:6}}>{title}</div>}
    <div style={{fontSize:14,marginBottom:action?20:0,lineHeight:1.5}}>{text}</div>
    {action}
  </div>;
}

// ─── MINI CHART ─────────────────────────────────────────────────
function SparkBar({data,color="var(--brand)",height=44}) {
  if(!data?.length) return null;
  const max=Math.max(...data,1);
  return <div style={{display:"flex",alignItems:"flex-end",gap:3,height}}>
    {data.map((v,i)=><div key={i} style={{flex:1,height:Math.max(3,(v/max)*height),background:color,borderRadius:3,opacity:i===data.length-1?1:0.45}}/>)}
  </div>;
}

// ─── PRODUCT FORM ────────────────────────────────────────────────
function ProductForm({product,onSave,onDelete,onBack}) {
  const isEdit=!!product?.id;
  const [f,setF]=useState(product||{name:"",sku:"",buyPrice:"",sellPrice:"",stock:"0",notes:"",minStock:"2",category:"HD"});
  const [err,setErr]=useState({});
  const [confirm,setConfirm]=useState(false);
  const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const margin=f.sellPrice&&f.buyPrice?+f.sellPrice-+f.buyPrice:null;
  const mPct=margin!==null&&+f.sellPrice>0?((margin/+f.sellPrice)*100).toFixed(1):null;
  const validate=()=>{const e={};if(!f.name)e.name="Requerido";if(!+f.buyPrice)e.buyPrice="Requerido";if(!+f.sellPrice)e.sellPrice="Requerido";setErr(e);return!Object.keys(e).length;};

  return <div>
    {confirm&&<ConfirmModal title="¿Eliminar producto?" msg={`Se eliminará "${f.name}" junto con todo su historial de movimientos.`} onConfirm={()=>onDelete(f.id)} onCancel={()=>setConfirm(false)}/>}
    <BackHeader title={isEdit?"Editar producto":"Nuevo producto"} sub={isEdit?f.sku||"Sin SKU":null} onBack={onBack}
      action={<Btn onClick={()=>{if(validate())onSave(f);}} v="brand" sm icon="ti-check">Guardar</Btn>}/>
    <div style={{padding:"20px",display:"flex",flexDirection:"column",gap:16}}>

      {/* Category pills */}
      <Field label="Categoría">
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {CATEGORIES.filter(c=>c!=="Todos").map(c=>(
            <button key={c} onClick={()=>setF(p=>({...p,category:c}))} style={{padding:"6px 14px",borderRadius:99,fontSize:13,fontWeight:500,border:"1px solid",cursor:"pointer",fontFamily:"inherit",
              borderColor:f.category===c?"var(--brand)":"var(--brd2)",background:f.category===c?"var(--brand)":"transparent",color:f.category===c?"#fff":"var(--c-sec)"}}>
              {c}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Nombre del producto *" error={err.name}>
        <input value={f.name} onChange={set("name")} placeholder="Fire TV Stick 4K Max" style={{width:"100%",borderColor:err.name?"var(--c-dan)":""}}/>
      </Field>
      <Field label="SKU / Código">
        <input value={f.sku} onChange={set("sku")} placeholder="FTV-4KM" style={{width:"100%"}}/>
      </Field>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Field label="Precio compra (C$) *" error={err.buyPrice}>
          <input type="number" min="0" value={f.buyPrice} onChange={set("buyPrice")} placeholder="0" style={{width:"100%",borderColor:err.buyPrice?"var(--c-dan)":""}}/>
        </Field>
        <Field label="Precio venta (C$) *" error={err.sellPrice}>
          <input type="number" min="0" value={f.sellPrice} onChange={set("sellPrice")} placeholder="0" style={{width:"100%",borderColor:err.sellPrice?"var(--c-dan)":""}}/>
        </Field>
      </div>

      {margin!==null&&<div style={{background:"var(--brand-faint)",borderRadius:12,padding:"12px 16px",...s.rowB}}>
        <span style={{fontSize:13,color:"var(--brand)",fontWeight:500}}>Ganancia por unidad</span>
        <div style={{textAlign:"right"}}>
          <span style={{fontWeight:700,color:margin>=0?"var(--c-suc)":"var(--c-dan)",fontSize:16}}>{C$S(margin)}</span>
          <span style={{fontSize:12,color:"var(--c-sec)",marginLeft:6}}>({mPct}%)</span>
        </div>
      </div>}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Field label="Stock actual">
          <input type="number" min="0" value={f.stock} onChange={set("stock")} style={{width:"100%"}}/>
        </Field>
        <Field label="Alerta mínima">
          <input type="number" min="0" value={f.minStock} onChange={set("minStock")} placeholder="2" style={{width:"100%"}}/>
        </Field>
      </div>
      <Field label="Notas / Descripción">
        <textarea value={f.notes} onChange={set("notes")} rows={3} placeholder="Características, variante, generación…" style={{width:"100%",resize:"vertical",fontFamily:"inherit"}}/>
      </Field>

      {isEdit&&<>
        <Divider my={4}/>
        <Btn onClick={()=>setConfirm(true)} v="danger" full lg icon="ti-trash">Eliminar producto</Btn>
      </>}
    </div>
  </div>;
}

// ─── SALE FORM ───────────────────────────────────────────────────
function SaleForm({products,clients,initPid,onSave,onBack}) {
  const def=products.find(p=>p.id===initPid)||products.find(p=>p.stock>0)||products[0];
  const [f,setF]=useState({productId:def?.id||"",qty:"1",unitPrice:def?.sellPrice||"",discount:"0",date:now(),notes:"",clientId:""});
  const [err,setErr]=useState({});
  const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const chProd=e=>{const p=products.find(x=>x.id===+e.target.value);setF(pv=>({...pv,productId:e.target.value,unitPrice:p?.sellPrice||""}));};
  const prod=products.find(p=>p.id===+f.productId);
  const disc=Math.min(+(f.discount)||0,100);
  const finalPrice=(+f.unitPrice||0)*(1-disc/100);
  const total=finalPrice*(+f.qty||0);
  const gain=prod?(finalPrice-prod.buyPrice)*(+f.qty||0):null;
  const validate=()=>{const e={};if(!f.productId)e.productId="Selecciona producto";if(!+f.qty||+f.qty<1)e.qty="Cantidad inválida";if(!+f.unitPrice)e.unitPrice="Precio requerido";if(prod&&+f.qty>prod.stock)e.qty=`Solo hay ${prod.stock} u.`;setErr(e);return!Object.keys(e).length;};

  return <div>
    <BackHeader title="Nueva venta" onBack={onBack}
      action={<Btn onClick={()=>{if(validate())onSave({...f,discount:disc});}} v="success" sm icon="ti-check">Registrar</Btn>}/>
    <div style={{padding:"20px",display:"flex",flexDirection:"column",gap:14}}>
      <Field label="Producto *" error={err.productId}>
        <select value={f.productId} onChange={chProd} style={{width:"100%",fontFamily:"inherit",borderColor:err.productId?"var(--c-dan)":""}}>
          <option value="">— Seleccionar —</option>
          {products.map(p=><option key={p.id} value={p.id} disabled={p.stock===0}>{p.name} {p.stock===0?"(sin stock)":`· C$ ${p.sellPrice.toLocaleString()} · ${p.stock} u.`}</option>)}
        </select>
      </Field>
      {prod&&<div style={{background:"var(--bg2)",borderRadius:12,padding:"12px 16px",display:"flex",flexWrap:"wrap",gap:"6px 24px"}}>
        <span style={{fontSize:13,color:"var(--c-sec)"}}>Sugerido: <strong style={{color:"var(--c-suc)"}}>{C$S(prod.sellPrice)}</strong></span>
        <span style={{fontSize:13,color:"var(--c-sec)"}}>Stock: <strong>{prod.stock} u.</strong></span>
        <span style={{fontSize:13,color:"var(--c-sec)"}}>Comprado en: <strong style={{color:"var(--c-dan)"}}>{C$S(prod.buyPrice)}</strong></span>
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Field label="Cantidad" error={err.qty}>
          <input type="number" min="1" value={f.qty} onChange={set("qty")} style={{width:"100%",borderColor:err.qty?"var(--c-dan)":""}}/>
        </Field>
        <Field label="Precio venta (C$)" error={err.unitPrice}>
          <input type="number" min="0" value={f.unitPrice} onChange={set("unitPrice")} style={{width:"100%",borderColor:err.unitPrice?"var(--c-dan)":""}}/>
        </Field>
      </div>
      <Field label={`Descuento % ${disc>0?`→ Precio final: ${C$S(finalPrice)}/u`:""}`}>
        <input type="number" min="0" max="100" value={f.discount} onChange={set("discount")} style={{width:"100%"}}/>
      </Field>
      <Field label="Cliente (opcional)">
        <select value={f.clientId} onChange={set("clientId")} style={{width:"100%",fontFamily:"inherit"}}>
          <option value="">— Sin cliente —</option>
          {clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Field label="Fecha"><input type="date" value={f.date} onChange={set("date")} style={{width:"100%"}}/></Field>
        <Field label="Notas"><input value={f.notes} onChange={set("notes")} placeholder="Observaciones" style={{width:"100%"}}/></Field>
      </div>
      {total>0&&<div style={{background:"linear-gradient(135deg,#2e7d32,#43a047)",borderRadius:16,padding:"16px 20px",boxShadow:"0 4px 16px rgba(46,125,50,0.3)"}}>
        <div style={{...s.rowB}}>
          <span style={{fontSize:14,color:"rgba(255,255,255,0.8)"}}>Total de venta</span>
          <span style={{fontSize:32,fontWeight:700,color:"#fff"}}>{C$S(total)}</span>
        </div>
        {gain!==null&&<Divider my={10}/>}
        {gain!==null&&<div style={{...s.rowB}}>
          <span style={{fontSize:13,color:"rgba(255,255,255,0.75)"}}>Ganancia estimada</span>
          <span style={{fontSize:16,fontWeight:700,color:gain>=0?"#fff":"#ffcdd2"}}>{C$S(gain)}</span>
        </div>}
      </div>}
    </div>
  </div>;
}

// ─── PURCHASE FORM ───────────────────────────────────────────────
function PurchaseForm({products,initPid,onSave,onBack}) {
  const def=products.find(p=>p.id===initPid)||products[0];
  const [f,setF]=useState({productId:def?.id||"",qty:"1",unitPrice:def?.buyPrice||"",date:now(),notes:""});
  const [err,setErr]=useState({});
  const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const chProd=e=>{const p=products.find(x=>x.id===+e.target.value);setF(pv=>({...pv,productId:e.target.value,unitPrice:p?.buyPrice||""}));};
  const prod=products.find(p=>p.id===+f.productId);
  const total=(+f.unitPrice||0)*(+f.qty||0);
  const validate=()=>{const e={};if(!f.productId)e.productId="Selecciona producto";if(!+f.qty)e.qty="Requerido";if(!+f.unitPrice)e.unitPrice="Requerido";setErr(e);return!Object.keys(e).length;};

  return <div>
    <BackHeader title="Nueva compra" onBack={onBack}
      action={<Btn onClick={()=>{if(validate())onSave(f);}} v="warning" sm icon="ti-check">Registrar</Btn>}/>
    <div style={{padding:"20px",display:"flex",flexDirection:"column",gap:14}}>
      <Field label="Producto *" error={err.productId}>
        <select value={f.productId} onChange={chProd} style={{width:"100%",fontFamily:"inherit",borderColor:err.productId?"var(--c-dan)":""}}>
          <option value="">— Seleccionar —</option>
          {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>
      {prod&&<div style={{background:"var(--bg2)",borderRadius:12,padding:"12px 16px"}}>
        <span style={{fontSize:13,color:"var(--c-sec)"}}>Precio habitual: <strong style={{color:"var(--c-war)"}}>{C$S(prod.buyPrice)}</strong></span>
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
        <Field label="Proveedor / Notas"><input value={f.notes} onChange={set("notes")} placeholder="Amazon US…" style={{width:"100%"}}/></Field>
      </div>
      {total>0&&<div style={{background:"linear-gradient(135deg,#e65100,#ef6c00)",borderRadius:16,padding:"16px 20px",boxShadow:"0 4px 16px rgba(230,81,0,0.3)"}}>
        <div style={{...s.rowB}}>
          <span style={{fontSize:14,color:"rgba(255,255,255,0.8)"}}>Total a invertir</span>
          <span style={{fontSize:32,fontWeight:700,color:"#fff"}}>{C$S(total)}</span>
        </div>
      </div>}
    </div>
  </div>;
}

// ─── PRODUCT DETAIL ──────────────────────────────────────────────
function ProductDetail({product,txs,clients,onEdit,onSale,onPurchase,onBack}) {
  const myTxs=[...txs].filter(t=>t.productId===product.id).sort((a,b)=>b.date.localeCompare(a.date));
  const sales=myTxs.filter(t=>t.type==="sale");
  const soldQty=sales.reduce((s,t)=>s+t.qty,0);
  const revenue=sales.reduce((s,t)=>s+t.total,0);
  const profit=revenue-soldQty*product.buyPrice;
  const margin=product.sellPrice-product.buyPrice;
  const mPct=product.sellPrice>0?((margin/product.sellPrice)*100).toFixed(1):0;

  // last 6 months sales
  const now2=new Date();
  const spark=Array.from({length:6},(_,i)=>{
    const d=new Date(now2);d.setMonth(d.getMonth()-5+i);
    const m=d.getMonth(),y=d.getFullYear();
    return myTxs.filter(t=>t.type==="sale"&&new Date(t.date+"T12:00").getMonth()===m&&new Date(t.date+"T12:00").getFullYear()===y).reduce((s,t)=>s+t.qty,0);
  });

  return <div>
    <BackHeader title={product.name} sub={`${product.sku||"Sin SKU"} · ${product.category||""}`} onBack={onBack}
      action={<Btn onClick={onEdit} sm icon="ti-edit">Editar</Btn>}/>

    {/* Hero */}
    <div style={{background:"linear-gradient(135deg,#1a1a1a,#333)",padding:"24px 20px 20px"}}>
      <div style={{...s.rowB,marginBottom:20}}>
        <div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Stock actual</div>
          <div style={{fontSize:60,fontWeight:700,lineHeight:1,color:product.stock>0?"#69f0ae":"#ff5252"}}>{product.stock}</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.5)",marginTop:4}}>unidades disponibles</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Valor inventario</div>
          <div style={{fontSize:22,fontWeight:700,color:"#ffb74d"}}>{C$S(product.buyPrice*product.stock)}</div>
          <SparkBar data={spark} color="#ff6b2b" height={40}/>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:4}}>Ult. 6 meses</div>
        </div>
      </div>
      <ProgressBar val={product.stock} max={Math.max(product.stock+soldQty,10)} color="#ff6b2b" h={5}/>
      <div style={{...s.rowB,marginTop:4,fontSize:11,color:"rgba(255,255,255,0.4)"}}>
        <span>0</span><span>Alerta: {product.minStock||2}</span><span>{Math.max(product.stock+soldQty,10)}</span>
      </div>
    </div>

    <div style={{padding:"16px 20px"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        {[["Comprado en",C$(product.buyPrice),"dan"],["Precio venta",C$(product.sellPrice),"suc"],
          ["Margen/unidad",`${C$S(margin)} (${mPct}%)`,"war"],["Ganancia total",C$S(profit),"suc"],
          ["Unid. vendidas",`${soldQty} u.`,"inf"],["Ingresos",C$S(revenue),"inf"],
        ].map(([l,v,c])=><div key={l} style={{background:"var(--bg2)",borderRadius:12,padding:"12px 14px"}}>
          <div style={{...s.label,marginBottom:4}}>{l}</div>
          <div style={{fontSize:15,fontWeight:700,color:`var(--c-${c})`}}>{v}</div>
        </div>)}
      </div>
      {product.notes&&<div style={{background:"var(--bg2)",borderRadius:12,padding:"12px 16px",marginBottom:14}}>
        <div style={{...s.label,marginBottom:4}}>Notas</div>
        <div style={{fontSize:14,color:"var(--c-pri)",lineHeight:1.5}}>{product.notes}</div>
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
        <Btn onClick={onSale}     v="success" full lg icon="ti-receipt">Vender</Btn>
        <Btn onClick={onPurchase} v="warning" full lg icon="ti-package">Restock</Btn>
      </div>
      <Section title={`Historial · ${myTxs.length} movimientos`}>
        {myTxs.length===0&&<Empty icon="ti-list" text="Sin movimientos registrados"/>}
        {myTxs.map(t=>{
          const cli=clients.find(c=>c.id===+t.clientId);
          return <Card key={t.id} sx={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{...s.row,gap:12}}>
              <div style={{width:40,height:40,borderRadius:12,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",
                background:t.type==="sale"?"var(--bg-suc)":"var(--bg-war)"}}>
                <i className={`ti ${t.type==="sale"?"ti-trending-up":"ti-trending-down"}`}
                  style={{fontSize:20,color:t.type==="sale"?"var(--c-suc)":"var(--c-war)"}} aria-hidden/>
              </div>
              <div>
                <div style={{fontSize:14,fontWeight:600,color:"var(--c-pri)"}}>{t.type==="sale"?"Venta":"Compra"} · {t.qty} u.</div>
                <div style={{fontSize:12,color:"var(--c-sec)"}}>{fmtS(t.date)}{cli?` · ${cli.name}`:t.notes?` · ${t.notes}`:""}{t.discount>0?` · Desc ${t.discount}%`:""}</div>
              </div>
            </div>
            <div style={{textAlign:"right",flexShrink:0,marginLeft:8}}>
              <div style={{fontWeight:700,color:t.type==="sale"?"var(--c-suc)":"var(--c-war)"}}>{C$S(t.total)}</div>
              <div style={{fontSize:12,color:"var(--c-sec)"}}>{C$S(t.unitPrice)}/u</div>
            </div>
          </Card>;
        })}
      </Section>
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
    {confirm&&<ConfirmModal title="¿Eliminar cliente?" msg="Se eliminará este cliente del directorio." onConfirm={()=>onDelete(f.id)} onCancel={()=>setConfirm(false)}/>}
    <BackHeader title={isEdit?"Editar cliente":"Nuevo cliente"} onBack={onBack}
      action={<Btn onClick={()=>onSave(f)} v="brand" sm icon="ti-check">Guardar</Btn>}/>
    <div style={{padding:"20px",display:"flex",flexDirection:"column",gap:14}}>
      <Field label="Nombre completo *"><input value={f.name} onChange={set("name")} placeholder="Juan Pérez" style={{width:"100%"}}/></Field>
      <Field label="Teléfono"><input value={f.phone} onChange={set("phone")} placeholder="8888-0000" style={{width:"100%"}}/></Field>
      <Field label="Notas"><textarea value={f.notes} onChange={set("notes")} rows={3} placeholder="Empresa, preferencias, etc." style={{width:"100%",resize:"vertical",fontFamily:"inherit"}}/></Field>
      {isEdit&&<><Divider/><Btn onClick={()=>setConfirm(true)} v="danger" full icon="ti-trash">Eliminar cliente</Btn></>}
    </div>
  </div>;
}

// ══════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════
export default function App() {
  const [products, setProducts] = usePersist("fc4_products", SEED_PRODUCTS);
  const [txs,      setTxs]      = usePersist("fc4_txs",      SEED_TXS);
  const [clients,  setClients]  = usePersist("fc4_clients",  SEED_CLIENTS);
  const [view,     setView]     = useState({name:"main"});
  const [tab,      setTab]      = useState("home");
  const [toast,    setToastSt]  = useState(null);
  const [search,   setSearch]   = useState("");
  const [catFilter,setCat]      = useState("Todos");
  const [stockFilter,setStockF] = useState("all");
  const [resetConf,setResetConf]= useState(false);
  const [quickOpen,setQuick]    = useState(false);

  const go   = useCallback(v=>{setView(v);setQuick(false);},[]);
  const back = useCallback(()=>setView({name:"main"}),[]);
  const getProd  = id=>products.find(p=>p.id===+id);
  const getClient= id=>clients.find(c=>c.id===+id);

  const showToast = useCallback((msg,type="ok")=>{
    setToastSt({msg,type});
    setTimeout(()=>setToastSt(null),3000);
  },[]);

  const stats = useMemo(()=>{
    const invested=txs.filter(t=>t.type==="purchase").reduce((s,t)=>s+t.total,0);
    const revenue =txs.filter(t=>t.type==="sale").reduce((s,t)=>s+t.total,0);
    const cogs    =txs.filter(t=>t.type==="sale").reduce((s,t)=>{const p=getProd(t.productId);return s+(p?p.buyPrice*t.qty:0);},0);
    const invValue=products.reduce((s,p)=>s+p.buyPrice*p.stock,0);
    const units   =products.reduce((s,p)=>s+p.stock,0);
    return {invested,revenue,profit:revenue-cogs,cogs,invValue,units,saleCnt:txs.filter(t=>t.type==="sale").length};
  },[products,txs]);

  const lowStock=products.filter(p=>p.stock<=(+(p.minStock)||2));

  // Monthly spark (last 6)
  const monthlySales = useMemo(()=>{
    const now2=new Date();
    return Array.from({length:6},(_,i)=>{
      const d=new Date(now2);d.setMonth(d.getMonth()-5+i);
      const m=d.getMonth(),y=d.getFullYear();
      return txs.filter(t=>t.type==="sale"&&new Date(t.date+"T12:00").getMonth()===m&&new Date(t.date+"T12:00").getFullYear()===y).reduce((s,t)=>s+t.total,0);
    });
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
    if(!p){showToast("Selecciona un producto","err");return;}
    if(!+f.qty||+f.qty<=0||!+f.unitPrice){showToast("Completa cantidad y precio","err");return;}
    if(+f.qty>p.stock){showToast(`Solo hay ${p.stock} u. disponibles`,"err");return;}
    const disc=Math.min(+(f.discount)||0,100);
    const finalP=(+f.unitPrice)*(1-disc/100);
    const total=finalP*(+f.qty);
    setTxs(ts=>[{id:uid(),type:"sale",productId:+f.productId,qty:+f.qty,unitPrice:finalP,total,date:f.date,notes:f.notes||"",discount:disc,clientId:+f.clientId||null},...ts]);
    setProducts(ps=>ps.map(x=>x.id===+f.productId?{...x,stock:x.stock-(+f.qty)}:x));
    showToast(`¡Venta de ${C$S(total)} registrada!`);back();
  },[products,showToast,back]);

  const savePurchase=useCallback(f=>{
    if(!+f.qty||!+f.unitPrice){showToast("Completa los campos","err");return;}
    const total=(+f.unitPrice)*(+f.qty);
    setTxs(ts=>[{id:uid(),type:"purchase",productId:+f.productId||null,qty:+f.qty,unitPrice:+f.unitPrice,total,date:f.date,notes:f.notes||"",discount:0},...ts]);
    if(f.productId)setProducts(ps=>ps.map(x=>x.id===+f.productId?{...x,stock:x.stock+(+f.qty)}:x));
    showToast(`Compra de ${C$S(total)} registrada`);back();
  },[showToast,back]);

  const saveClient=useCallback(f=>{
    if(!f.name){showToast("El nombre es requerido","err");return;}
    if(f.id){setClients(cs=>cs.map(x=>x.id===f.id?f:x));showToast("Cliente actualizado ✓");}
    else{setClients(cs=>[...cs,{...f,id:uid()}]);showToast("Cliente agregado ✓");}
    back();
  },[showToast,back]);

  const deleteClient=useCallback(id=>{
    setClients(cs=>cs.filter(c=>c.id!==id));
    showToast("Cliente eliminado");back();
  },[showToast,back]);

  const exportCSV=useCallback(()=>{
    const h1=["Producto","SKU","Categoría","P.Compra","P.Venta","Stock","Valor","Margen"];
    const r1=products.map(p=>[p.name,p.sku||"",p.category||"",p.buyPrice,p.sellPrice,p.stock,(p.buyPrice*p.stock).toFixed(0),(p.sellPrice-p.buyPrice).toFixed(0)]);
    const h2=["Tipo","Producto","Cantidad","P.Unitario","Total","Descuento","Fecha","Cliente","Notas"];
    const r2=[...txs].sort((a,b)=>b.date.localeCompare(a.date)).map(t=>{
      const p=getProd(t.productId);const c=getClient(t.clientId);
      return[t.type==="sale"?"Venta":"Compra",p?.name||"",t.qty,t.unitPrice.toFixed(0),t.total.toFixed(0),t.discount?t.discount+"%":"0%",t.date,c?.name||"",t.notes||""];
    });
    const csv=[h1,...r1,[],[h2],...r2].map(r=>r.join(",")).join("\n");
    const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download=`firecontrol_${now()}.csv`;a.click();
    showToast("Reporte CSV exportado ✓");
  },[products,txs,clients,showToast]);

  // ── ROUTING ──
  if(view.name==="add-product")    return <ProductForm product={null}      onSave={saveProduct}  onDelete={deleteProduct} onBack={back}/>;
  if(view.name==="edit-product")   return <ProductForm product={view.data}  onSave={saveProduct}  onDelete={deleteProduct} onBack={back}/>;
  if(view.name==="product-detail") return <ProductDetail product={view.data} txs={txs} clients={clients}
    onEdit={()=>go({name:"edit-product",data:view.data})}
    onSale={()=>go({name:"add-sale",data:{pid:view.data.id}})}
    onPurchase={()=>go({name:"add-purchase",data:{pid:view.data.id}})}
    onBack={back}/>;
  if(view.name==="add-sale")       return <SaleForm products={products} clients={clients} initPid={view.data?.pid} onSave={saveSale} onBack={back}/>;
  if(view.name==="add-purchase")   return <PurchaseForm products={products} initPid={view.data?.pid} onSave={savePurchase} onBack={back}/>;
  if(view.name==="add-client")     return <ClientForm client={null}      onSave={saveClient} onDelete={deleteClient} onBack={back}/>;
  if(view.name==="edit-client")    return <ClientForm client={view.data}  onSave={saveClient} onDelete={deleteClient} onBack={back}/>;

  // ── MAIN LAYOUT ──
  const TABS=[
    {id:"home",    icon:"ti-home-2",    activeIcon:"ti-home-2",     label:"Inicio"},
    {id:"products",icon:"ti-package",   activeIcon:"ti-package",    label:"Productos"},
    {id:"moves",   icon:"ti-arrows-exchange",activeIcon:"ti-arrows-exchange",label:"Movimientos"},
    {id:"clients", icon:"ti-users",     activeIcon:"ti-users",      label:"Clientes"},
    {id:"reports", icon:"ti-chart-pie", activeIcon:"ti-chart-pie",  label:"Reportes"},
  ];

  const filtProds=products.filter(p=>{
    const ms=!search||p.name.toLowerCase().includes(search.toLowerCase())||(p.sku||"").toLowerCase().includes(search.toLowerCase());
    const mc=catFilter==="Todos"||(p.category||"Otro")===catFilter;
    const mf=stockFilter==="all"||(stockFilter==="in"&&p.stock>(+(p.minStock)||2))||(stockFilter==="low"&&p.stock>0&&p.stock<=(+(p.minStock)||2))||(stockFilter==="out"&&p.stock===0);
    return ms&&mc&&mf;
  });

  const saleTxs=[...txs].filter(t=>t.type==="sale").sort((a,b)=>b.date.localeCompare(a.date));
  const purchTxs=[...txs].filter(t=>t.type==="purchase").sort((a,b)=>b.date.localeCompare(a.date));

  const groupDate=arr=>{const g={};arr.forEach(t=>{if(!g[t.date])g[t.date]=[];g[t.date].push(t);});return Object.entries(g).sort((a,b)=>b[0].localeCompare(a[0]));};

  const TxItem=({t})=>{
    const p=getProd(t.productId);const c=getClient(t.clientId);
    return <Card sx={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{...s.row,gap:12}}>
        <div style={{width:44,height:44,borderRadius:13,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",
          background:t.type==="sale"?"var(--bg-suc)":"var(--bg-war)"}}>
          <i className={`ti ${t.type==="sale"?"ti-trending-up":"ti-trending-down"}`}
            style={{fontSize:22,color:t.type==="sale"?"var(--c-suc)":"var(--c-war)"}} aria-hidden/>
        </div>
        <div style={{minWidth:0}}>
          <div style={{fontSize:14,fontWeight:600,color:"var(--c-pri)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:170}}>
            {p?.name||"—"}
          </div>
          <div style={{fontSize:12,color:"var(--c-sec)"}}>
            {t.qty} u. · {fmtS(t.date)}{c?` · ${c.name}`:t.notes?` · ${t.notes}`:""}
            {t.discount>0?<span style={{marginLeft:4}}><Badge v="info" sm>-{t.discount}%</Badge></span>:null}
          </div>
        </div>
      </div>
      <div style={{fontWeight:700,color:t.type==="sale"?"var(--c-suc)":"var(--c-war)",marginLeft:8,flexShrink:0,fontSize:15}}>
        {C$S(t.total)}
      </div>
    </Card>;
  };

  return <div>
    {resetConf&&<ConfirmModal title="¿Restablecer todo?" msg="Se perderán todos tus datos y se cargarán los datos de ejemplo. No se puede deshacer." variant="warning" onConfirm={()=>{setProducts(SEED_PRODUCTS);setTxs(SEED_TXS);setClients(SEED_CLIENTS);setResetConf(false);showToast("Datos restablecidos");}} onCancel={()=>setResetConf(false)}/>}

    <style>{`
      @keyframes slideDown { from{opacity:0;transform:translate(-50%,-16px)} to{opacity:1;transform:translate(-50%,0)} }
      @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
    `}</style>

    <Toast toast={toast}/>

    {/* ═══ HEADER ═══ */}
    <div style={{background:"linear-gradient(135deg,#1a1a1a 0%,#2d1a00 100%)",padding:"16px 20px 0",paddingTop:"calc(16px + env(safe-area-inset-top,0px))"}}>
      <div style={{...s.rowB,marginBottom:16}}>
        <div style={{...s.row,gap:12}}>
          <div style={{width:40,height:40,borderRadius:12,background:"var(--brand)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 12px rgba(255,107,43,0.4)"}}>
            <i className="ti ti-flame" style={{fontSize:24,color:"#fff"}} aria-hidden/>
          </div>
          <div>
            <div style={{fontSize:18,fontWeight:800,color:"#fff",letterSpacing:"-0.3px"}}>FireControl</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.45)"}}>Inventario Fire TV · Nicaragua</div>
          </div>
        </div>
        <div style={{...s.row,gap:8}}>
          <button onClick={exportCSV} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff"}}>
            <i className="ti ti-download" style={{fontSize:18}} aria-hidden/>
          </button>
          <button onClick={()=>setQuick(q=>!q)} style={{background:"var(--brand)",border:"none",borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff",boxShadow:"0 4px 12px rgba(255,107,43,0.4)"}}>
            <i className={`ti ${quickOpen?"ti-x":"ti-plus"}`} style={{fontSize:20}} aria-hidden/>
          </button>
        </div>
      </div>

      {/* Quick actions drawer */}
      {quickOpen&&<div style={{background:"rgba(255,255,255,0.06)",borderRadius:16,padding:14,marginBottom:16,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {[["Nueva venta","ti-receipt","success"],["Nueva compra","ti-package","warning"],["Nuevo producto","ti-plus","info"],["Nuevo cliente","ti-user-plus","brand"]].map(([l,ic,vc])=>(
          <button key={l} onClick={()=>{
            if(l==="Nueva venta")     go({name:"add-sale"});
            else if(l==="Nueva compra")   go({name:"add-purchase"});
            else if(l==="Nuevo producto") go({name:"add-product"});
            else if(l==="Nuevo cliente")  go({name:"add-client"});
          }} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:12,background:"rgba(255,255,255,0.08)",border:"none",cursor:"pointer",color:"#fff",fontSize:13,fontWeight:500,fontFamily:"inherit"}}>
            <i className={`ti ${ic}`} style={{fontSize:18}} aria-hidden/>{l}
          </button>
        ))}
      </div>}

      {/* Tab bar */}
      <div style={{display:"flex",gap:0,overflowX:"auto",scrollbarWidth:"none",margin:"0 -20px",padding:"0 16px"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>{setTab(t.id);setQuick(false);}} style={{
            flex:"0 0 auto",background:"none",border:"none",borderBottom:tab===t.id?"2px solid var(--brand)":"2px solid transparent",
            padding:"10px 14px 12px",cursor:"pointer",color:tab===t.id?"var(--brand)":"rgba(255,255,255,0.4)",
            fontSize:11,display:"flex",flexDirection:"column",alignItems:"center",gap:3,
            fontWeight:tab===t.id?700:400,fontFamily:"inherit",minWidth:60,transition:"color 0.15s"}}>
            <i className={`ti ${t.icon}`} style={{fontSize:20}} aria-hidden/>
            {t.label}
          </button>
        ))}
      </div>
    </div>

    {/* ─── CONTENT ─── */}
    <div style={{padding:20,paddingBottom:24}}>

      {/* ════ HOME ════ */}
      {tab==="home"&&<>
        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
          <StatCard label="Ganancia" value={C$S(stats.profit)} sub="Total acumulada" icon="ti-trending-up" color="brand"/>
          <StatCard label="Ventas" value={C$S(stats.revenue)} sub={`${stats.saleCnt} transacciones`} icon="ti-cash" color="success"/>
          <StatCard label="Invertido" value={C$S(stats.invested)} sub="En compras" icon="ti-coin" color="warning"/>
          <StatCard label="Inventario" value={C$S(stats.invValue)} sub={`${stats.units} u.`} icon="ti-box" color="neutral"/>
        </div>

        {/* Sales trend */}
        <Card shadow sx={{marginBottom:20}}>
          <div style={{...s.rowB,marginBottom:16}}>
            <div>
              <div style={{...s.label,marginBottom:2}}>Ventas — últimos 6 meses</div>
              <div style={{fontSize:20,fontWeight:700,color:"var(--c-pri)"}}>{C$S(monthlySales[5]||0)}</div>
              <div style={{fontSize:12,color:"var(--c-sec)"}}>este mes</div>
            </div>
            <SparkBar data={monthlySales} color="var(--brand)" height={52}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            {(() => {
              const now2=new Date();
              return Array.from({length:6},(_,i)=>{const d=new Date(now2);d.setMonth(d.getMonth()-5+i);return MONTHS[d.getMonth()];});
            })().map((m,i)=>(
              <span key={i} style={{fontSize:10,color:"var(--c-ter)",fontWeight:i===5?700:400}}>{m}</span>
            ))}
          </div>
        </Card>

        {/* Low stock alert */}
        {lowStock.length>0&&<Card sx={{borderColor:"var(--c-dan)",marginBottom:20}}>
          <div style={{...s.row,gap:8,marginBottom:12}}>
            <div style={{width:32,height:32,borderRadius:10,background:"var(--bg-dan)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <i className="ti ti-alert-triangle" style={{fontSize:18,color:"var(--c-dan)"}} aria-hidden/>
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:"var(--c-dan)"}}>Stock bajo</div>
              <div style={{fontSize:12,color:"var(--c-sec)"}}>{lowStock.length} producto{lowStock.length>1?"s":""} requieren atención</div>
            </div>
          </div>
          {lowStock.map(p=>(
            <div key={p.id} style={{...s.rowB,padding:"10px 0",borderTop:"0.5px solid var(--brd3)"}}>
              <div onClick={()=>go({name:"product-detail",data:p})} style={{cursor:"pointer",flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:500,color:"var(--c-pri)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                <StockBadge stock={p.stock} min={+(p.minStock)||2}/>
              </div>
              <Btn onClick={()=>go({name:"add-purchase",data:{pid:p.id}})} v="war-faint" sm sx={{marginLeft:8}} icon="ti-package">Restock</Btn>
            </div>
          ))}
        </Card>}

        {/* Top productos */}
        {saleTxs.length>0&&(()=>{
          const by={};
          saleTxs.forEach(t=>{const p=getProd(t.productId);if(p){if(!by[p.id])by[p.id]={name:p.name,rev:0,qty:0};by[p.id].rev+=t.total;by[p.id].qty+=t.qty;}});
          const sorted=Object.values(by).sort((a,b)=>b.rev-a.rev).slice(0,4);
          const maxR=Math.max(...sorted.map(x=>x.rev),1);
          return <Card shadow sx={{marginBottom:20}}>
            <Section title="🏆 Top productos">
              {sorted.map((p,i)=>(
                <div key={p.name} style={{marginBottom:14}}>
                  <div style={{...s.rowB,marginBottom:5}}>
                    <div style={{...s.row,gap:8}}>
                      <div style={{width:22,height:22,borderRadius:6,background:i===0?"#FFD700":i===1?"#C0C0C0":i===2?"#CD7F32":"var(--bg2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:i<3?"#fff":"var(--c-ter)"}}>{i+1}</div>
                      <span style={{fontSize:13,fontWeight:600,color:"var(--c-pri)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:160}}>{p.name}</span>
                    </div>
                    <span style={{fontSize:13,fontWeight:700,color:"var(--brand)",flexShrink:0}}>{C$S(p.rev)}</span>
                  </div>
                  <ProgressBar val={p.rev} max={maxR} color={i===0?"var(--brand)":"var(--c-inf)"}/>
                  <div style={{fontSize:11,color:"var(--c-ter)",marginTop:3}}>{p.qty} unidades vendidas</div>
                </div>
              ))}
            </Section>
          </Card>;
        })()}

        {/* Recent activity */}
        <Section title="Actividad reciente" action={<button onClick={()=>setTab("moves")} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:"var(--brand)",fontFamily:"inherit",fontWeight:600}}>Ver todo →</button>}>
          {txs.length===0&&<Empty icon="ti-clock" text="Sin actividad aún"/>}
          {[...txs].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5).map(t=><TxItem key={t.id} t={t}/>)}
        </Section>
      </>}

      {/* ════ PRODUCTS ════ */}
      {tab==="products"&&<>
        <div style={{...s.row,gap:8,marginBottom:14}}>
          <div style={{flex:1,position:"relative"}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar nombre o SKU…" style={{width:"100%",paddingLeft:36}}/>
            <i className="ti ti-search" style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:"var(--c-ter)",fontSize:16,pointerEvents:"none"}} aria-hidden/>
            {search&&<button onClick={()=>setSearch("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--c-ter)",fontSize:16,display:"flex"}}>
              <i className="ti ti-x" aria-hidden/>
            </button>}
          </div>
          <Btn onClick={()=>go({name:"add-product"})} v="brand" sm icon="ti-plus">Nuevo</Btn>
        </div>

        {/* Category filter */}
        <div style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none",marginBottom:10,paddingBottom:4}}>
          {CATEGORIES.map(c=>(
            <Chip key={c} label={c} active={catFilter===c} onClick={()=>setCat(c)}
              count={c==="Todos"?products.length:products.filter(p=>(p.category||"Otro")===c).length}/>
          ))}
        </div>

        {/* Stock filter */}
        <div style={{display:"flex",gap:6,marginBottom:14}}>
          {[["all","Todos"],["in","En stock"],["low","Bajo"],["out","Sin stock"]].map(([v,l])=>(
            <button key={v} onClick={()=>setStockF(v)} style={{padding:"5px 12px",borderRadius:99,fontSize:12,fontWeight:600,border:"1px solid",cursor:"pointer",fontFamily:"inherit",
              borderColor:stockFilter===v?"var(--c-pri)":"var(--brd2)",background:stockFilter===v?"var(--c-pri)":"transparent",color:stockFilter===v?"var(--bg1)":"var(--c-sec)"}}>
              {l}
            </button>
          ))}
          <span style={{fontSize:12,color:"var(--c-ter)",alignSelf:"center",marginLeft:"auto"}}>{filtProds.length} productos</span>
        </div>

        {filtProds.length===0&&<Empty icon="ti-box-off" title="Sin resultados" text={products.length===0?"Agrega tu primer producto para comenzar":"Prueba con otro filtro o búsqueda"}
          action={products.length===0&&<Btn onClick={()=>go({name:"add-product"})} v="brand" icon="ti-plus">Agregar producto</Btn>}/>}

        {filtProds.map(p=>(
          <Card key={p.id} onClick={()=>go({name:"product-detail",data:p})} shadow>
            <div style={{...s.rowB,marginBottom:8}}>
              <div style={{...s.row,gap:12,flex:1,minWidth:0}}>
                <div style={{width:46,height:46,borderRadius:13,background:"var(--brand-faint)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <i className="ti ti-device-tv" style={{fontSize:24,color:"var(--brand)"}} aria-hidden/>
                </div>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:15,fontWeight:700,color:"var(--c-pri)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                  <div style={{...s.row,gap:6,marginTop:2}}>
                    {p.sku&&<span style={{fontSize:11,color:"var(--c-ter)"}}>{p.sku}</span>}
                    {p.category&&<Badge v="brand" sm>{p.category}</Badge>}
                  </div>
                </div>
              </div>
              <StockBadge stock={p.stock} min={+(p.minStock)||2}/>
            </div>
            <ProgressBar val={p.stock} max={Math.max(p.stock+3,10)} color={p.stock===0?"var(--c-dan)":p.stock<=(+(p.minStock)||2)?"var(--c-war)":"var(--c-suc)"}/>
            <div style={{...s.rowB,marginTop:10}}>
              <div style={{display:"flex",gap:14,fontSize:13}}>
                <span style={{color:"var(--c-sec)"}}>Compra: <strong style={{color:"var(--c-dan)"}}>{C$S(p.buyPrice)}</strong></span>
                <span style={{color:"var(--c-sec)"}}>Venta: <strong style={{color:"var(--c-suc)"}}>{C$S(p.sellPrice)}</strong></span>
              </div>
              <div style={{display:"flex",gap:6}} onClick={e=>e.stopPropagation()}>
                <button onClick={()=>go({name:"add-sale",data:{pid:p.id}})} style={{width:30,height:30,borderRadius:8,background:"var(--bg-suc)",border:"none",cursor:"pointer",color:"var(--c-suc)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <i className="ti ti-receipt" style={{fontSize:16}} aria-hidden/>
                </button>
                <button onClick={()=>go({name:"add-purchase",data:{pid:p.id}})} style={{width:30,height:30,borderRadius:8,background:"var(--bg-war)",border:"none",cursor:"pointer",color:"var(--c-war)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <i className="ti ti-package" style={{fontSize:16}} aria-hidden/>
                </button>
                <button onClick={()=>go({name:"edit-product",data:p})} style={{width:30,height:30,borderRadius:8,background:"var(--bg2)",border:"none",cursor:"pointer",color:"var(--c-sec)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <i className="ti ti-edit" style={{fontSize:16}} aria-hidden/>
                </button>
              </div>
            </div>
          </Card>
        ))}
      </>}

      {/* ════ MOVES ════ */}
      {tab==="moves"&&(()=>{
        const [mvTab,setMvTab]=useState("sales");
        const txList=mvTab==="sales"?saleTxs:purchTxs;
        const total=txList.reduce((s,t)=>s+t.total,0);
        const qty=txList.reduce((s,t)=>s+t.qty,0);
        return <>
          <div style={{...s.rowB,marginBottom:16}}>
            <div>
              <div style={{...s.label,marginBottom:2}}>{mvTab==="sales"?"Ventas totales":"Total invertido"}</div>
              <div style={{fontSize:26,fontWeight:700,color:mvTab==="sales"?"var(--c-suc)":"var(--c-war)"}}>{C$S(total)}</div>
              <div style={{fontSize:12,color:"var(--c-sec)"}}>{txList.length} transacciones · {qty} unidades</div>
            </div>
            <Btn onClick={()=>go({name:mvTab==="sales"?"add-sale":"add-purchase"})} v={mvTab==="sales"?"success":"warning"} icon="ti-plus">Nueva</Btn>
          </div>

          <div style={{display:"flex",background:"var(--bg2)",borderRadius:12,padding:4,marginBottom:16}}>
            {[["sales","Ventas"],["purchases","Compras"]].map(([v,l])=>(
              <button key={v} onClick={()=>setMvTab(v)} style={{flex:1,padding:"8px",borderRadius:9,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:600,transition:"all 0.15s",
                background:mvTab===v?"var(--bg1)":"transparent",color:mvTab===v?"var(--c-pri)":"var(--c-sec)",
                boxShadow:mvTab===v?"0 2px 8px rgba(0,0,0,0.1)":"none"}}>
                {l}
              </button>
            ))}
          </div>

          {txList.length===0&&<Empty icon={mvTab==="sales"?"ti-receipt-off":"ti-shopping-cart-off"} title="Sin registros" text={`No hay ${mvTab==="sales"?"ventas":"compras"} registradas aún`}/>}

          {groupDate(txList).map(([date,ts])=>(
            <div key={date} style={{marginBottom:8}}>
              <div style={{...s.rowB,marginBottom:8}}>
                <span style={{fontSize:12,fontWeight:600,color:"var(--c-sec)"}}>{fmtD(date)}</span>
                <span style={{fontSize:12,fontWeight:700,color:mvTab==="sales"?"var(--c-suc)":"var(--c-war)"}}>{C$S(ts.reduce((a,t)=>a+t.total,0))}</span>
              </div>
              {ts.map(t=><TxItem key={t.id} t={t}/>)}
            </div>
          ))}
        </>;
      })()}

      {/* ════ CLIENTS ════ */}
      {tab==="clients"&&<>
        <div style={{...s.rowB,marginBottom:16}}>
          <div>
            <div style={{...s.label,marginBottom:2}}>Directorio</div>
            <div style={{fontSize:22,fontWeight:700,color:"var(--c-pri)"}}>{clients.length} clientes</div>
          </div>
          <Btn onClick={()=>go({name:"add-client"})} v="brand" icon="ti-user-plus">Nuevo</Btn>
        </div>

        {clients.length===0&&<Empty icon="ti-users" title="Sin clientes" text="Agrega tus clientes para llevar un registro de tus ventas" action={<Btn onClick={()=>go({name:"add-client"})} v="brand" icon="ti-user-plus">Agregar cliente</Btn>}/>}

        {clients.map(c=>{
          const cTxs=txs.filter(t=>t.type==="sale"&&t.clientId===c.id);
          const cTotal=cTxs.reduce((s,t)=>s+t.total,0);
          return <Card key={c.id} shadow onClick={()=>go({name:"edit-client",data:c})}>
            <div style={{...s.rowB}}>
              <div style={{...s.row,gap:12}}>
                <Avatar name={c.name} size={46}/>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:"var(--c-pri)"}}>{c.name}</div>
                  <div style={{fontSize:12,color:"var(--c-sec)"}}>{c.phone||"Sin teléfono"}</div>
                  {c.notes&&<div style={{fontSize:12,color:"var(--c-ter)",marginTop:1}}>{c.notes}</div>}
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                {cTotal>0&&<div style={{fontSize:14,fontWeight:700,color:"var(--c-suc)"}}>{C$S(cTotal)}</div>}
                {cTxs.length>0&&<div style={{fontSize:11,color:"var(--c-ter)"}}>{cTxs.length} compra{cTxs.length>1?"s":""}</div>}
              </div>
            </div>
          </Card>;
        })}
      </>}

      {/* ════ REPORTS ════ */}
      {tab==="reports"&&(()=>{
        const gPct  =stats.revenue>0?((stats.profit/stats.revenue)*100).toFixed(1):0;
        const roi   =stats.invested>0?((stats.profit/stats.invested)*100).toFixed(1):0;
        const avgTk =stats.saleCnt>0?(stats.revenue/stats.saleCnt):0;

        const byProd={};
        products.forEach(p=>{byProd[p.id]={id:p.id,name:p.name,buyPrice:p.buyPrice,stock:p.stock,soldQty:0,rev:0,profit:0};});
        txs.forEach(t=>{if(t.type==="sale"&&byProd[t.productId]){byProd[t.productId].soldQty+=t.qty;byProd[t.productId].rev+=t.total;byProd[t.productId].profit+=(t.unitPrice-byProd[t.productId].buyPrice)*t.qty;}});
        const ps=Object.values(byProd).sort((a,b)=>b.rev-a.rev);
        const sold=ps.filter(p=>p.soldQty>0);
        const maxP=Math.max(...ps.map(x=>x.profit),1);

        return <>
          {/* P&L */}
          <div style={{background:"linear-gradient(135deg,#1a1a1a,#2d1a00)",borderRadius:20,padding:"20px",marginBottom:16,boxShadow:"0 8px 32px rgba(0,0,0,0.2)"}}>
            <div style={{...s.label,color:"rgba(255,255,255,0.4)",marginBottom:16}}>Estado de resultados</div>
            {[["Ingresos por ventas",C$S(stats.revenue),"#69f0ae"],["Costo de ventas",`- ${C$S(stats.cogs)}`,"#ff5252"]].map(([l,v,c])=>(
              <div key={l} style={{...s.rowB,marginBottom:12}}>
                <span style={{fontSize:14,color:"rgba(255,255,255,0.55)"}}>{l}</span>
                <span style={{fontSize:14,fontWeight:600,color:c}}>{v}</span>
              </div>
            ))}
            <Divider my={4}/>
            <div style={{...s.rowB,marginTop:12}}>
              <span style={{fontSize:15,fontWeight:600,color:"rgba(255,255,255,0.8)"}}>Ganancia bruta</span>
              <span style={{fontSize:28,fontWeight:800,color:stats.profit>=0?"#69f0ae":"#ff5252"}}>{C$S(stats.profit)}</span>
            </div>
          </div>

          {/* KPIs */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            {[
              ["Margen bruto",`${gPct}%`,          "brand"],
              ["ROI",         `${roi}%`,            +roi>=0?"success":"danger"],
              ["Ticket prom.",C$S(avgTk),           "info"],
              ["En inventario",C$S(stats.invValue), "warning"],
            ].map(([l,v,c])=><StatCard key={l} label={l} value={v} icon={c==="brand"?"ti-percentage":c==="success"?"ti-trending-up":c==="info"?"ti-receipt":"ti-box"} color={c}/>)}
          </div>

          {/* By product */}
          <Card shadow sx={{marginBottom:16}}>
            <Section title="Ganancia por producto">
              {sold.length===0&&<div style={{textAlign:"center",padding:"20px 0",color:"var(--c-ter)",fontSize:13}}>Sin ventas registradas aún</div>}
              {sold.map((p,i)=>(
                <div key={p.id} style={{marginBottom:18,cursor:"pointer"}} onClick={()=>go({name:"product-detail",data:products.find(x=>x.id===p.id)})}>
                  <div style={{...s.rowB,marginBottom:5}}>
                    <div style={{...s.row,gap:8}}>
                      <div style={{width:24,height:24,borderRadius:7,background:i===0?"#FFD700":i===1?"#C0C0C0":i===2?"#CD7F32":"var(--bg2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:i<3?"#fff":"var(--c-ter)"}}>{i+1}</div>
                      <span style={{fontSize:13,fontWeight:600,color:"var(--c-pri)",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</span>
                    </div>
                    <span style={{fontSize:14,fontWeight:700,color:p.profit>=0?"var(--c-suc)":"var(--c-dan)",flexShrink:0}}>{C$S(p.profit)}</span>
                  </div>
                  <ProgressBar val={Math.max(0,p.profit)} max={maxP} color={p.profit>=0?"var(--c-suc)":"var(--c-dan)"}/>
                  <div style={{display:"flex",gap:16,fontSize:11,color:"var(--c-ter)",marginTop:3}}>
                    <span>{p.soldQty} vendidas</span>
                    <span>Ingreso: {C$S(p.rev)}</span>
                    <span>Margen: {p.rev>0?((p.profit/p.rev)*100).toFixed(0):0}%</span>
                  </div>
                </div>
              ))}
            </Section>
          </Card>

          {/* Monthly summary */}
          <Card shadow sx={{marginBottom:16}}>
            <Section title="Ventas por mes (últimos 6)">
              {(() => {
                const now2=new Date();
                return Array.from({length:6},(_,i)=>{
                  const d=new Date(now2);d.setMonth(d.getMonth()-5+i);
                  const m=d.getMonth(),y=d.getFullYear();
                  const mTxs=txs.filter(t=>t.type==="sale"&&new Date(t.date+"T12:00").getMonth()===m&&new Date(t.date+"T12:00").getFullYear()===y);
                  const mRev=mTxs.reduce((s,t)=>s+t.total,0);
                  return {label:`${MONTHS[m]} ${y}`,rev:mRev,cnt:mTxs.length};
                });
              })().reverse().map((m,i)=>(
                <div key={i} style={{...s.rowB,padding:"8px 0",borderTop:i>0?"0.5px solid var(--brd3)":"none"}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:500,color:"var(--c-pri)"}}>{m.label}</div>
                    <div style={{fontSize:11,color:"var(--c-ter)"}}>{m.cnt} transacciones</div>
                  </div>
                  <div style={{fontSize:15,fontWeight:700,color:m.rev>0?"var(--c-suc)":"var(--c-ter)"}}>{C$S(m.rev)}</div>
                </div>
              ))}
            </Section>
          </Card>

          {/* Data zone */}
          <Card sx={{borderColor:"var(--brd2)"}}>
            <Section title="⚙ Datos y exportación">
              <div style={{fontSize:13,color:"var(--c-sec)",marginBottom:14,lineHeight:1.6}}>
                Todos tus datos se guardan automáticamente en este dispositivo. Exporta a CSV para respaldo o análisis en Excel.
              </div>
              <div style={{...s.col,gap:10}}>
                <Btn onClick={exportCSV} full lg icon="ti-file-spreadsheet">Exportar reporte CSV</Btn>
                <Btn onClick={()=>setResetConf(true)} v="dan-faint" full icon="ti-refresh">Restablecer datos de ejemplo</Btn>
              </div>
            </Section>
          </Card>
        </>;
      })()}

    </div>
  </div>;
}
