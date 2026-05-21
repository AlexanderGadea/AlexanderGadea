import { useState, useMemo, useEffect, useCallback } from "react";

// ─── PERSISTENCE ─────────────────────────────────────────────────
function usePersist(key, init) {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : init;
    } catch { return init; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
  }, [key, state]);
  return [state, setState];
}

// ─── CONSTANTS & HELPERS ─────────────────────────────────────────
const INIT_PRODUCTS = [
  { id: 1, name: "Fire TV Stick 4K Max", sku: "FTV-4KM", buyPrice: 38, sellPrice: 65, stock: 5, notes: "Gen 2, Alexa Voice Remote Pro", minStock: 2 },
  { id: 2, name: "Fire TV Stick Lite",   sku: "FTV-LITE", buyPrice: 20, sellPrice: 38, stock: 8, notes: "Edición compacta 2022", minStock: 3 },
  { id: 3, name: "Fire TV Stick 4K",     sku: "FTV-4K",   buyPrice: 28, sellPrice: 50, stock: 1, notes: "Soporte 4K Ultra HD",  minStock: 2 },
  { id: 4, name: "Fire TV Cube",         sku: "FTV-CUBE", buyPrice: 95, sellPrice: 140,stock: 0, notes: "Control manos libres", minStock: 1 },
];
const INIT_TXS = [
  { id: 1, type: "purchase", productId: 1, qty: 5, unitPrice: 38,  total: 190, date: "2025-04-15", notes: "Proveedor Amazon US" },
  { id: 2, type: "purchase", productId: 2, qty: 8, unitPrice: 20,  total: 160, date: "2025-04-15", notes: "" },
  { id: 3, type: "purchase", productId: 3, qty: 3, unitPrice: 28,  total: 84,  date: "2025-04-20", notes: "" },
  { id: 4, type: "purchase", productId: 4, qty: 2, unitPrice: 95,  total: 190, date: "2025-04-22", notes: "" },
  { id: 5, type: "sale",     productId: 1, qty: 2, unitPrice: 65,  total: 130, date: "2025-05-02", notes: "Cliente: Marcos L." },
  { id: 6, type: "sale",     productId: 2, qty: 3, unitPrice: 38,  total: 114, date: "2025-05-05", notes: "Cliente: Sofía R." },
  { id: 7, type: "sale",     productId: 4, qty: 2, unitPrice: 140, total: 280, date: "2025-05-08", notes: "Cliente: TechNica S.A." },
  { id: 8, type: "sale",     productId: 3, qty: 2, unitPrice: 50,  total: 100, date: "2025-05-12", notes: "" },
  { id: 9, type: "sale",     productId: 2, qty: 2, unitPrice: 38,  total: 76,  date: "2025-05-14", notes: "Cliente: Pedro M." },
  { id:10, type: "purchase", productId: 2, qty: 5, unitPrice: 20,  total: 100, date: "2025-05-15", notes: "Restock" },
];

