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
const padN = n => String(n).padStart(4,"0");
const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

// Lot status helpers
const LOT_LABELS = {en_mano:"✅ En mano", transito_avion:"✈ Tránsito avión", transito_barco:"🚢 Tránsito barco"};
const LOT_COLORS = {en_mano:"var(--c-pos)", transito_avion:"var(--c-inf)", transito_barco:"var(--c-war)"};

// ─── SEED DATA ──────────────────────────────────────────────────
const SEED_CATS = ["Fire TV HD","Fire TV 4K","Premium","Accesorio","Otro"];

const SEED_PRODUCTS = [
  {id:1,name:"Fire TV HD (WiFi 6)",sku:"FTV-HD-W6",buyPrice:747,sellPrice:1400,stock:8,notes:"Nuevo modelo WiFi6 sin cubo. Amazon: C$594/u · Pinolero: C$153/u · Landed: C$747/u",minStock:3,category:"Fire TV HD"},
  {id:2,name:"Fire TV 4K Select",sku:"FTV-4K-SEL",buyPrice:821,sellPrice:1600,stock:12,notes:"Amazon: C$668/u · Pinolero: C$153/u · Landed: C$821/u",minStock:3,category:"Fire TV 4K"},
  {id:3,name:"Fire TV 4K Plus",sku:"FTV-4K-PLS",buyPrice:928,sellPrice:1700,stock:6,notes:"Amazon: C$928/u · Pinolero pendiente ~C$150/u · En tránsito avión",minStock:2,category:"Fire TV 4K"},
  {id:4,name:"Fire TV 4K Max",sku:"FTV-4K-MAX",buyPrice:1299,sellPrice:1900,stock:3,notes:"Amazon: C$1,299/u · Pinolero pendiente ~C$150/u · En tránsito avión",minStock:1,category:"Fire TV 4K"},
];

const SEED_TXS = [
  // LOTE B — 25 abril
  {id:101,type:"purchase",productId:1,qty:3,unitPrice:594,total:1781,date:"2025-04-25",time:null,notes:"Lote B · Cta. Marjorie",discount:0,clientId:null,lotStatus:"transito_barco",lotEta:"2025-05-16"},
  {id:102,type:"purchase",productId:2,qty:3,unitPrice:668,total:2004,date:"2025-04-25",time:null,notes:"Lote B · Cta. Marjorie",discount:0,clientId:null,lotStatus:"transito_barco",lotEta:"2025-05-16"},
  {id:103,type:"purchase",productId:1,qty:3,unitPrice:594,total:1781,date:"2025-04-25",time:null,notes:"Lote B · Cta. Yisleni",discount:0,clientId:null,lotStatus:"en_mano",lotEta:null},
  {id:104,type:"purchase",productId:2,qty:3,unitPrice:668,total:2004,date:"2025-04-25",time:null,notes:"Lote B · Cta. Yisleni",discount:0,clientId:null,lotStatus:"en_mano",lotEta:null},
  {id:105,type:"purchase",productId:2,qty:3,unitPrice:668,total:2004,date:"2025-04-25",time:null,notes:"Lote B · Cta. Gago",discount:0,clientId:null,lotStatus:"en_mano",lotEta:null},
  {id:106,type:"purchase",productId:1,qty:3,unitPrice:594,total:1781,date:"2025-04-25",time:null,notes:"Lote B · Cta. Relatos",discount:0,clientId:null,lotStatus:"transito_avion",lotEta:"2025-05-01"},
  {id:107,type:"purchase",productId:2,qty:3,unitPrice:668,total:2004,date:"2025-04-25",time:null,notes:"Lote B · Cta. Relatos",discount:0,clientId:null,lotStatus:"transito_avion",lotEta:"2025-05-01"},
  // LOTE A — 27 abril
  {id:108,type:"purchase",productId:3,qty:3,unitPrice:928,total:2784,date:"2025-04-27",time:null,notes:"Lote A · Cta. Marjorie",discount:0,clientId:null,lotStatus:"transito_avion",lotEta:"2025-04-30"},
  {id:109,type:"purchase",productId:4,qty:3,unitPrice:1299,total:3897,date:"2025-04-27",time:null,notes:"Lote A · Cta. Marjorie",discount:0,clientId:null,lotStatus:"transito_avion",lotEta:"2025-04-30"},
  {id:110,type:"purchase",productId:3,qty:3,unitPrice:928,total:2784,date:"2025-04-27",time:null,notes:"Lote A · Cta. Yisleni",discount:0,clientId:null,lotStatus:"transito_avion",lotEta:"2025-04-30"},
  // PINOLERO
  {id:111,type:"purchase",productId:null,qty:9,unitPrice:153,total:1380,date:"2025-04-27",time:null,notes:"Pinolero Box · 9 u. · 6 lbs · $37.50 · C$153/u",discount:0,clientId:null,lotStatus:"en_mano",lotEta:null},
  // VENTA
  {id:112,type:"sale",productId:1,qty:1,unitPrice:1400,total:1400,date:"2025-04-27",time:"",notes:"Incluye C$100 delivery",discount:0,clientId:null,invoiceId:null},
];

const SEED_CLIENTS  = [];
const SEED_INVOICES = [];
const SEED_BIZ = {name:"Vortex",tagline:"Tecnología al mejor precio",phone:"",address:"Managua, Nicaragua",ruc:""};

// ─── DESIGN ─────────────────────────────────────────────────────
const R = {
  card:  {background:"var(--bg1)",border:"0.5px solid var(--brd3)",borderRadius:16,padding:"1rem 1.25rem",marginBottom:10},
  surf:  {background:"var(--bg2)",borderRadius:12,padding:"0.875rem 1rem"},
  row:   {display:"flex",alignItems:"center"},
  rowB:  {display:"flex",alignItems:"center",justifyContent:"space-between"},
  col:   {display:"flex",flexDirection:"column"},
  label: {fontSize:11,fontWeight:700,color:"var(--c-ter)",textTransform:"uppercase",letterSpacing:"0.09em"},
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
    ghost:      {bg:"transparent",bo:"1px solid var(--brd2)",tc:"var(--c-pri)"},
    brand:      {bg:"var(--brand)",bo:"none",tc:"#fff",sh:"0 4px 18px var(--brand-glow)"},
    positive:   {bg:"var(--c-pos)",bo:"none",tc:"var(--bg1)"},
    warning:    {bg:"var(--c-war)",bo:"none",tc:"#fff"},
    danger:     {bg:"var(--c-dan)",bo:"none",tc:"#fff"},
    info:       {bg:"var(--c-inf)",bo:"none",tc:"#fff"},
    dark:       {bg:"var(--c-pri)",bo:"none",tc:"var(--bg1)"},
    "ghost-brand":{bg:"var(--bg-bra)",bo:"none",tc:"var(--brand)"},
    "ghost-pos": {bg:"var(--bg-pos)",bo:"none",tc:"var(--c-pos)"},
    "ghost-war": {bg:"var(--bg-war)",bo:"none",tc:"var(--c-war)"},
    "ghost-dan": {bg:"var(--bg-dan)",bo:"none",tc:"var(--c-dan)"},
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
    brand:   {g:"linear-gradient(135deg,#ff6b2b,#ff4500)",sh:"0 8px 24px var(--brand-glow)"},
    positive:{g:"linear-gradient(135deg,#00c4cc,#0099cc)",sh:"0 8px 24px rgba(0,196,204,0.35)"},
    info:    {g:"linear-gradient(135deg,#7c3aed,#6d28d9)",sh:"0 8px 24px rgba(124,58,237,0.35)"},
    warning: {g:"linear-gradient(135deg,#f59e0b,#d97706)",sh:"0 8px 24px rgba(245,158,11,0.3)"},
    neutral: {g:"var(--bg2)",sh:"none",dark:true},
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
  return <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:999,maxWidth:360,width:"calc(100% - 32px)",display:"flex",alignItems:"center",gap:10,padding:"12px 18px",borderRadius:14,fontSize:14,fontWeight:700,background:ok?"var(--c-pos)":"var(--c-dan)",color:"#fff",boxShadow:"0 8px 32px rgba(0,0,0,0.3)",animation:"slideDown 0.25s ease"}}>
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

// ─── INVOICE VIEW ────────────────────────────────────────────────
function InvoiceView({invoice,biz,onClose}) {
  const shareWhatsApp = () => {
    const lines = [
      `📄 FACTURA N° F-${padN(invoice.number)}`,
      `📅 ${fmtD(invoice.date)}${invoice.time?` · ${invoice.time}`:""}`,
      ``,
      invoice.clientName?`👤 Cliente: ${invoice.clientName}`:"",
      invoice.clientId?`🪪 Cédula/RUC: ${invoice.clientId}`:"",
      ``,
      `📦 DETALLE:`,
      ...invoice.items.map(it=>`• ${it.name} × ${it.qty} = ${C$S(it.total)}`),
      ``,
      `💰 TOTAL: ${C$S(invoice.total)}`,
      ``,
      `${biz.name}${biz.phone?` · ${biz.phone}`:""}`,
    ].filter(l=>l!==null).join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(lines)}`,"_blank");
  };

  const printInvoice = () => {
    const w = window.open("","_blank","width=400,height=600");
    w.document.write(`
      <html><head><title>Factura F-${padN(invoice.number)}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px;max-width:380px;font-size:13px;color:#111}
        .header{text-align:center;margin-bottom:20px;border-bottom:2px solid #111;padding-bottom:16px}
        .biz-name{font-size:22px;font-weight:900;letter-spacing:-0.5px}
        .biz-tag{font-size:12px;color:#666;margin-top:2px}
        .inv-num{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-top:10px;color:#666}
        .inv-big{font-size:26px;font-weight:800;color:#ff6b2b}
        .section{margin:16px 0;padding:14px 0;border-top:0.5px dashed #ccc}
        .section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#999;margin-bottom:8px}
        .row{display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px}
        .total-row{display:flex;justify-content:space-between;font-size:18px;font-weight:800;margin-top:12px;padding-top:12px;border-top:2px solid #111}
        .footer{text-align:center;margin-top:20px;padding-top:16px;border-top:0.5px dashed #ccc;font-size:12px;color:#666}
      </style>
      </head><body>
      <div class="header">
        <div class="biz-name">${biz.name}</div>
        <div class="biz-tag">${biz.tagline||""}</div>
        ${biz.address?`<div style="font-size:11px;color:#888;margin-top:4px">${biz.address}</div>`:""}
        ${biz.ruc?`<div style="font-size:11px;color:#888">RUC: ${biz.ruc}</div>`:""}
        <div class="inv-num">Factura</div>
        <div class="inv-big">N° F-${padN(invoice.number)}</div>
        <div style="font-size:12px;color:#666;margin-top:6px">${fmtD(invoice.date)}${invoice.time?` · ${invoice.time}`:""}</div>
      </div>
      ${invoice.clientName?`
      <div class="section">
        <div class="section-title">Datos del cliente</div>
        <div class="row"><span>Nombre</span><span><strong>${invoice.clientName}</strong></span></div>
        ${invoice.clientId?`<div class="row"><span>Cédula / RUC</span><span>${invoice.clientId}</span></div>`:""}
        ${invoice.clientAddr?`<div class="row"><span>Dirección</span><span>${invoice.clientAddr}</span></div>`:""}
      </div>`:""}
      <div class="section">
        <div class="section-title">Detalle</div>
        ${invoice.items.map(it=>`
          <div class="row"><span>${it.name} <span style="color:#999">× ${it.qty}</span></span><span>${C$S(it.unitPrice)}/u</span></div>
          <div class="row" style="font-size:12px;color:#999"><span></span><span>Subtotal: ${C$S(it.total)}</span></div>
        `).join("")}
        ${invoice.discount>0?`<div class="row"><span>Descuento</span><span style="color:#c45c00">-${invoice.discount}%</span></div>`:""}
        <div class="total-row"><span>TOTAL</span><span style="color:#ff6b2b">${C$S(invoice.total)}</span></div>
      </div>
      ${invoice.notes?`<div style="font-size:12px;color:#888;margin:12px 0">Nota: ${invoice.notes}</div>`:""}
      <div class="footer">
        <div style="font-size:18px;margin-bottom:6px">¡Gracias por su compra!</div>
        ${biz.phone?`<div>${biz.phone}</div>`:""}
        <div style="margin-top:8px;font-size:10px;color:#bbb">Factura generada por ${biz.name}</div>
      </div>
      </body></html>
    `);
    w.document.close();
    w.focus();
    setTimeout(()=>w.print(),400);
  };

  return <Modal title={`Factura N° F-${padN(invoice.number)}`} onClose={onClose}>
    {/* Invoice preview */}
    <div style={{background:"var(--bg2)",borderRadius:14,padding:"20px",marginBottom:16}}>
      {/* Header */}
      <div style={{textAlign:"center",paddingBottom:14,borderBottom:"1.5px dashed var(--brd2)",marginBottom:14}}>
        <div style={{fontSize:20,fontWeight:900,color:"var(--c-pri)"}}>{biz.name}</div>
        {biz.tagline&&<div style={{fontSize:12,color:"var(--c-sec)",marginTop:2}}>{biz.tagline}</div>}
        {biz.address&&<div style={{fontSize:11,color:"var(--c-ter)",marginTop:2}}>{biz.address}</div>}
        <div style={{marginTop:10,fontSize:11,color:"var(--c-ter)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Factura</div>
        <div style={{fontSize:22,fontWeight:800,color:"var(--brand)"}}>N° F-{padN(invoice.number)}</div>
        <div style={{fontSize:12,color:"var(--c-sec)",marginTop:4}}>{fmtD(invoice.date)}{invoice.time?` · ${invoice.time}`:""}</div>
      </div>
      {/* Client */}
      {invoice.clientName&&<div style={{marginBottom:12,paddingBottom:12,borderBottom:"0.5px dashed var(--brd2)"}}>
        <div style={{...R.label,marginBottom:6}}>Cliente</div>
        <div style={{fontSize:14,fontWeight:700,color:"var(--c-pri)"}}>{invoice.clientName}</div>
        {invoice.clientId&&<div style={{fontSize:12,color:"var(--c-sec)"}}>Cédula/RUC: {invoice.clientId}</div>}
        {invoice.clientAddr&&<div style={{fontSize:12,color:"var(--c-sec)"}}>{invoice.clientAddr}</div>}
      </div>}
      {/* Items */}
      <div style={{...R.label,marginBottom:8}}>Detalle</div>
      {invoice.items.map((it,i)=><div key={i} style={{...R.rowB,marginBottom:6}}>
        <div>
          <div style={{fontSize:14,fontWeight:600,color:"var(--c-pri)"}}>{it.name}</div>
          <div style={{fontSize:12,color:"var(--c-sec)"}}>{it.qty} u. × {C$S(it.unitPrice)}</div>
        </div>
        <div style={{fontWeight:700,color:"var(--c-pri)"}}>{C$S(it.total)}</div>
      </div>)}
      {invoice.discount>0&&<div style={{...R.rowB,fontSize:13,color:"var(--c-war)",marginTop:4}}>
        <span>Descuento aplicado</span><span>-{invoice.discount}%</span>
      </div>}
      <div style={{...R.rowB,marginTop:12,paddingTop:12,borderTop:"1.5px solid var(--brd2)"}}>
        <span style={{fontSize:15,fontWeight:700}}>TOTAL</span>
        <span style={{fontSize:22,fontWeight:800,color:"var(--brand)"}}>{C$S(invoice.total)}</span>
      </div>
      {invoice.notes&&<div style={{fontSize:12,color:"var(--c-sec)",marginTop:8}}>Nota: {invoice.notes}</div>}
      <div style={{textAlign:"center",marginTop:14,fontSize:13,color:"var(--c-ter)"}}>¡Gracias por su compra!</div>
    </div>
    {/* Actions */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <Btn onClick={printInvoice} v="dark" full lg icon="ti-printer">Imprimir</Btn>
      <Btn onClick={shareWhatsApp} full lg icon="ti-brand-whatsapp" sx={{background:"#25D366",color:"#fff"}}>WhatsApp</Btn>
    </div>
  </Modal>;
}

// ─── CATEGORY MANAGER ────────────────────────────────────────────
function CategoryManager({categories,onSave,onClose}) {
  const [cats,setCats]=useState([...categories]);
  const [newCat,setNewCat]=useState("");
  const [err,setErr]=useState("");
  const add=()=>{const v=newCat.trim();if(!v){setErr("Escribe un nombre");return;}if(cats.map(c=>c.toLowerCase()).includes(v.toLowerCase())){setErr("Ya existe");return;}setCats(c=>[...c,v]);setNewCat("");setErr("");};
  const remove=cat=>{if(cats.length<=1){setErr("Debe haber al menos una");return;}setCats(c=>c.filter(x=>x!==cat));};
  return <Modal title="Gestionar categorías" onClose={onClose}>
    <div style={{...R.col,gap:14}}>
      <div style={{...R.col,gap:6}}>
        {cats.map(c=><div key={c} style={{...R.rowB,background:"var(--bg2)",borderRadius:10,padding:"10px 14px"}}>
          <div style={{...R.row,gap:8}}><div style={{width:8,height:8,borderRadius:99,background:"var(--brand)",flexShrink:0}}/><span style={{fontSize:14,fontWeight:600,color:"var(--c-pri)"}}>{c}</span></div>
          <IconBtn onClick={()=>remove(c)} icon="ti-trash" sx={{background:"var(--bg-dan)",color:"var(--c-dan)"}} size={30}/>
        </div>)}
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

// ─── BIZ SETTINGS ────────────────────────────────────────────────
function BizSettingsModal({biz,onSave,onClose}) {
  const [f,setF]=useState({...biz});
  const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  return <Modal title="Datos del negocio" onClose={onClose}>
    <div style={{...R.col,gap:14}}>
      <p style={{fontSize:13,color:"var(--c-sec)",lineHeight:1.6,margin:0}}>Estos datos aparecen en todas las facturas que generes.</p>
      <Field label="Nombre del negocio"><input value={f.name} onChange={set("name")} style={{width:"100%"}}/></Field>
      <Field label="Eslogan / Tagline"><input value={f.tagline||""} onChange={set("tagline")} placeholder="Tecnología al mejor precio" style={{width:"100%"}}/></Field>
      <Field label="Teléfono / WhatsApp"><input value={f.phone||""} onChange={set("phone")} placeholder="8888-0000" style={{width:"100%"}}/></Field>
      <Field label="Dirección"><input value={f.address||""} onChange={set("address")} placeholder="Managua, Nicaragua" style={{width:"100%"}}/></Field>
      <Field label="RUC (opcional)"><input value={f.ruc||""} onChange={set("ruc")} placeholder="J0012345678901" style={{width:"100%"}}/></Field>
      <Btn onClick={()=>onSave(f)} v="dark" full lg>Guardar</Btn>
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
    {confirm&&<ConfirmModal title="¿Eliminar producto?" msg={`Se eliminará "${f.name}" y todo su historial.`} onConfirm={()=>onDelete(f.id)} onCancel={()=>setConfirm(false)}/>}
    <BackHeader title={isEdit?"Editar producto":"Nuevo producto"} sub={isEdit?f.sku||"Sin SKU":null} onBack={onBack}
      action={<Btn onClick={()=>{if(validate())onSave(f);}} v="brand" sm icon="ti-check">Guardar</Btn>}/>
    <div style={{padding:"20px",...R.col,gap:16}}>
      <Field label="Categoría">
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {categories.map(c=><button key={c} onClick={()=>setF(p=>({...p,category:c}))} style={{padding:"6px 14px",borderRadius:99,fontSize:13,fontWeight:600,border:"1.5px solid",cursor:"pointer",fontFamily:"inherit",borderColor:f.category===c?"var(--brand)":"var(--brd2)",background:f.category===c?"var(--brand)":"transparent",color:f.category===c?"#fff":"var(--c-sec)"}}>{c}</button>)}
        </div>
      </Field>
      <Field label="Nombre *" error={err.name}>
        <input value={f.name} onChange={set("name")} placeholder="Fire TV 4K Max" style={{width:"100%",borderColor:err.name?"var(--c-dan)":""}}/>
      </Field>
      <Field label="SKU / Código">
        <input value={f.sku} onChange={set("sku")} placeholder="FTV-4K-MAX" style={{width:"100%"}}/>
      </Field>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Field label="Costo landed (C$) *" error={err.buyPrice}>
          <input type="number" min="0" value={f.buyPrice} onChange={set("buyPrice")} placeholder="0" style={{width:"100%",borderColor:err.buyPrice?"var(--c-dan)":""}}/>
        </Field>
        <Field label="Precio venta (C$) *" error={err.sellPrice}>
          <input type="number" min="0" value={f.sellPrice} onChange={set("sellPrice")} placeholder="0" style={{width:"100%",borderColor:err.sellPrice?"var(--c-dan)":""}}/>
        </Field>
      </div>
      {margin!==null&&<div style={{background:"var(--bg-bra)",borderRadius:12,padding:"12px 16px",...R.rowB}}>
        <span style={{fontSize:13,color:"var(--brand)",fontWeight:600}}>Margen por unidad</span>
        <div><span style={{fontWeight:800,color:margin>=0?"var(--c-pos)":"var(--c-dan)",fontSize:17}}>{C$S(margin)}</span><span style={{fontSize:12,color:"var(--c-sec)",marginLeft:6}}>({mPct}%)</span></div>
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Field label="Stock actual"><input type="number" min="0" value={f.stock} onChange={set("stock")} style={{width:"100%"}}/></Field>
        <Field label="Alerta mínima"><input type="number" min="0" value={f.minStock} onChange={set("minStock")} placeholder="2" style={{width:"100%"}}/></Field>
      </div>
      <Field label="Notas / Costos">
        <textarea value={f.notes} onChange={set("notes")} rows={3} placeholder="Amazon, Pinolero, descripción…" style={{width:"100%",resize:"vertical",fontFamily:"inherit"}}/>
      </Field>
      {isEdit&&<><Divider my={4}/><Btn onClick={()=>setConfirm(true)} v="danger" full lg icon="ti-trash">Eliminar producto</Btn></>}
    </div>
  </div>;
}

// ─── SALE FORM (con facturación) ──────────────────────────────────
function SaleForm({products,clients,initPid,onSave,onUpdate,editTx,onBack}) {
  const isEdit=!!editTx;
  const def=editTx?products.find(p=>p.id===editTx.productId):products.find(p=>p.id===initPid)||products.find(p=>p.stock>0)||products[0];
  const [f,setF]=useState(isEdit
    ?{productId:String(editTx.productId||""),qty:String(editTx.qty),unitPrice:String(editTx.unitPrice),discount:String(editTx.discount||0),date:editTx.date,time:editTx.time||nowTime(),notes:editTx.notes||"",clientId:String(editTx.clientId||"")}
    :{productId:def?.id||"",qty:"1",unitPrice:def?.sellPrice||"",discount:"0",date:todayISO(),time:nowTime(),notes:"",clientId:""});
  const [wantInvoice,setWantInvoice]=useState(false);
  const [invF,setInvF]=useState({clientName:"",clientId:"",clientAddr:""});
  const [err,setErr]=useState({});
  const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const prod=products.find(p=>p.id===+f.productId);
  const disc=Math.min(+(f.discount)||0,100);
  const finalP=(+f.unitPrice||0)*(1-disc/100);
  const total=finalP*(+f.qty||0);
  const gain=prod?(finalP-prod.buyPrice)*(+f.qty||0):null;
  const validate=()=>{const e={};if(!f.productId)e.productId="Selecciona un producto";if(!+f.qty||+f.qty<1)e.qty="Cantidad inválida";if(!+f.unitPrice)e.unitPrice="Precio requerido";if(prod&&!isEdit&&+f.qty>prod.stock)e.qty=`Solo hay ${prod.stock} u.`;setErr(e);return!Object.keys(e).length;};
  const handleSave=()=>{
    if(!validate()) return;
    const data={...f,discount:disc,invoiceData:wantInvoice?invF:null};
    isEdit?onUpdate(editTx,data):onSave(data);
  };
  return <div>
    <BackHeader title={isEdit?"Editar venta":"Nueva venta"} onBack={onBack}
      action={<Btn onClick={handleSave} v="positive" sm icon="ti-check">{isEdit?"Actualizar":"Registrar"}</Btn>}/>
    <div style={{padding:"20px",...R.col,gap:14}}>
      <Field label="Producto *" error={err.productId}>
        <select value={f.productId} onChange={e=>{const p=products.find(x=>x.id===+e.target.value);setF(pv=>({...pv,productId:e.target.value,unitPrice:p?.sellPrice||""}));}} style={{width:"100%",fontFamily:"inherit",borderColor:err.productId?"var(--c-dan)":""}}>
          <option value="">— Seleccionar —</option>
          {products.map(p=><option key={p.id} value={p.id} disabled={!isEdit&&p.stock===0}>{p.name} {!isEdit&&p.stock===0?"(sin stock)":`· ${C$S(p.sellPrice)} · ${p.stock} u.`}</option>)}
        </select>
      </Field>
      {prod&&<div style={{...R.surf,display:"flex",flexWrap:"wrap",gap:"6px 20px"}}>
        <span style={{fontSize:13,color:"var(--c-sec)"}}>Precio: <strong style={{color:"var(--c-pos)"}}>{C$S(prod.sellPrice)}</strong></span>
        <span style={{fontSize:13,color:"var(--c-sec)"}}>Stock: <strong>{prod.stock} u.</strong></span>
        <span style={{fontSize:13,color:"var(--c-sec)"}}>Costo: <strong style={{color:"var(--c-war)"}}>{C$S(prod.buyPrice)}</strong></span>
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Field label="Cantidad" error={err.qty}><input type="number" min="1" value={f.qty} onChange={set("qty")} style={{width:"100%",borderColor:err.qty?"var(--c-dan)":""}}/></Field>
        <Field label="Precio de venta (C$)" error={err.unitPrice}><input type="number" min="0" value={f.unitPrice} onChange={set("unitPrice")} style={{width:"100%",borderColor:err.unitPrice?"var(--c-dan)":""}}/></Field>
      </div>
      <Field label={`Descuento %${disc>0?` → Final: ${C$S(finalP)}/u`:""}`}>
        <input type="number" min="0" max="100" value={f.discount} onChange={set("discount")} style={{width:"100%"}}/>
      </Field>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Field label="Fecha"><input type="date" value={f.date} onChange={set("date")} style={{width:"100%"}}/></Field>
        <Field label="Hora" hint="Formato 24h">
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
      <Field label="Notas"><input value={f.notes} onChange={set("notes")} placeholder="Incluye delivery C$100…" style={{width:"100%"}}/></Field>

      {/* FACTURA TOGGLE */}
      {!isEdit&&<div style={{borderRadius:14,border:`1.5px solid ${wantInvoice?"var(--brand)":"var(--brd2)"}`,overflow:"hidden"}}>
        <button onClick={()=>setWantInvoice(w=>!w)} style={{width:"100%",background:wantInvoice?"var(--bg-bra)":"transparent",border:"none",cursor:"pointer",padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",fontFamily:"inherit"}}>
          <div style={{...R.row,gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:wantInvoice?"var(--brand)":"var(--bg2)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <i className="ti ti-receipt" style={{fontSize:20,color:wantInvoice?"#fff":"var(--c-sec)"}} aria-hidden/>
            </div>
            <div style={{textAlign:"left"}}>
              <div style={{fontSize:14,fontWeight:700,color:"var(--c-pri)"}}>Generar factura</div>
              <div style={{fontSize:12,color:"var(--c-sec)"}}>Imprimible y compartible por WhatsApp</div>
            </div>
          </div>
          <div style={{width:44,height:26,borderRadius:99,background:wantInvoice?"var(--brand)":"var(--brd2)",position:"relative",transition:"background 0.2s",flexShrink:0}}>
            <div style={{width:20,height:20,borderRadius:99,background:"#fff",position:"absolute",top:3,left:wantInvoice?21:3,transition:"left 0.2s"}}/>
          </div>
        </button>
        {wantInvoice&&<div style={{padding:"0 16px 16px",...R.col,gap:10}}>
          <Field label="Nombre del cliente">
            <input value={invF.clientName} onChange={e=>setInvF(p=>({...p,clientName:e.target.value}))} placeholder="Juan Pérez" style={{width:"100%"}}/>
          </Field>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Cédula / RUC">
              <input value={invF.clientId} onChange={e=>setInvF(p=>({...p,clientId:e.target.value}))} placeholder="001-XXXXXX-XXXX" style={{width:"100%"}}/>
            </Field>
            <Field label="Dirección">
              <input value={invF.clientAddr} onChange={e=>setInvF(p=>({...p,clientAddr:e.target.value}))} placeholder="Managua" style={{width:"100%"}}/>
            </Field>
          </div>
        </div>}
      </div>}

      {total>0&&<div style={{background:"linear-gradient(135deg,#00c4cc,#0099cc)",borderRadius:16,padding:"18px 20px",boxShadow:"0 6px 20px rgba(0,196,204,0.35)"}}>
        <div style={R.rowB}><span style={{fontSize:14,color:"rgba(255,255,255,0.8)"}}>Total de venta</span><span style={{fontSize:34,fontWeight:800,color:"#fff"}}>{C$S(total)}</span></div>
        {gain!==null&&<><Divider my={12}/><div style={R.rowB}><span style={{fontSize:13,color:"rgba(255,255,255,0.75)"}}>Ganancia estimada</span><span style={{fontSize:17,fontWeight:800,color:"#fff"}}>{C$S(gain)}</span></div></>}
      </div>}
    </div>
  </div>;
}

// ─── PURCHASE FORM (con estado de lote) ──────────────────────────
function PurchaseForm({products,initPid,onSave,onUpdate,editTx,onBack}) {
  const isEdit=!!editTx;
  const def=editTx?products.find(p=>p.id===editTx.productId):products.find(p=>p.id===initPid)||products[0];
  const [f,setF]=useState(isEdit
    ?{productId:String(editTx.productId||""),qty:String(editTx.qty),unitPrice:String(editTx.unitPrice),date:editTx.date,notes:editTx.notes||"",lotStatus:editTx.lotStatus||"en_mano",lotEta:editTx.lotEta||""}
    :{productId:def?.id||"",qty:"1",unitPrice:def?.buyPrice||"",date:todayISO(),notes:"",lotStatus:"en_mano",lotEta:""});
  const [err,setErr]=useState({});
  const set=k=>e=>setF(p=>({...p,[k]:e.target.value}));
  const chProd=e=>{const p=products.find(x=>x.id===+e.target.value);setF(pv=>({...pv,productId:e.target.value,unitPrice:p?.buyPrice||""}));};
  const prod=products.find(p=>p.id===+f.productId);
  const total=(+f.unitPrice||0)*(+f.qty||0);
  const validate=()=>{const e={};if(!+f.qty)e.qty="Requerido";if(!+f.unitPrice)e.unitPrice="Requerido";setErr(e);return!Object.keys(e).length;};
  const handleSave=()=>{if(validate()){isEdit?onUpdate(editTx,f):onSave(f);}};
  return <div>
    <BackHeader title={isEdit?"Editar compra":"Nueva compra / gasto"} onBack={onBack}
      action={<Btn onClick={handleSave} v="warning" sm icon="ti-check">{isEdit?"Actualizar":"Registrar"}</Btn>}/>
    <div style={{padding:"20px",...R.col,gap:14}}>
      <Field label="Producto (dejar vacío para gastos logísticos)">
        <select value={f.productId} onChange={chProd} style={{width:"100%",fontFamily:"inherit"}}>
          <option value="">— Gasto logístico —</option>
          {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>
      {prod&&<div style={R.surf}>
        <span style={{fontSize:13,color:"var(--c-sec)"}}>Costo habitual: <strong style={{color:"var(--c-war)"}}>{C$S(prod.buyPrice)}</strong></span>
        <span style={{fontSize:13,color:"var(--c-sec)",marginLeft:20}}>Stock: <strong>{prod.stock} u.</strong></span>
      </div>}

      {/* ESTADO DEL LOTE */}
      <Field label="Estado del lote">
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:8}}>
          {Object.entries(LOT_LABELS).map(([val,lbl])=><button key={val} onClick={()=>setF(p=>({...p,lotStatus:val}))} style={{padding:"10px 6px",borderRadius:10,fontSize:12,fontWeight:600,border:`1.5px solid`,cursor:"pointer",fontFamily:"inherit",textAlign:"center",borderColor:f.lotStatus===val?LOT_COLORS[val]:"var(--brd2)",background:f.lotStatus===val?"var(--bg2)":"transparent",color:f.lotStatus===val?LOT_COLORS[val]:"var(--c-ter)"}}>
            {lbl}
          </button>)}
        </div>
      </Field>
      {f.lotStatus!=="en_mano"&&<Field label="ETA estimada" hint="Fecha esperada de llegada">
        <input type="date" value={f.lotEta} onChange={set("lotEta")} style={{width:"100%"}}/>
      </Field>}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Field label="Cantidad" error={err.qty}><input type="number" min="1" value={f.qty} onChange={set("qty")} style={{width:"100%",borderColor:err.qty?"var(--c-dan)":""}}/></Field>
        <Field label="Precio unitario (C$)" error={err.unitPrice}><input type="number" min="0" value={f.unitPrice} onChange={set("unitPrice")} style={{width:"100%",borderColor:err.unitPrice?"var(--c-dan)":""}}/></Field>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Field label="Fecha"><input type="date" value={f.date} onChange={set("date")} style={{width:"100%"}}/></Field>
        <Field label="Cuenta / Proveedor / Notas"><input value={f.notes} onChange={set("notes")} placeholder="Cta. Marjorie, Pinolero…" style={{width:"100%"}}/></Field>
      </div>
      {total>0&&<div style={{background:"linear-gradient(135deg,#f59e0b,#d97706)",borderRadius:16,padding:"18px 20px",boxShadow:"0 6px 20px rgba(245,158,11,0.3)"}}>
        <div style={R.rowB}><span style={{fontSize:14,color:"rgba(255,255,255,0.8)"}}>Total a registrar</span><span style={{fontSize:34,fontWeight:800,color:"#fff"}}>{C$S(total)}</span></div>
      </div>}
    </div>
  </div>;
}

// ─── PRODUCT DETAIL (con WAC y lotes) ────────────────────────────
function ProductDetail({product,txs,clients,onEdit,onSale,onPurchase,onBack}) {
  const myTxs=[...txs].filter(t=>t.productId===product.id).sort((a,b)=>(b.date+(b.time||"")).localeCompare(a.date+(a.time||"")));
  const sales=myTxs.filter(t=>t.type==="sale");
  const purchases=myTxs.filter(t=>t.type==="purchase");
  const soldQty=sales.reduce((s,t)=>s+t.qty,0);
  const revenue=sales.reduce((s,t)=>s+t.total,0);
  const profit=revenue-soldQty*product.buyPrice;
  const margin=product.sellPrice-product.buyPrice;
  const mPct=product.sellPrice>0?((margin/product.sellPrice)*100).toFixed(1):0;

  // Weighted Average Cost
  const totalPurchasedQty=purchases.reduce((s,t)=>s+t.qty,0);
  const totalPurchasedCost=purchases.reduce((s,t)=>s+t.total,0);
  const wac=totalPurchasedQty>0?totalPurchasedCost/totalPurchasedQty:product.buyPrice;

  // Stock by lot status (from purchases, not adjusted for sales)
  const lotBreakdown=purchases.reduce((acc,t)=>{
    const st=t.lotStatus||"en_mano";
    acc[st]=(acc[st]||0)+t.qty;
    return acc;
  },{});
  const inTransit=(lotBreakdown.transito_avion||0)+(lotBreakdown.transito_barco||0);

  const n=new Date();
  const spark=Array.from({length:6},(_,i)=>{const d=new Date(n);d.setMonth(d.getMonth()-5+i);const m=d.getMonth(),y=d.getFullYear();return myTxs.filter(t=>t.type==="sale"&&new Date(t.date+"T12:00").getMonth()===m&&new Date(t.date+"T12:00").getFullYear()===y).reduce((s,t)=>s+t.qty,0);});

  return <div>
    <BackHeader title={product.name} sub={`${product.sku||"Sin SKU"} · ${product.category||""}`} onBack={onBack} action={<Btn onClick={onEdit} sm icon="ti-edit">Editar</Btn>}/>
    <div style={{background:"linear-gradient(160deg,#0f0f0f,#1e1200)",padding:"24px 20px 20px"}}>
      <div style={{...R.rowB,marginBottom:16}}>
        <div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Stock total</div>
          <div style={{fontSize:64,fontWeight:800,lineHeight:1,color:product.stock>0?"var(--c-pos)":"var(--c-dan)"}}>{product.stock}</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginTop:4}}>unidades</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Valor potencial</div>
          <div style={{fontSize:22,fontWeight:800,color:"var(--brand)"}}>{C$S(product.sellPrice*product.stock)}</div>
          <SparkBar data={spark} color="var(--brand)" height={42}/>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:4}}>Últ. 6 meses (u. vendidas)</div>
        </div>
      </div>
      {/* Lot status pills */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
        {Object.entries(lotBreakdown).filter(([,qty])=>qty>0).map(([st,qty])=>(
          <div key={st} style={{background:"rgba(255,255,255,0.1)",borderRadius:99,padding:"4px 12px",fontSize:12,fontWeight:700,color:"#fff"}}>
            {LOT_LABELS[st]||st}: {qty} u.
          </div>
        ))}
      </div>
      <ProgressBar val={product.stock-inTransit} max={Math.max(product.stock+soldQty,10)} color="var(--c-pos)" h={4}/>
      <div style={{...R.rowB,marginTop:4,fontSize:11,color:"rgba(255,255,255,0.3)"}}>
        <span>{product.stock-inTransit} en mano</span><span>{inTransit} en tránsito</span>
      </div>
    </div>

    <div style={{padding:"16px 20px"}}>
      {/* Metrics */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        {[["Costo landed",C$(product.buyPrice),"war"],["Precio venta",C$(product.sellPrice),"pos"],
          ["Margen/unidad",`${C$S(margin)} (${mPct}%)`,"brand"],["Ganancia total",C$S(profit),"pos"],
          ["WAC promedio",C$(wac),"inf"],["Unid. vendidas",`${soldQty} u. · ${C$S(revenue)}`,"inf"],
        ].map(([l,v,c])=><div key={l} style={R.surf}>
          <div style={{...R.label,marginBottom:4}}>{l}</div>
          <div style={{fontSize:c==="brand"?15:14,fontWeight:800,color:c==="brand"?"var(--brand)":`var(--c-${c})`}}>{v}</div>
        </div>)}
      </div>

      {/* WAC explanation */}
      <div style={{...R.surf,marginBottom:14,background:"var(--bg-inf)"}}>
        <div style={{...R.label,color:"var(--c-inf)",marginBottom:4}}>Costo Promedio Ponderado (WAC)</div>
        <div style={{fontSize:13,color:"var(--c-inf)",lineHeight:1.5}}>
          {totalPurchasedQty} unidades compradas × {C$(wac)}/u promedio. Se calcula automáticamente según todos tus lotes de compra.
        </div>
      </div>

      {product.notes&&<div style={{...R.surf,marginBottom:14}}>
        <div style={{...R.label,marginBottom:4}}>Notas / Costos</div>
        <div style={{fontSize:13,color:"var(--c-pri)",lineHeight:1.6}}>{product.notes}</div>
      </div>}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
        <Btn onClick={onSale}     v="positive" full lg icon="ti-receipt">Vender</Btn>
        <Btn onClick={onPurchase} v="warning"  full lg icon="ti-package">Restock</Btn>
      </div>

      {/* Lot breakdown table */}
      {purchases.length>0&&<>
        <SectionLabel text={`Lotes comprados (${purchases.length})`}/>
        {purchases.map(t=><Card key={t.id} sx={{marginBottom:8}}>
          <div style={R.rowB}>
            <div style={{...R.row,gap:10}}>
              <div style={{width:8,height:36,borderRadius:4,background:LOT_COLORS[t.lotStatus||"en_mano"],flexShrink:0}}/>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:"var(--c-pri)"}}>{t.qty} u. × {C$S(t.unitPrice)}</div>
                <div style={{fontSize:11,color:"var(--c-sec)"}}>{fmtS(t.date)} · {LOT_LABELS[t.lotStatus||"en_mano"]}{t.lotEta?` · ETA ${fmtS(t.lotEta)}`:""}</div>
                {t.notes&&<div style={{fontSize:11,color:"var(--c-ter)"}}>{t.notes}</div>}
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontWeight:800,color:"var(--c-war)"}}>{C$S(t.total)}</div>
              <Badge sm v={t.lotStatus==="en_mano"?"positive":t.lotStatus==="transito_avion"?"info":"warning"}>
                {t.lotStatus==="en_mano"?"En mano":t.lotStatus==="transito_avion"?"Avión":"Barco"}
              </Badge>
            </div>
          </div>
        </Card>)}
        <Divider my={16}/>
      </>}

      <SectionLabel text={`Ventas (${sales.length})`}/>
      {sales.length===0&&<Empty icon="ti-receipt" text="Sin ventas registradas"/>}
      {sales.map(t=>{
        const cli=clients.find(c=>c.id===t.clientId);
        return <Card key={t.id} sx={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{...R.row,gap:12}}>
            <div style={{width:42,height:42,borderRadius:13,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg-pos)"}}>
              <i className="ti ti-trending-up" style={{fontSize:20,color:"var(--c-pos)"}} aria-hidden/>
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:"var(--c-pri)"}}>{t.qty} u. vendida{t.qty>1?"s":""}</div>
              <div style={{fontSize:12,color:"var(--c-sec)"}}>{fmtS(t.date)}{t.time?` ${t.time}`:""}{cli?` · ${cli.name}`:t.notes?` · ${t.notes}`:""}</div>
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontWeight:800,color:"var(--c-pos)"}}>{C$S(t.total)}</div>
            <div style={{fontSize:12,color:"var(--c-ter)"}}>gan. {C$S(t.unitPrice-product.buyPrice)}/u</div>
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
      <Field label="Teléfono / WhatsApp"><input value={f.phone||""} onChange={set("phone")} placeholder="8888-0000" style={{width:"100%"}}/></Field>
      <Field label="Notas"><textarea value={f.notes||""} onChange={set("notes")} rows={3} placeholder="Empresa, dirección, preferencias…" style={{width:"100%",resize:"vertical",fontFamily:"inherit"}}/></Field>
      {isEdit&&<><Divider/><Btn onClick={()=>setConfirm(true)} v="danger" full icon="ti-trash">Eliminar cliente</Btn></>}
    </div>
  </div>;
}

// ══════════════════════════════════════════════════════════════════
//  MAIN APP
// ══════════════════════════════════════════════════════════════════
export default function App() {
  const [products,      setProducts]      = usePersist("vortex2_products",   SEED_PRODUCTS);
  const [txs,           setTxs]           = usePersist("vortex2_txs",        SEED_TXS);
  const [clients,       setClients]       = usePersist("vortex2_clients",    SEED_CLIENTS);
  const [categories,    setCategories]    = usePersist("vortex2_categories", SEED_CATS);
  const [invoices,      setInvoices]      = usePersist("vortex2_invoices",   SEED_INVOICES);
  const [invoiceCounter,setInvoiceCounter]= usePersist("vortex2_inv_cnt",    1);
  const [bizSettings,   setBizSettings]   = usePersist("vortex2_biz",        SEED_BIZ);

  const [view,         setView]          = useState({name:"main"});
  const [tab,          setTab]           = useState("home");
  const [mvTab,        setMvTab]         = useState("sales");
  const [mvSearch,     setMvSearch]      = useState("");
  const [toast,        setToastSt]       = useState(null);
  const [search,       setSearch]        = useState("");
  const [catFilter,    setCat]           = useState("Todos");
  const [stockF,       setStockF]        = useState("all");
  const [quickOpen,    setQuick]         = useState(false);
  const [catMgr,       setCatMgr]        = useState(false);
  const [bizModal,     setBizModal]      = useState(false);
  const [resetConf,    setResetConf]     = useState(false);
  const [deleteTxConf, setDeleteTxConf]  = useState(null);
  const [activeInvoice,setActiveInvoice] = useState(null);

  const go   = useCallback(v=>{setView(v);setQuick(false);},[]);
  const back = useCallback(()=>setView({name:"main"}),[]);
  const getProd  = id=>products.find(p=>p.id===+id);
  const getClient= id=>clients.find(c=>c.id===+id);
  const showToast= useCallback((msg,type="ok")=>{setToastSt({msg,type});setTimeout(()=>setToastSt(null),3000);},[]);

  const stats=useMemo(()=>{
    const invested = txs.filter(t=>t.type==="purchase").reduce((s,t)=>s+t.total,0);
    const revenue  = txs.filter(t=>t.type==="sale").reduce((s,t)=>s+t.total,0);
    const cogs     = txs.filter(t=>t.type==="sale").reduce((s,t)=>{const p=getProd(t.productId);return s+(p?p.buyPrice*t.qty:0);},0);
    const invValue = products.reduce((s,p)=>s+p.sellPrice*p.stock,0);
    const costValue= products.reduce((s,p)=>s+p.buyPrice*p.stock,0);
    const units    = products.reduce((s,p)=>s+p.stock,0);
    return{invested,revenue,profit:revenue-cogs,cogs,invValue,costValue,units,saleCnt:txs.filter(t=>t.type==="sale").length};
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
    let invId=null;
    // Create invoice if requested
    if(f.invoiceData){
      const inv={
        id:uid(),number:invoiceCounter,
        date:f.date,time:f.time||null,
        clientName:f.invoiceData.clientName||"",
        clientId:f.invoiceData.clientId||"",
        clientAddr:f.invoiceData.clientAddr||"",
        items:[{productId:+f.productId,name:p.name,qty:+f.qty,unitPrice:finalP,total}],
        discount:disc,total,notes:f.notes||""
      };
      invId=inv.id;
      setInvoices(ivs=>[inv,...ivs]);
      setInvoiceCounter(c=>c+1);
      setTimeout(()=>setActiveInvoice(inv),300);
    }
    setTxs(ts=>[{id:uid(),type:"sale",productId:+f.productId,qty:+f.qty,unitPrice:finalP,total,date:f.date,time:f.time||null,notes:f.notes||"",discount:disc,clientId:+f.clientId||null,invoiceId:invId},...ts]);
    setProducts(ps=>ps.map(x=>x.id===+f.productId?{...x,stock:x.stock-(+f.qty)}:x));
    showToast(f.invoiceData?`¡Venta de ${C$S(total)} · Factura N° F-${padN(invoiceCounter)}`:`¡Venta de ${C$S(total)} registrada!`);
    back();
  },[products,invoiceCounter,showToast,back]);

  const updateSale=useCallback((oldTx,f)=>{
    const p=getProd(f.productId);
    if(!p||!+f.qty||!+f.unitPrice){showToast("Completa todos los campos","err");return;}
    const baseStock=p.stock+(oldTx.productId===+f.productId?oldTx.qty:0);
    if(+f.qty>baseStock){showToast(`Solo hay ${baseStock} u. disponibles`,"err");return;}
    const disc=Math.min(+(f.discount)||0,100);
    const finalP=(+f.unitPrice)*(1-disc/100);
    const total=finalP*(+f.qty);
    setTxs(ts=>ts.map(t=>t.id===oldTx.id?{...t,productId:+f.productId,qty:+f.qty,unitPrice:finalP,total,date:f.date,time:f.time||null,notes:f.notes||"",discount:disc,clientId:+f.clientId||null}:t));
    setProducts(ps=>ps.map(x=>{
      if(x.id===oldTx.productId&&x.id===+f.productId) return{...x,stock:x.stock+oldTx.qty-(+f.qty)};
      if(x.id===oldTx.productId) return{...x,stock:x.stock+oldTx.qty};
      if(x.id===+f.productId)    return{...x,stock:x.stock-(+f.qty)};
      return x;
    }));
    showToast("Venta actualizada ✓");back();
  },[products,showToast,back]);

  const savePurchase=useCallback(f=>{
    if(!+f.qty||!+f.unitPrice){showToast("Completa los campos","err");return;}
    const total=(+f.unitPrice)*(+f.qty);
    setTxs(ts=>[{id:uid(),type:"purchase",productId:+f.productId||null,qty:+f.qty,unitPrice:+f.unitPrice,total,date:f.date,time:null,notes:f.notes||"",discount:0,clientId:null,lotStatus:f.lotStatus||"en_mano",lotEta:f.lotEta||null},...ts]);
    if(f.productId)setProducts(ps=>ps.map(x=>x.id===+f.productId?{...x,stock:x.stock+(+f.qty)}:x));
    showToast(`Compra de ${C$S(total)} registrada`);back();
  },[showToast,back]);

  const updatePurchase=useCallback((oldTx,f)=>{
    if(!+f.qty||!+f.unitPrice){showToast("Completa los campos","err");return;}
    const total=(+f.unitPrice)*(+f.qty);
    setTxs(ts=>ts.map(t=>t.id===oldTx.id?{...t,productId:+f.productId||null,qty:+f.qty,unitPrice:+f.unitPrice,total,date:f.date,notes:f.notes||"",lotStatus:f.lotStatus||"en_mano",lotEta:f.lotEta||null}:t));
    setProducts(ps=>ps.map(x=>{
      if(x.id===oldTx.productId&&x.id===+f.productId) return{...x,stock:x.stock-oldTx.qty+(+f.qty)};
      if(x.id===oldTx.productId) return{...x,stock:x.stock-oldTx.qty};
      if(x.id===+f.productId)    return{...x,stock:x.stock+(+f.qty)};
      return x;
    }));
    showToast("Compra actualizada ✓");back();
  },[showToast,back]);

  const saveClient=useCallback(f=>{
    if(!f.name){showToast("El nombre es requerido","err");return;}
    if(f.id){setClients(cs=>cs.map(x=>x.id===f.id?f:x));showToast("Cliente actualizado ✓");}
    else{setClients(cs=>[...cs,{...f,id:uid()}]);showToast("Cliente agregado ✓");}
    back();
  },[showToast,back]);

  const deleteClient=useCallback(id=>{setClients(cs=>cs.filter(c=>c.id!==id));showToast("Cliente eliminado");back();},[showToast,back]);

  const saveCategories=useCallback(cats=>{
    setCategories(cats);setProducts(ps=>ps.map(p=>cats.includes(p.category)?p:{...p,category:cats[0]||""}));
    setCatMgr(false);showToast("Categorías actualizadas ✓");
  },[showToast]);

  const deleteTx=useCallback(tx=>{
    setTxs(ts=>ts.filter(t=>t.id!==tx.id));
    if(tx.productId){setProducts(ps=>ps.map(x=>{if(x.id!==tx.productId)return x;return{...x,stock:tx.type==="sale"?x.stock+tx.qty:x.stock-tx.qty};}));}
    setDeleteTxConf(null);showToast("Movimiento eliminado");
  },[showToast]);

  const exportCSV=useCallback(()=>{
    const h1=["Producto","SKU","Categoría","Costo","P.Venta","Stock","Valor Pot.","Margen","WAC"];
    const r1=products.map(p=>{
      const pTxs=txs.filter(t=>t.type==="purchase"&&t.productId===p.id);
      const pQty=pTxs.reduce((s,t)=>s+t.qty,0);const pCost=pTxs.reduce((s,t)=>s+t.total,0);
      const wac=pQty>0?(pCost/pQty).toFixed(0):p.buyPrice;
      return[p.name,p.sku||"",p.category||"",p.buyPrice,p.sellPrice,p.stock,(p.sellPrice*p.stock).toFixed(0),(p.sellPrice-p.buyPrice).toFixed(0),wac];
    });
    const h2=["Tipo","Producto","Cantidad","P.Unitario","Total","Descuento","Fecha","Hora","Estado Lote","ETA","Cliente","Notas"];
    const r2=[...txs].sort((a,b)=>b.date.localeCompare(a.date)).map(t=>{const p=getProd(t.productId);const c=getClient(t.clientId);return[t.type==="sale"?"Venta":"Compra",p?.name||"Logística",t.qty,(+t.unitPrice).toFixed(0),t.total.toFixed(0),t.discount?t.discount+"%":"0%",t.date,t.time||"",t.lotStatus?LOT_LABELS[t.lotStatus]:"",t.lotEta||"",c?.name||"",t.notes||""];});
    const csv=[h1,...r1,[],[h2],...r2].map(r=>r.join(",")).join("\n");
    const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`vortex_${todayISO()}.csv`;a.click();
    showToast("CSV exportado ✓");
  },[products,txs,clients,showToast]);

  // ── ROUTING ──
  if(view.name==="add-product")    return <ProductForm product={null}       categories={categories} onSave={saveProduct}  onDelete={deleteProduct} onBack={back}/>;
  if(view.name==="edit-product")   return <ProductForm product={view.data}  categories={categories} onSave={saveProduct}  onDelete={deleteProduct} onBack={back}/>;
  if(view.name==="product-detail") return <ProductDetail product={view.data} txs={txs} clients={clients} onEdit={()=>go({name:"edit-product",data:view.data})} onSale={()=>go({name:"add-sale",data:{pid:view.data.id}})} onPurchase={()=>go({name:"add-purchase",data:{pid:view.data.id}})} onBack={back}/>;
  if(view.name==="add-sale")       return <SaleForm     products={products} clients={clients} initPid={view.data?.pid} onSave={saveSale}                           onBack={back}/>;
  if(view.name==="edit-sale")      return <SaleForm     products={products} clients={clients} editTx={view.data}       onSave={saveSale}  onUpdate={updateSale}     onBack={back}/>;
  if(view.name==="add-purchase")   return <PurchaseForm products={products}                  initPid={view.data?.pid} onSave={savePurchase}                         onBack={back}/>;
  if(view.name==="edit-purchase")  return <PurchaseForm products={products}                  editTx={view.data}       onSave={savePurchase} onUpdate={updatePurchase} onBack={back}/>;
  if(view.name==="add-client")     return <ClientForm client={null}       onSave={saveClient} onDelete={deleteClient} onBack={back}/>;
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

  const sortTx=arr=>[...arr].sort((a,b)=>(b.date+(b.time||"99:99")).localeCompare(a.date+(a.time||"99:99")));
  const saleTxs=sortTx(txs.filter(t=>t.type==="sale"));
  const purchTxs=sortTx(txs.filter(t=>t.type==="purchase"));

  const mvList=useMemo(()=>{
    const base=mvTab==="sales"?saleTxs:purchTxs;
    if(!mvSearch) return base;
    const q=mvSearch.toLowerCase();
    return base.filter(t=>{const p=getProd(t.productId);const c=getClient(t.clientId);return(p?.name||"").toLowerCase().includes(q)||(t.notes||"").toLowerCase().includes(q)||(c?.name||"").toLowerCase().includes(q)||t.date.includes(q);});
  },[mvTab,saleTxs,purchTxs,mvSearch]);

  const groupDate=arr=>{const g={};arr.forEach(t=>{if(!g[t.date])g[t.date]=[];g[t.date].push(t);});return Object.entries(g).sort((a,b)=>b[0].localeCompare(a[0]));};

  // Transit lotes from real purchase transactions
  const transitLots=useMemo(()=>{
    const lots=txs.filter(t=>t.type==="purchase"&&t.productId&&t.lotStatus!=="en_mano");
    const byLot={};
    lots.forEach(t=>{
      const key=`${t.lotStatus}-${t.date}-${t.notes?.slice(0,20)||""}`;
      if(!byLot[key])byLot[key]={status:t.lotStatus,eta:t.lotEta,label:t.notes||"",qty:0};
      byLot[key].qty+=t.qty;
    });
    return Object.values(byLot).sort((a,b)=>(a.eta||"9999").localeCompare(b.eta||"9999"));
  },[txs]);

  const TxItem=({t})=>{
    const p=getProd(t.productId);const c=getClient(t.clientId);
    return <Card sx={{marginBottom:10}}>
      <div style={R.rowB}>
        <div style={{...R.row,gap:12,flex:1,minWidth:0}}>
          <div style={{width:44,height:44,borderRadius:13,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:t.type==="sale"?"var(--bg-pos)":"var(--bg-war)"}}>
            <i className={`ti ${t.type==="sale"?"ti-trending-up":"ti-trending-down"}`} style={{fontSize:22,color:t.type==="sale"?"var(--c-pos)":"var(--c-war)"}} aria-hidden/>
          </div>
          <div style={{minWidth:0}}>
            <div style={{fontSize:14,fontWeight:700,color:"var(--c-pri)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:160}}>{p?.name||"Logística"}</div>
            <div style={{fontSize:12,color:"var(--c-sec)"}}>
              {t.qty} u. · {fmtS(t.date)}{t.time?` ${t.time}`:""}
              {c?` · ${c.name}`:t.notes?` · ${t.notes.slice(0,30)}`:""}{t.discount>0&&<span style={{marginLeft:5}}><Badge v="info" sm>-{t.discount}%</Badge></span>}
              {t.type==="purchase"&&t.lotStatus&&<span style={{marginLeft:5}}><Badge sm v={t.lotStatus==="en_mano"?"positive":t.lotStatus==="transito_avion"?"info":"warning"}>{LOT_LABELS[t.lotStatus]||t.lotStatus}</Badge></span>}
              {t.invoiceId&&<span style={{marginLeft:5}}><Badge sm v="brand" icon="ti-receipt">Facturada</Badge></span>}
            </div>
          </div>
        </div>
        <div style={{textAlign:"right",flexShrink:0,marginLeft:8}}>
          <div style={{fontWeight:800,color:t.type==="sale"?"var(--c-pos)":"var(--c-war)",fontSize:15}}>{C$S(t.total)}</div>
          {t.type==="sale"&&p&&<div style={{fontSize:11,color:"var(--c-ter)"}}>gan. {C$S(t.unitPrice-p.buyPrice)}/u</div>}
        </div>
      </div>
      <div style={{...R.row,gap:6,marginTop:10,paddingTop:8,borderTop:"0.5px solid var(--brd3)"}}>
        {t.invoiceId&&<Btn onClick={()=>{const inv=invoices.find(i=>i.id===t.invoiceId);if(inv)setActiveInvoice(inv);}} v="ghost-brand" sm icon="ti-receipt" sx={{flex:1}}>Ver factura</Btn>}
        <Btn onClick={()=>go({name:t.type==="sale"?"edit-sale":"edit-purchase",data:t})} v="ghost" sm icon="ti-edit" sx={{flex:1}}>Editar</Btn>
        <Btn onClick={()=>setDeleteTxConf(t)} v="ghost-dan" sm icon="ti-trash" sx={{flex:1}}>Eliminar</Btn>
      </div>
    </Card>;
  };

  return <div>
    <style>{`@keyframes slideDown{from{opacity:0;transform:translateX(-50%) translateY(-14px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>

    {catMgr&&<CategoryManager categories={categories} onSave={saveCategories} onClose={()=>setCatMgr(false)}/>}
    {bizModal&&<BizSettingsModal biz={bizSettings} onSave={b=>{setBizSettings(b);setBizModal(false);showToast("Datos del negocio guardados ✓");}} onClose={()=>setBizModal(false)}/>}
    {activeInvoice&&<InvoiceView invoice={activeInvoice} biz={bizSettings} onClose={()=>setActiveInvoice(null)}/>}
    {resetConf&&<ConfirmModal title="¿Restablecer datos?" msg="Volver a los datos originales. No se puede deshacer." onConfirm={()=>{setProducts(SEED_PRODUCTS);setTxs(SEED_TXS);setClients(SEED_CLIENTS);setCategories(SEED_CATS);setInvoices([]);setInvoiceCounter(1);setResetConf(false);showToast("Datos restablecidos");}} onCancel={()=>setResetConf(false)}/>}
    {deleteTxConf&&<ConfirmModal title={`¿Eliminar ${deleteTxConf.type==="sale"?"venta":"compra"}?`} msg={`Se eliminará este movimiento de ${C$S(deleteTxConf.total)} y el stock se ajustará automáticamente.`} onConfirm={()=>deleteTx(deleteTxConf)} onCancel={()=>setDeleteTxConf(null)}/>}
    <Toast toast={toast}/>

    {/* HEADER */}
    <div style={{background:"linear-gradient(160deg,#0f0f0f 0%,#1a0a00 100%)",paddingTop:"calc(16px + env(safe-area-inset-top,0px))"}}>
      <div style={{...R.rowB,padding:"0 20px 16px"}}>
        <div style={{...R.row,gap:12}}>
          <div style={{width:40,height:40,borderRadius:12,background:"var(--brand)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 20px var(--brand-glow)"}}>
            <i className="ti ti-storm" style={{fontSize:24,color:"#fff"}} aria-hidden/>
          </div>
          <div>
            <div style={{fontSize:22,fontWeight:900,color:"#fff",letterSpacing:"-0.5px"}}>{bizSettings.name||"Vortex"}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>Control de inventario</div>
          </div>
        </div>
        <div style={{...R.row,gap:8}}>
          <IconBtn onClick={exportCSV} icon="ti-download" sx={{background:"rgba(255,255,255,0.1)",color:"#fff"}}/>
          <IconBtn onClick={()=>setQuick(q=>!q)} icon={quickOpen?"ti-x":"ti-plus"} sx={{background:"var(--brand)",color:"#fff",boxShadow:"0 4px 12px var(--brand-glow)"}}/>
        </div>
      </div>
      {quickOpen&&<div style={{margin:"0 16px 16px",background:"rgba(255,255,255,0.06)",borderRadius:16,padding:14,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {[["Nueva venta","ti-receipt","var(--c-pos)","add-sale"],["Nueva compra","ti-package","var(--c-war)","add-purchase"],["Nuevo producto","ti-plus","var(--c-inf)","add-product"],["Nuevo cliente","ti-user-plus","var(--brand)","add-client"]].map(([l,ic,col,vn])=>(
          <button key={l} onClick={()=>go({name:vn})} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:12,background:"rgba(255,255,255,0.07)",border:"none",cursor:"pointer",color:"#fff",fontSize:13,fontWeight:600,fontFamily:"inherit"}}>
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
          <StatCard label="Ganancia"  value={C$S(stats.profit)}   sub="Realizada hasta hoy"             icon="ti-trending-up" color="brand"/>
          <StatCard label="Potencial" value={C$S(stats.invValue)} sub={`${stats.units} u. × precio venta`} icon="ti-coin"     color="positive"/>
          <StatCard label="Invertido" value={C$S(stats.invested)} sub="Total pagado"                    icon="ti-package"     color="warning"/>
          <StatCard label="Ventas"    value={C$S(stats.revenue)}  sub={`${stats.saleCnt} transac.`}     icon="ti-cash"        color="info"/>
        </div>

        {/* Trend chart */}
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

        {/* Transit lotes (dinámico desde TXs) */}
        {transitLots.length>0&&<Card sx={{borderColor:"var(--c-inf)",marginBottom:20}}>
          <SectionLabel text="📦 Lotes en tránsito"/>
          {transitLots.map((lot,i)=>(
            <div key={i} style={{...R.row,gap:10,padding:"9px 0",borderTop:i>0?"0.5px solid var(--brd3)":"none"}}>
              <span style={{fontSize:18}}>{lot.status==="transito_avion"?"✈":"🚢"}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:"var(--c-pri)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{lot.label||lot.status}</div>
                <div style={{fontSize:12,color:"var(--c-sec)"}}>{lot.qty} unidades{lot.eta?` · ETA ${fmtS(lot.eta)}`:""}</div>
              </div>
              <Badge sm v={lot.status==="transito_avion"?"info":"warning"}>{lot.status==="transito_avion"?"Avión":"Barco"}</Badge>
            </div>
          ))}
        </Card>}

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

        {/* Top products */}
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
          <button onClick={()=>setTab("moves")} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:"var(--brand)",fontFamily:"inherit",fontWeight:700}}>Ver todo →</button>}/>
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
          {allCats.map(c=><button key={c} onClick={()=>setCat(c)} style={{padding:"6px 14px",borderRadius:99,fontSize:13,fontWeight:600,border:"1.5px solid",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",borderColor:catFilter===c?"var(--brand)":"var(--brd2)",background:catFilter===c?"var(--brand)":"transparent",color:catFilter===c?"#fff":"var(--c-sec)"}}>{c}</button>)}
          <button onClick={()=>setCatMgr(true)} style={{padding:"6px 12px",borderRadius:99,fontSize:13,fontWeight:600,border:"1.5px dashed var(--brd2)",cursor:"pointer",fontFamily:"inherit",background:"transparent",color:"var(--c-ter)",whiteSpace:"nowrap",flexShrink:0}}>
            <i className="ti ti-settings" style={{fontSize:13}} aria-hidden/> Gestionar
          </button>
        </div>
        <div style={{...R.row,gap:6,marginBottom:14,flexWrap:"wrap"}}>
          {[["all","Todos"],["in","En stock"],["low","Bajo"],["out","Sin stock"]].map(([v,l])=>(
            <button key={v} onClick={()=>setStockF(v)} style={{padding:"5px 12px",borderRadius:99,fontSize:12,fontWeight:700,border:"1px solid",cursor:"pointer",fontFamily:"inherit",borderColor:stockF===v?"var(--c-pri)":"var(--brd2)",background:stockF===v?"var(--c-pri)":"transparent",color:stockF===v?"var(--bg1)":"var(--c-sec)"}}>{l}</button>
          ))}
          <span style={{fontSize:12,color:"var(--c-ter)",alignSelf:"center",marginLeft:"auto"}}>{filtProds.length} productos</span>
        </div>
        {filtProds.length===0&&<Empty icon="ti-box-off" title="Sin resultados" text={products.length===0?"Agrega tu primer producto":"Prueba otro filtro"} action={products.length===0&&<Btn onClick={()=>go({name:"add-product"})} v="brand" icon="ti-plus">Agregar producto</Btn>}/>}
        {filtProds.map(p=>{
          // Compute WAC for each product
          const pTxs=txs.filter(t=>t.type==="purchase"&&t.productId===p.id);
          const pQty=pTxs.reduce((s,t)=>s+t.qty,0);
          const pCost=pTxs.reduce((s,t)=>s+t.total,0);
          const wac=pQty>0?Math.round(pCost/pQty):p.buyPrice;
          // Lot status summary
          const inT=pTxs.filter(t=>t.lotStatus&&t.lotStatus!=="en_mano").reduce((s,t)=>s+t.qty,0);
          return <Card key={p.id} onClick={()=>go({name:"product-detail",data:p})} shadow>
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
                    {inT>0&&<Badge v="info" sm>✈ {inT} en tránsito</Badge>}
                  </div>
                </div>
              </div>
              <StockBadge stock={p.stock} min={+(p.minStock)||2}/>
            </div>
            <ProgressBar val={p.stock} max={Math.max(p.stock+3,10)} color={p.stock===0?"var(--c-dan)":p.stock<=(+(p.minStock)||2)?"var(--c-war)":"var(--c-pos)"}/>
            <div style={{...R.rowB,marginTop:10}}>
              <div style={{display:"flex",gap:12,fontSize:13,flexWrap:"wrap"}}>
                <span style={{color:"var(--c-sec)"}}>WAC: <strong style={{color:"var(--c-war)"}}>{C$S(wac)}</strong></span>
                <span style={{color:"var(--c-sec)"}}>Venta: <strong style={{color:"var(--c-pos)"}}>{C$S(p.sellPrice)}</strong></span>
                <span style={{color:"var(--c-sec)"}}>Margen: <strong style={{color:"var(--brand)"}}>{C$S(p.sellPrice-wac)}</strong></span>
              </div>
              <div style={{display:"flex",gap:6}} onClick={e=>e.stopPropagation()}>
                <IconBtn onClick={()=>go({name:"add-sale",data:{pid:p.id}})}     icon="ti-receipt" sx={{background:"var(--bg-pos)",color:"var(--c-pos)"}} size={30}/>
                <IconBtn onClick={()=>go({name:"add-purchase",data:{pid:p.id}})} icon="ti-package" sx={{background:"var(--bg-war)",color:"var(--c-war)"}} size={30}/>
                <IconBtn onClick={()=>go({name:"edit-product",data:p})}          icon="ti-edit"    size={30}/>
              </div>
            </div>
          </Card>;
        })}
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
        <div style={{display:"flex",background:"var(--bg2)",borderRadius:12,padding:4,marginBottom:14}}>
          {[["sales","Ventas"],["purchases","Compras"]].map(([v,l])=>(
            <button key={v} onClick={()=>setMvTab(v)} style={{flex:1,padding:"9px",borderRadius:9,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:700,background:mvTab===v?"var(--bg1)":"transparent",color:mvTab===v?"var(--c-pri)":"var(--c-sec)",boxShadow:mvTab===v?"0 2px 10px rgba(0,0,0,0.1)":"none"}}>{l}</button>
          ))}
        </div>
        <div style={{position:"relative",marginBottom:14}}>
          <input value={mvSearch} onChange={e=>setMvSearch(e.target.value)} placeholder="Buscar producto, cliente, notas…" style={{width:"100%",paddingLeft:36}}/>
          <i className="ti ti-search" style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:"var(--c-ter)",fontSize:16,pointerEvents:"none"}} aria-hidden/>
          {mvSearch&&<button onClick={()=>setMvSearch("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--c-ter)",display:"flex"}}><i className="ti ti-x" aria-hidden/></button>}
        </div>
        {mvList.length===0&&<Empty icon={mvTab==="sales"?"ti-receipt-off":"ti-shopping-cart-off"} title="Sin registros" text={mvSearch?`Sin resultados para "${mvSearch}"`:`No hay ${mvTab==="sales"?"ventas":"compras"} registradas`}/>}
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
          <div><div style={{...R.label,marginBottom:2}}>Directorio</div><div style={{fontSize:24,fontWeight:800,color:"var(--c-pri)"}}>{clients.length} cliente{clients.length!==1?"s":""}</div></div>
          <Btn onClick={()=>go({name:"add-client"})} v="brand" icon="ti-user-plus">Nuevo</Btn>
        </div>
        {clients.length===0&&<Empty icon="ti-users" title="Sin clientes aún" text="Agrega tus clientes para mejor control de ventas" action={<Btn onClick={()=>go({name:"add-client"})} v="brand" icon="ti-user-plus">Agregar cliente</Btn>}/>}
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
        const potential=products.reduce((s,p)=>s+p.sellPrice*p.stock,0);
        const potProfit=products.reduce((s,p)=>s+(p.sellPrice-p.buyPrice)*p.stock,0);
        const n=new Date();
        const monthly=Array.from({length:6},(_,i)=>{const d=new Date(n);d.setMonth(d.getMonth()-5+i);const m=d.getMonth(),y=d.getFullYear();const mTxs=txs.filter(t=>t.type==="sale"&&new Date(t.date+"T12:00").getMonth()===m&&new Date(t.date+"T12:00").getFullYear()===y);return{label:`${MONTHS[m]} ${y}`,rev:mTxs.reduce((s,t)=>s+t.total,0),cnt:mTxs.length};}).reverse();
        return <>
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
              <div style={R.surf}><div style={{...R.label,marginBottom:4}}>Ganancia potencial</div><div style={{fontSize:18,fontWeight:800,color:"var(--brand)"}}>{C$S(potProfit)}</div><div style={{fontSize:11,color:"var(--c-ter)"}}>sobre costo landed</div></div>
            </div>
          </Card>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            <StatCard label="Margen bruto"     value={`${gPct}%`}         icon="ti-percentage"  color="brand"/>
            <StatCard label="ROI"              value={`${roi}%`}          icon="ti-trending-up"  color={+roi>=0?"positive":"neutral"}/>
            <StatCard label="Ticket promedio"  value={C$S(avgTk)}         icon="ti-receipt"      color="info"/>
            <StatCard label="Costo inventario" value={C$S(stats.costValue)} icon="ti-box"        color="warning"/>
          </div>

          <Card shadow sx={{marginBottom:16}}>
            <SectionLabel text="Ganancia por producto"/>
            {sold.length===0&&<Empty icon="ti-chart-bar" text="Sin ventas registradas"/>}
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

          <Card shadow sx={{marginBottom:16}}>
            <SectionLabel text="Ventas por mes (últimos 6)"/>
            {monthly.map((m,i)=>(
              <div key={i} style={{...R.rowB,padding:"9px 0",borderTop:i>0?"0.5px solid var(--brd3)":"none"}}>
                <div><div style={{fontSize:14,fontWeight:600,color:"var(--c-pri)"}}>{m.label}</div><div style={{fontSize:11,color:"var(--c-ter)"}}>{m.cnt} transacciones</div></div>
                <div style={{fontSize:15,fontWeight:800,color:m.rev>0?"var(--c-pos)":"var(--c-ter)"}}>{C$S(m.rev)}</div>
              </div>
            ))}
          </Card>

          {/* Facturas */}
          {invoices.length>0&&<Card shadow sx={{marginBottom:16}}>
            <SectionLabel text={`📄 Facturas emitidas (${invoices.length})`}/>
            {invoices.slice(0,8).map(inv=>(
              <div key={inv.id} style={{...R.rowB,padding:"9px 0",borderTop:"0.5px solid var(--brd3)",cursor:"pointer"}} onClick={()=>setActiveInvoice(inv)}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:"var(--brand)"}}>N° F-{padN(inv.number)}</div>
                  <div style={{fontSize:12,color:"var(--c-sec)"}}>{fmtS(inv.date)}{inv.clientName?` · ${inv.clientName}`:""}</div>
                </div>
                <div style={{...R.row,gap:8}}>
                  <span style={{fontSize:14,fontWeight:800,color:"var(--c-pos)"}}>{C$S(inv.total)}</span>
                  <i className="ti ti-chevron-right" style={{color:"var(--c-ter)",fontSize:16}} aria-hidden/>
                </div>
              </div>
            ))}
          </Card>}

          {/* Settings zone */}
          <Card sx={{borderColor:"var(--brd2)"}}>
            <SectionLabel text="⚙ Configuración y datos"/>
            <div style={{...R.col,gap:10}}>
              <Btn onClick={()=>setBizModal(true)} full icon="ti-building-store">Datos del negocio (facturas)</Btn>
              <Btn onClick={exportCSV} full lg icon="ti-file-spreadsheet">Exportar reporte CSV</Btn>
              <Btn onClick={()=>setResetConf(true)} v="ghost-dan" full icon="ti-refresh">Restablecer datos iniciales</Btn>
            </div>
          </Card>
        </>;
      })()}
    </div>
  </div>;
}