const USD     = n => `$${(+n||0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const todayISO= () => new Date().toISOString().split("T")[0];
const fmt     = d  => new Date(d+"T12:00").toLocaleDateString("es-NI",{day:"2-digit",month:"short",year:"numeric"});
const fmtShort= d  => new Date(d+"T12:00").toLocaleDateString("es-NI",{day:"2-digit",month:"short"});
const uid     = () => Date.now() + Math.floor(Math.random()*9999);

// ─── DESIGN TOKENS ───────────────────────────────────────────────
const CARD  = { background:"var(--bg1)",border:"0.5px solid var(--brd3)",borderRadius:"var(--r-lg)",padding:"1rem 1.25rem",marginBottom:10 };
const SURF  = { background:"var(--bg2)",borderRadius:"var(--r-md)",padding:"0.875rem 1rem" };
const ROW   = { display:"flex",alignItems:"center",justifyContent:"space-between" };
const COL   = { display:"flex",flexDirection:"column" };
const LABEL = { fontSize:11,color:"var(--c-sec)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4,fontWeight:500 };

const VAR = {
  success: ["var(--bg-suc)","var(--c-suc)"],
  warning: ["var(--bg-war)","var(--c-war)"],
  danger:  ["var(--bg-dan)","var(--c-dan)"],
  info:    ["var(--bg-inf)","var(--c-inf)"],
  neutral: ["var(--bg2)",   "var(--c-pri)"],
  solid:   ["var(--c-pri)", "var(--bg1)"],
};

// ─── PRIMITIVES ──────────────────────────────────────────────────
function Badge({v="neutral", icon, children}) {
  const [bg,tc] = VAR[v]||VAR.neutral;
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"3px 10px",
      borderRadius:"var(--r-md)",fontSize:12,fontWeight:500,background:bg,color:tc,whiteSpace:"nowrap"}}>
      {icon && <i className={`ti ${icon}`} style={{fontSize:12}} aria-hidden/>}
      {children}
    </span>
  );
}

function Btn({onClick,v="default",full,sm,children,sx={},disabled}) {
  const defs = {
    default:{ bg:"transparent", bo:"0.5px solid var(--brd2)", tc:"var(--c-pri)" },
    success:{ bg:"var(--bg-suc)", bo:"none", tc:"var(--c-suc)" },
    warning:{ bg:"var(--bg-war)", bo:"none", tc:"var(--c-war)" },
    danger: { bg:"var(--bg-dan)", bo:"none", tc:"var(--c-dan)" },
    info:   { bg:"var(--bg-inf)", bo:"none", tc:"var(--c-inf)" },
    solid:  { bg:"var(--c-pri)",  bo:"none", tc:"var(--bg1)"  },
  };
  const { bg, bo, tc } = defs[v]||defs.default;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,
      padding: sm ? "6px 12px" : "9px 18px",
      borderRadius:"var(--r-md)",fontWeight:500,fontSize:sm?13:14,
      cursor: disabled ? "not-allowed" : "pointer",
      fontFamily:"inherit",background:bg,border:bo,color:tc,
      width: full ? "100%" : "auto",
      opacity: disabled ? 0.5 : 1,
      ...sx
    }}>{children}</button>
  );
}

function Field({label, error, children}) {
  return (
    <label style={{...COL,gap:5}}>
      <span style={{fontSize:13,color:"var(--c-sec)",fontWeight:500}}>{label}</span>
      {children}
      {error && <span style={{fontSize:12,color:"var(--c-dan)"}}>{error}</span>}
    </label>
  );
}

function Metric({label,value,sub,icon,v="neutral"}) {
  const [bg,tc] = VAR[v]||VAR.neutral;
  return (
    <div style={{background:bg,borderRadius:"var(--r-md)",padding:"1rem"}}>
      <div style={{...ROW,marginBottom:8}}>
        <span style={{...LABEL,marginBottom:0}}>{label}</span>
        <i className={`ti ${icon}`} style={{fontSize:18,color:tc}} aria-hidden/>
      </div>
      <div style={{fontSize:22,fontWeight:500,color:tc,fontVariantNumeric:"tabular-nums"}}>{value}</div>
      {sub && <div style={{fontSize:12,color:"var(--c-sec)",marginTop:2}}>{sub}</div>}
    </div>
  );
}

function StockBadge({stock, min=2}) {
  if (stock === 0)   return <Badge v="danger"  icon="ti-alert-circle">Sin stock</Badge>;
  if (stock <= min)  return <Badge v="warning" icon="ti-alert-triangle">{stock} u.</Badge>;
  return <Badge v="success">{stock} u.</Badge>;
}

function StockBar({stock, max=10}) {
  const w   = Math.min(100, max>0 ? (stock/max)*100 : 0);
  const col = stock===0 ? "var(--c-dan)" : stock<=2 ? "var(--c-war)" : "var(--c-suc)";
  return (
    <div style={{height:4,background:"var(--brd3)",borderRadius:2,overflow:"hidden",margin:"8px 0"}}>
      <div style={{height:"100%",width:w+"%",background:col,borderRadius:2}}/>
    </div>
  );
}

function SectionTitle({text, action}) {
  return (
    <div style={{...ROW,marginBottom:12}}>
      <span style={{fontSize:11,fontWeight:500,color:"var(--c-sec)",textTransform:"uppercase",letterSpacing:"0.07em"}}>{text}</span>
      {action}
    </div>
  );
}

function BackHeader({title, sub, onBack, action}) {
  return (
    <div style={{...ROW,marginBottom:20,paddingBottom:16,borderBottom:"0.5px solid var(--brd3)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",color:"var(--c-pri)",display:"flex",padding:4}}>
          <i className="ti ti-arrow-left" style={{fontSize:22}} aria-hidden/>
        </button>
        <div>
          <div style={{fontSize:17,fontWeight:500,color:"var(--c-pri)"}}>{title}</div>
          {sub && <div style={{fontSize:12,color:"var(--c-sec)"}}>{sub}</div>}
        </div>
      </div>
      {action}
    </div>
  );
}

function Empty({icon, text, action}) {
  return (
    <div style={{textAlign:"center",padding:"52px 0",color:"var(--c-sec)"}}>
      <i className={`ti ${icon}`} style={{fontSize:40,display:"block",marginBottom:10,opacity:0.3}} aria-hidden/>
      <div style={{fontSize:14,marginBottom:action?16:0}}>{text}</div>
      {action}
    </div>
  );
}

function Divider({my=8}) {
  return <div style={{height:"0.5px",background:"var(--brd3)",margin:`${my}px 0`}}/>;
}

function Toast({toast}) {
  if (!toast) return null;
  const ok = toast.type !== "err";
  return (
    <div style={{margin:"0 16px 8px",display:"flex",alignItems:"center",gap:8,padding:"10px 16px",
      borderRadius:"var(--r-md)",fontSize:14,fontWeight:500,
      background: ok ? "var(--bg-suc)" : "var(--bg-dan)",
      color: ok ? "var(--c-suc)" : "var(--c-dan)"}}>
      <i className={`ti ${ok?"ti-circle-check":"ti-alert-circle"}`} aria-hidden/>
      {toast.msg}
    </div>
  );
}

function ConfirmModal({title, msg, onConfirm, onCancel, danger=true}) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:24}}>
      <div style={{...CARD,marginBottom:0,width:"100%",maxWidth:360,textAlign:"center",padding:"2rem 1.5rem"}}>
        <div style={{width:56,height:56,borderRadius:"50%",background:danger?"var(--bg-dan)":"var(--bg-war)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
          <i className={`ti ${danger?"ti-trash":"ti-alert-triangle"}`} style={{fontSize:26,color:danger?"var(--c-dan)":"var(--c-war)"}} aria-hidden/>
        </div>
        <div style={{fontSize:17,fontWeight:500,marginBottom:8,color:"var(--c-pri)"}}>{title}</div>
        <div style={{fontSize:14,color:"var(--c-sec)",marginBottom:24}}>{msg}</div>
        <div style={{display:"flex",gap:10}}>
          <Btn onClick={onCancel} full>Cancelar</Btn>
          <Btn onClick={onConfirm} v={danger?"danger":"warning"} full>Confirmar</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── PRODUCT FORM ────────────────────────────────────────────────
function ProductForm({product, onSave, onDelete, onBack}) {
  const isEdit = !!product?.id;
  const [f, setF] = useState(product || {name:"",sku:"",buyPrice:"",sellPrice:"",stock:"0",notes:"",minStock:"2"});
  const [errors, setErrors] = useState({});
  const [confirm, setConfirm] = useState(false);
  const set = k => e => setF(p => ({...p, [k]: e.target.value}));

  const margin    = f.sellPrice && f.buyPrice ? +f.sellPrice - +f.buyPrice : null;
  const marginPct = margin !== null && +f.sellPrice > 0 ? ((margin/+f.sellPrice)*100).toFixed(1) : null;

  const validate = () => {
    const e = {};
    if (!f.name)       e.name = "El nombre es requerido";
    if (!f.buyPrice)   e.buyPrice = "Requerido";
    if (!f.sellPrice)  e.sellPrice = "Requerido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => { if (validate()) onSave(f); };

  return (
    <div style={{padding:16}}>
      {confirm && (
        <ConfirmModal
          title="¿Eliminar producto?"
          msg={`Se eliminará "${f.name}" y todo su historial. Esta acción no se puede deshacer.`}
          onConfirm={() => onDelete(f.id)}
          onCancel={() => setConfirm(false)}
        />
      )}
      <BackHeader
        title={isEdit ? "Editar producto" : "Nuevo producto"}
        sub={isEdit ? f.sku || "Sin SKU" : null}
        onBack={onBack}
        action={<Btn onClick={handleSave} v="solid" sm><i className="ti ti-check" aria-hidden/> Guardar</Btn>}
      />

      <div style={{...COL, gap:14}}>
        <Field label="Nombre del producto *" error={errors.name}>
          <input value={f.name} onChange={set("name")} placeholder="Fire TV Stick 4K Max" style={{width:"100%",borderColor:errors.name?"var(--c-dan)":""}}/>
        </Field>

        <Field label="SKU / Código interno">
          <input value={f.sku} onChange={set("sku")} placeholder="FTV-4KM" style={{width:"100%"}}/>
        </Field>

        <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12}}>
          <Field label="Precio compra ($) *" error={errors.buyPrice}>
            <input type="number" min="0" step="0.01" value={f.buyPrice} onChange={set("buyPrice")} placeholder="0.00" style={{width:"100%",borderColor:errors.buyPrice?"var(--c-dan)":""}}/>
          </Field>
          <Field label="Precio venta ($) *" error={errors.sellPrice}>
            <input type="number" min="0" step="0.01" value={f.sellPrice} onChange={set("sellPrice")} placeholder="0.00" style={{width:"100%",borderColor:errors.sellPrice?"var(--c-dan)":""}}/>
          </Field>
        </div>

        {margin !== null && (
          <div style={{...SURF,...ROW}}>
            <span style={{fontSize:13,color:"var(--c-sec)"}}>Margen estimado por unidad</span>
            <div>
              <span style={{fontWeight:500,color:margin>=0?"var(--c-suc)":"var(--c-dan)"}}>{USD(margin)}</span>
              <span style={{fontSize:12,color:"var(--c-sec)",marginLeft:6}}>({marginPct}%)</span>
            </div>
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12}}>
          <Field label="Stock actual">
            <input type="number" min="0" value={f.stock} onChange={set("stock")} style={{width:"100%"}}/>
          </Field>
          <Field label="Mínimo para alerta">
            <input type="number" min="0" value={f.minStock} onChange={set("minStock")} placeholder="2" style={{width:"100%"}}/>
          </Field>
        </div>

        <Field label="Notas / Descripción">
          <textarea value={f.notes} onChange={set("notes")} rows={3}
            placeholder="Variante, generación, características…"
            style={{width:"100%",resize:"vertical",fontFamily:"inherit"}}/>
        </Field>

        {isEdit && <>
          <Divider my={4}/>
          <Btn onClick={() => setConfirm(true)} v="danger" full sx={{padding:12}}>
            <i className="ti ti-trash" aria-hidden/> Eliminar producto
          </Btn>
        </>}
      </div>
    </div>
  );
}

// ─── SALE FORM ───────────────────────────────────────────────────
function SaleForm({products, initProductId, onSave, onBack}) {
  const defProd = products.find(p => p.id === initProductId) || products.find(p => p.stock > 0) || products[0];
  const [f, setF] = useState({productId:defProd?.id||"",qty:"1",unitPrice:defProd?.sellPrice||"",discount:"0",date:todayISO(),notes:""});
  const [errors, setErrors] = useState({});
  const set = k => e => setF(p => ({...p,[k]:e.target.value}));

  const changeProd = e => {
    const p = products.find(x => x.id === +e.target.value);
    setF(pv => ({...pv, productId: e.target.value, unitPrice: p?.sellPrice||""}));
  };

  const prod    = products.find(p => p.id === +f.productId);
  const disc    = Math.min(+(f.discount)||0, 100);
  const priceAfterDisc = (+f.unitPrice||0) * (1 - disc/100);
  const total   = priceAfterDisc * (+f.qty||0);
  const gain    = prod ? (priceAfterDisc - prod.buyPrice) * (+f.qty||0) : null;

  const validate = () => {
    const e = {};
    if (!f.productId)                e.productId = "Selecciona un producto";
    if (!+f.qty || +f.qty <= 0)      e.qty = "Cantidad inválida";
    if (!+f.unitPrice)               e.unitPrice = "Ingresa el precio";
    if (prod && +f.qty > prod.stock) e.qty = `Solo hay ${prod.stock} u. en stock`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div style={{padding:16}}>
      <BackHeader title="Registrar venta" onBack={onBack}
        action={<Btn onClick={()=>{if(validate())onSave({...f,discount:disc})}} v="success" sm>
          <i className="ti ti-check" aria-hidden/> Registrar
        </Btn>}
      />
      <div style={{...COL,gap:14}}>
        <Field label="Producto" error={errors.productId}>
          <select value={f.productId} onChange={changeProd}
            style={{width:"100%",fontFamily:"inherit",borderColor:errors.productId?"var(--c-dan)":""}}>
            <option value="">— Seleccionar producto —</option>
            {products.map(p => (
              <option key={p.id} value={p.id} disabled={p.stock===0}>
                {p.name} {p.stock===0?"(sin stock)":`(stock: ${p.stock})`}
              </option>
            ))}
          </select>
        </Field>

        {prod && (
          <div style={{...SURF,display:"flex",flexWrap:"wrap",gap:"6px 20px",fontSize:13}}>
            <span style={{color:"var(--c-sec)"}}>Sugerido: <strong style={{color:"var(--c-suc)"}}>{USD(prod.sellPrice)}</strong></span>
            <span style={{color:"var(--c-sec)"}}>Stock: <strong>{prod.stock} u.</strong></span>
            <span style={{color:"var(--c-sec)"}}>Comprado en: <strong style={{color:"var(--c-dan)"}}>{USD(prod.buyPrice)}</strong></span>
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12}}>
          <Field label="Cantidad" error={errors.qty}>
            <input type="number" min="1" value={f.qty} onChange={set("qty")}
              style={{width:"100%",borderColor:errors.qty?"var(--c-dan)":""}}/>
          </Field>
          <Field label="Precio de venta ($)" error={errors.unitPrice}>
            <input type="number" min="0" step="0.01" value={f.unitPrice} onChange={set("unitPrice")}
              style={{width:"100%",borderColor:errors.unitPrice?"var(--c-dan)":""}}/>
          </Field>
        </div>

        <Field label={`Descuento (%) ${disc>0?`→ Precio final: ${USD(priceAfterDisc)}/u`:""}`}>
          <input type="number" min="0" max="100" value={f.discount} onChange={set("discount")} style={{width:"100%"}}/>
        </Field>

        <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12}}>
          <Field label="Fecha"><input type="date" value={f.date} onChange={set("date")} style={{width:"100%"}}/></Field>
          <Field label="Cliente / Notas"><input value={f.notes} onChange={set("notes")} placeholder="Nombre del cliente" style={{width:"100%"}}/></Field>
        </div>

        {total > 0 && (
          <div style={{...CARD,marginBottom:0}}>
            <div style={{...ROW,marginBottom:8}}>
              <span style={{fontSize:14,color:"var(--c-sec)"}}>Total de venta</span>
              <span style={{fontSize:30,fontWeight:500,color:"var(--c-suc)"}}>{USD(total)}</span>
            </div>
            {gain !== null && (
              <div style={{...ROW,paddingTop:8,borderTop:"0.5px solid var(--brd3)"}}>
                <span style={{fontSize:13,color:"var(--c-sec)"}}>Ganancia estimada</span>
                <span style={{fontSize:15,fontWeight:500,color:gain>=0?"var(--c-suc)":"var(--c-dan)"}}>{USD(gain)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PURCHASE FORM ───────────────────────────────────────────────
function PurchaseForm({products, initProductId, onSave, onBack}) {
  const defProd = products.find(p => p.id === initProductId) || products[0];
  const [f, setF] = useState({productId:defProd?.id||"",qty:"1",unitPrice:defProd?.buyPrice||"",date:todayISO(),notes:""});
  const [errors, setErrors] = useState({});
  const set = k => e => setF(p => ({...p,[k]:e.target.value}));

  const changeProd = e => {
    const p = products.find(x => x.id === +e.target.value);
    setF(pv => ({...pv, productId: e.target.value, unitPrice: p?.buyPrice||""}));
  };

  const prod  = products.find(p => p.id === +f.productId);
  const total = (+f.unitPrice||0) * (+f.qty||0);

  const validate = () => {
    const e = {};
    if (!f.productId)           e.productId = "Selecciona un producto";
    if (!+f.qty || +f.qty <= 0) e.qty = "Cantidad inválida";
    if (!+f.unitPrice)          e.unitPrice = "Ingresa el precio";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div style={{padding:16}}>
      <BackHeader title="Registrar compra" onBack={onBack}
        action={<Btn onClick={()=>{if(validate())onSave(f)}} v="warning" sm>
          <i className="ti ti-check" aria-hidden/> Registrar
        </Btn>}
      />
      <div style={{...COL,gap:14}}>
        <Field label="Producto" error={errors.productId}>
          <select value={f.productId} onChange={changeProd}
            style={{width:"100%",fontFamily:"inherit",borderColor:errors.productId?"var(--c-dan)":""}}>
            <option value="">— Seleccionar producto —</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>

        {prod && (
          <div style={{...SURF,fontSize:13}}>
            <span style={{color:"var(--c-sec)"}}>Precio habitual de compra: <strong style={{color:"var(--c-war)"}}>{USD(prod.buyPrice)}</strong></span>
            <span style={{color:"var(--c-sec)",marginLeft:16}}>Stock actual: <strong>{prod.stock} u.</strong></span>
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12}}>
          <Field label="Cantidad" error={errors.qty}>
            <input type="number" min="1" value={f.qty} onChange={set("qty")}
              style={{width:"100%",borderColor:errors.qty?"var(--c-dan)":""}}/>
          </Field>
          <Field label="Precio unitario ($)" error={errors.unitPrice}>
            <input type="number" min="0" step="0.01" value={f.unitPrice} onChange={set("unitPrice")}
              style={{width:"100%",borderColor:errors.unitPrice?"var(--c-dan)":""}}/>
          </Field>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12}}>
          <Field label="Fecha"><input type="date" value={f.date} onChange={set("date")} style={{width:"100%"}}/></Field>
          <Field label="Proveedor / Notas"><input value={f.notes} onChange={set("notes")} placeholder="Amazon US, DHL…" style={{width:"100%"}}/></Field>
        </div>

        {total > 0 && (
          <div style={{...CARD,marginBottom:0,...ROW}}>
            <span style={{fontSize:14,color:"var(--c-sec)"}}>Total a invertir</span>
            <span style={{fontSize:30,fontWeight:500,color:"var(--c-war)"}}>{USD(total)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PRODUCT DETAIL ──────────────────────────────────────────────
function ProductDetail({product, txs, onEdit, onSale, onPurchase, onBack}) {
  const myTxs = [...txs].filter(t => t.productId === product.id).sort((a,b) => b.date.localeCompare(a.date));
  const sales  = myTxs.filter(t => t.type === "sale");
  const soldQty= sales.reduce((s,t) => s+t.qty, 0);
  const revenue= sales.reduce((s,t) => s+t.total, 0);
  const profit = revenue - soldQty*product.buyPrice;
  const margin = product.sellPrice - product.buyPrice;
  const mPct   = product.sellPrice>0 ? ((margin/product.sellPrice)*100).toFixed(1) : 0;
  const maxStk = Math.max(product.stock + soldQty, 10);

  return (
    <div style={{padding:16}}>
      <BackHeader title={product.name} sub={product.sku||"Sin SKU"} onBack={onBack}
        action={<Btn onClick={onEdit} sm><i className="ti ti-edit" aria-hidden/> Editar</Btn>}
      />

      {/* Stock hero */}
      <div style={{...CARD,marginBottom:12}}>
        <div style={ROW}>
          <div>
            <div style={LABEL}>Stock actual</div>
            <div style={{fontSize:54,fontWeight:500,lineHeight:1,color:product.stock>0?"var(--c-suc)":"var(--c-dan)"}}>{product.stock}</div>
            <div style={{fontSize:13,color:"var(--c-sec)",marginTop:4}}>unidades</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={LABEL}>Valor en inventario</div>
            <div style={{fontSize:22,fontWeight:500,color:"var(--c-war)"}}>{USD(product.buyPrice*product.stock)}</div>
            <div style={{fontSize:12,color:"var(--c-sec)",marginTop:2}}>al precio de compra</div>
          </div>
        </div>
        <StockBar stock={product.stock} max={maxStk}/>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--c-sec)"}}>
          <span>0</span><span>Alerta: {product.minStock||2} u.</span><span>{maxStk}</span>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:10,marginBottom:12}}>
        {[
          ["Precio compra",  USD(product.buyPrice),                 "dan"],
          ["Precio venta",   USD(product.sellPrice),                "suc"],
          ["Margen/unidad",  `${USD(margin)} (${mPct}%)`,           "war"],
          ["Ganancia total", `${USD(profit)}`,                      "suc"],
          ["Unid. vendidas", `${soldQty} u.`,                       "inf"],
          ["Ingresos",       USD(revenue),                          "inf"],
        ].map(([l,v,c]) => (
          <div key={l} style={SURF}>
            <div style={LABEL}>{l}</div>
            <div style={{fontSize:16,fontWeight:500,color:`var(--c-${c})`}}>{v}</div>
          </div>
        ))}
      </div>

      {product.notes && (
        <div style={{...SURF,marginBottom:12}}>
          <div style={LABEL}>Notas</div>
          <div style={{fontSize:14,color:"var(--c-pri)"}}>{product.notes}</div>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:10,marginBottom:24}}>
        <Btn onClick={onSale}     v="success" full sx={{padding:14}}><i className="ti ti-receipt" aria-hidden/> Vender</Btn>
        <Btn onClick={onPurchase} v="warning" full sx={{padding:14}}><i className="ti ti-package" aria-hidden/> Restock</Btn>
      </div>

      <SectionTitle text={`Historial (${myTxs.length} movimientos)`}/>

      {myTxs.length === 0 && <Empty icon="ti-list" text="Sin movimientos registrados"/>}

      {myTxs.map(t => (
        <div key={t.id} style={{...CARD,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:38,height:38,borderRadius:"var(--r-md)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
              background:t.type==="sale"?"var(--bg-suc)":"var(--bg-war)"}}>
              <i className={`ti ${t.type==="sale"?"ti-trending-up":"ti-trending-down"}`}
                style={{fontSize:18,color:t.type==="sale"?"var(--c-suc)":"var(--c-war)"}} aria-hidden/>
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:500,color:"var(--c-pri)"}}>
                {t.type==="sale"?"Venta":"Compra"} · {t.qty} u.
              </div>
              <div style={{fontSize:12,color:"var(--c-sec)"}}>
                {fmtShort(t.date)}{t.notes ? ` · ${t.notes}` : ""}
                {t.discount>0 ? ` · Desc: ${t.discount}%`:""}
              </div>
            </div>
          </div>
          <div style={{textAlign:"right",flexShrink:0,marginLeft:8}}>
            <div style={{fontWeight:500,color:t.type==="sale"?"var(--c-suc)":"var(--c-war)"}}>{USD(t.total)}</div>
            <div style={{fontSize:12,color:"var(--c-sec)"}}>{USD(t.unitPrice)}/u</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────
export default function App() {
  const [products, setProducts] = usePersist("fc_products", INIT_PRODUCTS);
  const [txs,      setTxs]      = usePersist("fc_txs",      INIT_TXS);
  const [view,     setView]     = useState({name:"main"});
  const [tab,      setTab]      = useState("home");
  const [toast,    setToastSt]  = useState(null);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("all");
  const [fabOpen,  setFabOpen]  = useState(false);
  const [resetConf,setResetConf]= useState(false);

  const go   = useCallback(v  => { setView(v); setFabOpen(false); }, []);
  const back = useCallback(()  => setView({name:"main"}), []);
  const getProd = id => products.find(p => p.id === +id);

  const showToast = useCallback((msg, type="ok") => {
    setToastSt({msg, type});
    setTimeout(() => setToastSt(null), 3200);
  }, []);

  const stats = useMemo(() => {
    const invested = txs.filter(t => t.type==="purchase").reduce((s,t) => s+t.total, 0);
    const revenue  = txs.filter(t => t.type==="sale").reduce((s,t) => s+t.total, 0);
    const cogs     = txs.filter(t => t.type==="sale").reduce((s,t) => {
      const p = getProd(t.productId);
      return s + (p ? p.buyPrice*t.qty : 0);
    }, 0);
    const invValue = products.reduce((s,p) => s+p.buyPrice*p.stock, 0);
    const units    = products.reduce((s,p) => s+p.stock, 0);
    return { invested, revenue, profit:revenue-cogs, cogs, invValue, units,
      saleCnt: txs.filter(t=>t.type==="sale").length };
  }, [products, txs]);

  const lowStock = products.filter(p => p.stock <= (+(p.minStock)||2));

  // ── HANDLERS ──
  const saveProduct = useCallback(f => {
    if (!f.name || !f.buyPrice || !f.sellPrice) { showToast("Completa los campos requeridos","err"); return; }
    const p = {...f, buyPrice:+f.buyPrice, sellPrice:+f.sellPrice, stock:+f.stock||0, minStock:+f.minStock||2};
    if (p.id) {
      setProducts(ps => ps.map(x => x.id===p.id ? p : x));
      showToast("Producto actualizado");
    } else {
      setProducts(ps => [...ps, {...p, id:uid()}]);
      showToast("Producto agregado con éxito");
    }
    back();
  }, [showToast, back]);

  const deleteProduct = useCallback(id => {
    setProducts(ps => ps.filter(p => p.id !== id));
    setTxs(ts => ts.filter(t => t.productId !== id));
    showToast("Producto eliminado");
    back();
  }, [showToast, back]);

  const saveSale = useCallback(f => {
    const p = getProd(f.productId);
    if (!p) { showToast("Selecciona un producto","err"); return; }
    if (!+f.qty||+f.qty<=0||!+f.unitPrice) { showToast("Completa cantidad y precio","err"); return; }
    if (+f.qty > p.stock) { showToast(`Solo hay ${p.stock} u. disponibles`,"err"); return; }
    const disc      = Math.min(+(f.discount)||0, 100);
    const realPrice = (+f.unitPrice) * (1 - disc/100);
    const total     = realPrice * (+f.qty);
    setTxs(ts => [{id:uid(),type:"sale",productId:+f.productId,qty:+f.qty,
      unitPrice:realPrice,total,date:f.date,notes:f.notes||"",discount:disc}, ...ts]);
    setProducts(ps => ps.map(x => x.id===+f.productId ? {...x, stock:x.stock-(+f.qty)} : x));
    showToast(`¡Venta de ${USD(total)} registrada!`);
    back();
  }, [products, showToast, back]);

  const savePurchase = useCallback(f => {
    if (!+f.qty||+f.qty<=0||!+f.unitPrice) { showToast("Completa cantidad y precio","err"); return; }
    const total = (+f.unitPrice)*(+f.qty);
    setTxs(ts => [{id:uid(),type:"purchase",productId:+f.productId||null,qty:+f.qty,
      unitPrice:+f.unitPrice,total,date:f.date,notes:f.notes||""}, ...ts]);
    if (f.productId) setProducts(ps => ps.map(x => x.id===+f.productId ? {...x, stock:x.stock+(+f.qty)} : x));
    showToast(`Compra de ${USD(total)} registrada`);
    back();
  }, [showToast, back]);

  const exportCSV = useCallback(() => {
    const h1 = ["Producto","SKU","P.Compra","P.Venta","Stock","Valor Inv","Margen"];
    const r1  = products.map(p => [p.name,p.sku||"",p.buyPrice,p.sellPrice,p.stock,
      (p.buyPrice*p.stock).toFixed(2),(p.sellPrice-p.buyPrice).toFixed(2)]);
    const h2  = ["Tipo","Producto","Cantidad","P.Unitario","Total","Descuento","Fecha","Notas"];
    const r2  = [...txs].sort((a,b)=>b.date.localeCompare(a.date)).map(t => {
      const p = getProd(t.productId);
      return [t.type==="sale"?"Venta":"Compra",p?.name||"",t.qty,t.unitPrice,
        t.total.toFixed(2),t.discount?t.discount+"%":"0%",t.date,t.notes||""];
    });
    const csv = [h1,...r1,[],[h2],...r2].map(r=>r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href=url; a.download=`firecontrol_${todayISO()}.csv`; a.click();
    showToast("CSV exportado correctamente");
  }, [products, txs, showToast]);

  const resetAll = () => {
    setProducts(INIT_PRODUCTS);
    setTxs(INIT_TXS);
    setResetConf(false);
    showToast("Datos restablecidos a los datos de muestra");
  };

  // ── ROUTING ──
  if (view.name==="add-product")    return <ProductForm product={null} onSave={saveProduct} onDelete={deleteProduct} onBack={back}/>;
  if (view.name==="edit-product")   return <ProductForm product={view.data} onSave={saveProduct} onDelete={deleteProduct} onBack={back}/>;
  if (view.name==="product-detail") return <ProductDetail product={view.data} txs={txs}
    onEdit={()=>go({name:"edit-product",data:view.data})}
    onSale={()=>go({name:"add-sale",data:{pid:view.data.id}})}
    onPurchase={()=>go({name:"add-purchase",data:{pid:view.data.id}})}
    onBack={back}/>;
  if (view.name==="add-sale")       return <SaleForm products={products} initProductId={view.data?.pid} onSave={saveSale} onBack={back}/>;
  if (view.name==="add-purchase")   return <PurchaseForm products={products} initProductId={view.data?.pid} onSave={savePurchase} onBack={back}/>;

  // ── MAIN LAYOUT ──
  const TABS = [
    {id:"home",     icon:"ti-home",       label:"Inicio"},
    {id:"inventory",icon:"ti-box",        label:"Productos"},
    {id:"sales",    icon:"ti-receipt",    label:"Ventas"},
    {id:"purchases",icon:"ti-shopping-cart",label:"Compras"},
    {id:"reports",  icon:"ti-chart-bar",  label:"Reportes"},
  ];

  const filteredProds = products.filter(p => {
    const ms = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku||"").toLowerCase().includes(search.toLowerCase());
    const mf = filter==="all"
      || (filter==="in"  && p.stock>(+(p.minStock)||2))
      || (filter==="low" && p.stock>0 && p.stock<=(+(p.minStock)||2))
      || (filter==="out" && p.stock===0);
    return ms && mf;
  });

  const saleTxs    = [...txs].filter(t=>t.type==="sale").sort((a,b)=>b.date.localeCompare(a.date));
  const purchaseTxs= [...txs].filter(t=>t.type==="purchase").sort((a,b)=>b.date.localeCompare(a.date));

  const groupByDate = arr => {
    const g = {};
    arr.forEach(t => { if(!g[t.date]) g[t.date]=[]; g[t.date].push(t); });
    return Object.entries(g).sort((a,b)=>b[0].localeCompare(a[0]));
  };

  const TxRow = ({t}) => {
    const p = getProd(t.productId);
    return (
      <div style={{...CARD,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:36,height:36,borderRadius:"var(--r-md)",flexShrink:0,
            display:"flex",alignItems:"center",justifyContent:"center",
            background:t.type==="sale"?"var(--bg-suc)":"var(--bg-war)"}}>
            <i className={`ti ${t.type==="sale"?"ti-trending-up":"ti-trending-down"}`}
              style={{fontSize:17,color:t.type==="sale"?"var(--c-suc)":"var(--c-war)"}} aria-hidden/>
          </div>
          <div style={{minWidth:0}}>
            <div style={{fontSize:14,fontWeight:500,color:"var(--c-pri)",
              overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:170}}>
              {p?.name||"—"}
            </div>
            <div style={{fontSize:12,color:"var(--c-sec)"}}>
              {t.qty} u. · {fmtShort(t.date)}{t.notes?` · ${t.notes}`:""}
            </div>
          </div>
        </div>
        <div style={{fontWeight:500,color:t.type==="sale"?"var(--c-suc)":"var(--c-war)",marginLeft:8,flexShrink:0}}>
          {USD(t.total)}
        </div>
      </div>
    );
  };

  return (
    <div>
      {resetConf && (
        <ConfirmModal
          title="¿Restablecer datos?"
          msg="Esto eliminará todos tus productos y transacciones y cargará los datos de ejemplo. Esta acción no se puede deshacer."
          danger={false}
          onConfirm={resetAll}
          onCancel={()=>setResetConf(false)}
        />
      )}

      {/* HEADER */}
      <div style={{padding:"16px 16px 0",marginBottom:8}}>
        <div style={ROW}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:38,height:38,borderRadius:"var(--r-md)",background:"var(--bg-war)",
              display:"flex",alignItems:"center",justifyContent:"center"}}>
              <i className="ti ti-flame" style={{fontSize:22,color:"var(--c-war)"}} aria-hidden/>
            </div>
            <div>
              <div style={{fontSize:18,fontWeight:500,color:"var(--c-pri)",lineHeight:1.2}}>FireControl</div>
              <div style={{fontSize:11,color:"var(--c-sec)"}}>Inventario Fire TV</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={exportCSV} sm><i className="ti ti-download" aria-hidden/> CSV</Btn>
            <Btn onClick={()=>setFabOpen(f=>!f)} v="solid" sm>
              <i className={`ti ${fabOpen?"ti-x":"ti-plus"}`} aria-hidden/>
            </Btn>
          </div>
        </div>

        {fabOpen && (
          <div style={{...CARD,marginTop:12,marginBottom:0}}>
            <div style={{...LABEL,marginBottom:10}}>Acciones rápidas</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:8}}>
              {[
                ["Nueva venta",    "ti-receipt",    "success","add-sale"],
                ["Nueva compra",   "ti-package",    "warning","add-purchase"],
                ["Nuevo producto", "ti-plus",       "info",   "add-product"],
                ["Exportar CSV",   "ti-download",   "default",null],
              ].map(([l,ic,vc,vn]) => (
                <Btn key={l} onClick={()=>{setFabOpen(false);vn?go({name:vn}):exportCSV();}} v={vc} full sx={{padding:12}}>
                  <i className={`ti ${ic}`} aria-hidden/>{l}
                </Btn>
              ))}
            </div>
          </div>
        )}
      </div>

      <Toast toast={toast}/>

      {/* TAB BAR */}
      <div style={{display:"flex",padding:"0 6px",borderBottom:"0.5px solid var(--brd3)",overflowX:"auto",scrollbarWidth:"none"}}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            flex:"0 0 auto",background:"none",border:"none",
            borderBottom:tab===t.id?"2px solid var(--c-inf)":"2px solid transparent",
            padding:"10px 12px 8px",cursor:"pointer",
            color:tab===t.id?"var(--c-inf)":"var(--c-sec)",
            fontSize:11,display:"flex",flexDirection:"column",alignItems:"center",gap:3,
            fontWeight:tab===t.id?500:400,fontFamily:"inherit",minWidth:58}}>
            <i className={`ti ${t.icon}`} style={{fontSize:20}} aria-hidden/>{t.label}
          </button>
        ))}
      </div>

      <div style={{padding:16}}>

        {/* ══ HOME ══ */}
        {tab==="home" && <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:10,marginBottom:16}}>
            <Metric label="Inventario" value={USD(stats.invValue)} sub={`${stats.units} unidades`}    icon="ti-box"         v="neutral"/>
            <Metric label="Ganancia"   value={USD(stats.profit)}  sub="Total acumulada"              icon="ti-trending-up" v="success"/>
            <Metric label="Ventas"     value={USD(stats.revenue)} sub={`${stats.saleCnt} transac.`}  icon="ti-cash"        v="info"/>
            <Metric label="Invertido"  value={USD(stats.invested)}sub="Total en compras"             icon="ti-coin"        v="warning"/>
          </div>

          {lowStock.length > 0 && (
            <div style={{...CARD,borderColor:"var(--c-dan)",marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <i className="ti ti-alert-triangle" style={{fontSize:18,color:"var(--c-dan)"}} aria-hidden/>
                <span style={{fontSize:14,fontWeight:500,color:"var(--c-dan)"}}>
                  ⚠ Stock bajo — {lowStock.length} producto{lowStock.length>1?"s":""}
                </span>
              </div>
              {lowStock.map(p => (
                <div key={p.id} onClick={()=>go({name:"product-detail",data:p})}
                  style={{...ROW,padding:"8px 0",borderTop:"0.5px solid var(--brd3)",cursor:"pointer"}}>
                  <span style={{fontSize:14,color:"var(--c-pri)"}}>{p.name}</span>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <StockBadge stock={p.stock} min={+(p.minStock)||2}/>
                    <Btn onClick={e=>{e.stopPropagation();go({name:"add-purchase",data:{pid:p.id}});}} v="warning" sm>
                      Restock
                    </Btn>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Top productos */}
          {saleTxs.length > 0 && (() => {
            const by = {};
            saleTxs.forEach(t => {
              const p = getProd(t.productId);
              if (p) { if(!by[p.id]) by[p.id]={name:p.name,rev:0,qty:0}; by[p.id].rev+=t.total; by[p.id].qty+=t.qty; }
            });
            const sorted = Object.values(by).sort((a,b)=>b.rev-a.rev).slice(0,4);
            const maxR   = Math.max(...sorted.map(x=>x.rev));
            return (
              <div style={{...CARD,marginBottom:16}}>
                <SectionTitle text="Top productos por ingresos"/>
                {sorted.map(p => (
                  <div key={p.name} style={{marginBottom:12}}>
                    <div style={{...ROW,marginBottom:3}}>
                      <span style={{fontSize:13,color:"var(--c-pri)",fontWeight:500,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",paddingRight:8}}>
                        {p.name}
                      </span>
                      <span style={{fontSize:13,color:"var(--c-inf)",fontWeight:500,flexShrink:0}}>{USD(p.rev)}</span>
                    </div>
                    <div style={{height:5,background:"var(--brd3)",borderRadius:3,overflow:"hidden"}}>
                      <div style={{height:"100%",width:Math.max(3,(p.rev/maxR)*100)+"%",background:"var(--c-inf)",borderRadius:3}}/>
                    </div>
                    <div style={{fontSize:11,color:"var(--c-sec)",marginTop:2}}>{p.qty} unidades vendidas</div>
                  </div>
                ))}
              </div>
            );
          })()}

          <SectionTitle text="Actividad reciente"
            action={<button onClick={()=>setTab("sales")} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:"var(--c-inf)",fontFamily:"inherit"}}>Ver todo →</button>}
          />
          {txs.length === 0 && <Empty icon="ti-clock" text="Sin actividad aún"/>}
          {[...txs].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5).map(t => <TxRow key={t.id} t={t}/>)}
        </>}

        {/* ══ INVENTORY ══ */}
        {tab==="inventory" && <>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            <div style={{flex:1,position:"relative"}}>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Buscar nombre o SKU…"
                style={{width:"100%",paddingLeft:34}}/>
              <i className="ti ti-search"
                style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",
                  color:"var(--c-sec)",fontSize:16,pointerEvents:"none"}} aria-hidden/>
            </div>
            <Btn onClick={()=>go({name:"add-product"})} v="solid" sm><i className="ti ti-plus" aria-hidden/></Btn>
          </div>

          <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
            {[["all","Todos"],["in","En stock"],["low","Stock bajo"],["out","Sin stock"]].map(([v,l]) => (
              <button key={v} onClick={()=>setFilter(v)} style={{
                padding:"5px 12px",borderRadius:"var(--r-md)",fontSize:12,fontWeight:500,
                background:filter===v?"var(--c-pri)":"var(--bg2)",
                color:filter===v?"var(--bg1)":"var(--c-sec)",
                border:"none",cursor:"pointer",fontFamily:"inherit"}}>{l}
              </button>
            ))}
          </div>

          <div style={{fontSize:12,color:"var(--c-sec)",marginBottom:10}}>
            {filteredProds.length} producto{filteredProds.length!==1?"s":""}
          </div>

          {filteredProds.length===0 && (
            <Empty icon="ti-box-off"
              text={products.length===0?"Agrega tu primer producto":"Sin resultados"}
              action={products.length===0 && (
                <Btn onClick={()=>go({name:"add-product"})} v="info">
                  <i className="ti ti-plus" aria-hidden/> Agregar producto
                </Btn>
              )}
            />
          )}

          {filteredProds.map(p => (
            <div key={p.id} style={{...CARD,cursor:"pointer"}} onClick={()=>go({name:"product-detail",data:p})}>
              <div style={{...ROW,marginBottom:4}}>
                <div style={{flex:1,minWidth:0,paddingRight:8}}>
                  <div style={{fontSize:15,fontWeight:500,color:"var(--c-pri)"}}>{p.name}</div>
                  {p.sku && <div style={{fontSize:12,color:"var(--c-sec)"}}>{p.sku}</div>}
                </div>
                <StockBadge stock={p.stock} min={+(p.minStock)||2}/>
              </div>
              <StockBar stock={p.stock} max={Math.max(p.stock+5,10)}/>
              <div style={{display:"flex",flexWrap:"wrap",gap:"4px 16px",fontSize:13,color:"var(--c-sec)",marginBottom:8}}>
                <span>Compra: <strong style={{color:"var(--c-dan)"}}>{USD(p.buyPrice)}</strong></span>
                <span>Venta: <strong  style={{color:"var(--c-suc)"}}>{USD(p.sellPrice)}</strong></span>
                <span>Margen: <strong style={{color:"var(--c-war)"}}>{USD(p.sellPrice-p.buyPrice)}</strong></span>
              </div>
              <div style={{...ROW,fontSize:12,color:"var(--c-sec)"}}>
                <span>Valor: {USD(p.buyPrice*p.stock)}</span>
                <div style={{display:"flex",gap:6}} onClick={e=>e.stopPropagation()}>
                  <Btn onClick={()=>go({name:"add-sale",data:{pid:p.id}})}     v="success" sm><i className="ti ti-receipt"  aria-hidden/></Btn>
                  <Btn onClick={()=>go({name:"add-purchase",data:{pid:p.id}})} v="warning" sm><i className="ti ti-package"  aria-hidden/></Btn>
                  <Btn onClick={()=>go({name:"edit-product",data:p})}          sm>           <i className="ti ti-edit"     aria-hidden/></Btn>
                </div>
              </div>
            </div>
          ))}
        </>}

        {/* ══ VENTAS ══ */}
        {tab==="sales" && <>
          <div style={{...CARD,marginBottom:16,...ROW}}>
            <div>
              <div style={LABEL}>Total en ventas</div>
              <div style={{fontSize:30,fontWeight:500,color:"var(--c-suc)"}}>{USD(stats.revenue)}</div>
              <div style={{fontSize:12,color:"var(--c-sec)",marginTop:2}}>
                {saleTxs.length} transacciones · {saleTxs.reduce((s,t)=>s+t.qty,0)} unidades
              </div>
            </div>
            <Btn onClick={()=>go({name:"add-sale"})} v="success"><i className="ti ti-plus" aria-hidden/> Nueva</Btn>
          </div>

          {saleTxs.length===0 && <Empty icon="ti-receipt-off" text="Sin ventas registradas"/>}

          {groupByDate(saleTxs).map(([date,ts]) => (
            <div key={date} style={{marginBottom:4}}>
              <div style={{...ROW,fontSize:12,fontWeight:500,color:"var(--c-sec)",marginBottom:6}}>
                <span>{fmt(date)}</span>
                <span style={{color:"var(--c-suc)"}}>{USD(ts.reduce((s,t)=>s+t.total,0))}</span>
              </div>
              {ts.map(t => {
                const p = getProd(t.productId);
                return (
                  <div key={t.id} style={{...CARD,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:500,color:"var(--c-pri)"}}>{p?.name||"—"}</div>
                      <div style={{fontSize:12,color:"var(--c-sec)"}}>
                        {t.qty} u. × {USD(t.unitPrice)}{t.discount>0?` (desc ${t.discount}%)`:""}{t.notes?` · ${t.notes}`:""}
                      </div>
                    </div>
                    <div style={{fontWeight:500,fontSize:16,color:"var(--c-suc)",marginLeft:8,flexShrink:0}}>{USD(t.total)}</div>
                  </div>
                );
              })}
            </div>
          ))}
        </>}

        {/* ══ COMPRAS ══ */}
        {tab==="purchases" && <>
          <div style={{...CARD,marginBottom:16,...ROW}}>
            <div>
              <div style={LABEL}>Total invertido</div>
              <div style={{fontSize:30,fontWeight:500,color:"var(--c-war)"}}>{USD(stats.invested)}</div>
              <div style={{fontSize:12,color:"var(--c-sec)",marginTop:2}}>
                {purchaseTxs.length} compras · {purchaseTxs.reduce((s,t)=>s+t.qty,0)} unidades
              </div>
            </div>
            <Btn onClick={()=>go({name:"add-purchase"})} v="warning"><i className="ti ti-plus" aria-hidden/> Nueva</Btn>
          </div>

          {purchaseTxs.length===0 && <Empty icon="ti-shopping-cart-off" text="Sin compras registradas"/>}

          {groupByDate(purchaseTxs).map(([date,ts]) => (
            <div key={date} style={{marginBottom:4}}>
              <div style={{...ROW,fontSize:12,fontWeight:500,color:"var(--c-sec)",marginBottom:6}}>
                <span>{fmt(date)}</span>
                <span style={{color:"var(--c-war)"}}>{USD(ts.reduce((s,t)=>s+t.total,0))}</span>
              </div>
              {ts.map(t => {
                const p = getProd(t.productId);
                return (
                  <div key={t.id} style={{...CARD,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:500,color:"var(--c-pri)"}}>{p?.name||"—"}</div>
                      <div style={{fontSize:12,color:"var(--c-sec)"}}>
                        {t.qty} u. × {USD(t.unitPrice)}{t.notes?` · ${t.notes}`:""}
                      </div>
                    </div>
                    <div style={{fontWeight:500,fontSize:16,color:"var(--c-war)",marginLeft:8,flexShrink:0}}>{USD(t.total)}</div>
                  </div>
                );
              })}
            </div>
          ))}
        </>}

        {/* ══ REPORTES ══ */}
        {tab==="reports" && (() => {
          const grossPct  = stats.revenue>0 ? ((stats.profit/stats.revenue)*100).toFixed(1) : 0;
          const roi       = stats.invested>0 ? ((stats.profit/stats.invested)*100).toFixed(1) : 0;
          const avgTicket = stats.saleCnt>0 ? stats.revenue/stats.saleCnt : 0;

          const byProd = {};
          products.forEach(p => { byProd[p.id]={id:p.id,name:p.name,buyPrice:p.buyPrice,stock:p.stock,soldQty:0,revenue:0,profit:0}; });
          txs.forEach(t => {
            if (t.type==="sale" && byProd[t.productId]) {
              byProd[t.productId].soldQty += t.qty;
              byProd[t.productId].revenue += t.total;
              byProd[t.productId].profit  += (t.unitPrice - byProd[t.productId].buyPrice)*t.qty;
            }
          });
          const ps     = Object.values(byProd).sort((a,b)=>b.revenue-a.revenue);
          const sold   = ps.filter(p=>p.soldQty>0);
          const unsold = ps.filter(p=>p.soldQty===0);
          const maxP   = Math.max(...ps.map(x=>x.profit),1);

          return <>
            {/* P&L */}
            <div style={{...CARD,marginBottom:16}}>
              <SectionTitle text="Estado de resultados"/>
              {[
                ["Ingresos totales",       USD(stats.revenue),  "suc"],
                ["Costo de ventas (COGS)", `- ${USD(stats.cogs)}`,"dan"],
              ].map(([l,v,c]) => (
                <div key={l} style={{...ROW,marginBottom:10}}>
                  <span style={{fontSize:14,color:"var(--c-sec)"}}>{l}</span>
                  <span style={{fontSize:14,fontWeight:500,color:`var(--c-${c})`}}>{v}</span>
                </div>
              ))}
              <Divider/>
              <div style={{...ROW,marginBottom:16}}>
                <span style={{fontSize:15,fontWeight:500,color:"var(--c-pri)"}}>Ganancia bruta</span>
                <span style={{fontSize:26,fontWeight:500,color:stats.profit>=0?"var(--c-suc)":"var(--c-dan)"}}>{USD(stats.profit)}</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:10}}>
                {[
                  ["Margen bruto",        `${grossPct}%`,          "inf"],
                  ["ROI sobre inversión",  `${roi}%`,              roi>=0?"suc":"dan"],
                  ["Ticket promedio",      USD(avgTicket),          "war"],
                  ["Capital en inventario",USD(stats.invValue),     "war"],
                ].map(([l,v,c]) => (
                  <div key={l} style={SURF}>
                    <div style={LABEL}>{l}</div>
                    <div style={{fontSize:18,fontWeight:500,color:`var(--c-${c})`}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* By product */}
            <div style={{...CARD,marginBottom:16}}>
              <SectionTitle text="Ganancia por producto"/>
              {sold.length===0 && <div style={{textAlign:"center",padding:"20px 0",color:"var(--c-sec)",fontSize:13}}>Sin ventas aún</div>}
              {sold.map(p => (
                <div key={p.id} style={{marginBottom:18}} onClick={()=>go({name:"product-detail",data:products.find(x=>x.id===p.id)})}>
                  <div style={{...ROW,marginBottom:3}}>
                    <span style={{fontSize:13,fontWeight:500,color:"var(--c-pri)",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",paddingRight:8}}>{p.name}</span>
                    <span style={{fontSize:13,fontWeight:500,color:p.profit>=0?"var(--c-suc)":"var(--c-dan)",flexShrink:0}}>{USD(p.profit)}</span>
                  </div>
                  <div style={{height:6,background:"var(--brd3)",borderRadius:3,overflow:"hidden",marginBottom:4}}>
                    <div style={{height:"100%",width:Math.max(3,(p.profit/maxP)*100)+"%",
                      background:p.profit>=0?"var(--c-suc)":"var(--c-dan)",borderRadius:3}}/>
                  </div>
                  <div style={{display:"flex",gap:16,fontSize:12,color:"var(--c-sec)"}}>
                    <span>{p.soldQty} vendidas</span>
                    <span>Ingreso: {USD(p.revenue)}</span>
                    <span>Margen: {p.revenue>0?((p.profit/p.revenue)*100).toFixed(0):0}%</span>
                  </div>
                </div>
              ))}
            </div>

            {unsold.length > 0 && (
              <div style={{...CARD,marginBottom:16}}>
                <SectionTitle text="Productos sin ventas"/>
                {unsold.map(p => (
                  <div key={p.id} style={{...ROW,padding:"8px 0",borderTop:"0.5px solid var(--brd3)"}}>
                    <span style={{fontSize:14,color:"var(--c-sec)"}}>{p.name}</span>
                    <span style={{fontSize:13,color:"var(--c-sec)"}}>{p.stock} u.</span>
                  </div>
                ))}
              </div>
            )}

            {/* Danger zone */}
            <div style={{...CARD,borderColor:"var(--c-dan)"}}>
              <SectionTitle text="Zona de datos"/>
              <div style={{fontSize:13,color:"var(--c-sec)",marginBottom:12}}>
                Tus datos se guardan automáticamente en este dispositivo cada vez que haces un cambio.
              </div>
              <Btn onClick={exportCSV} full sx={{marginBottom:8,padding:12}}>
                <i className="ti ti-download" aria-hidden/> Exportar todo a CSV
              </Btn>
              <Btn onClick={()=>setResetConf(true)} v="danger" full sx={{padding:12}}>
                <i className="ti ti-refresh" aria-hidden/> Restablecer a datos de ejemplo
              </Btn>
            </div>
          </>;
        })()}

      </div>
    </div>
  );
}
