import { useState, useMemo } from "react";

const INIT_PRODUCTS = [
  { id: 1, name: "Fire TV Stick 4K Max", sku: "FTV-4K-MAX", purchasePrice: 38, salePrice: 62, stock: 5, notes: "Gen 2, Alexa Voice Remote Pro" },
  { id: 2, name: "Fire TV Stick Lite", sku: "FTV-LITE", purchasePrice: 20, salePrice: 35, stock: 8, notes: "Edición compacta 2022" },
  { id: 3, name: "Fire TV Stick 4K", sku: "FTV-4K-STD", purchasePrice: 28, salePrice: 48, stock: 3, notes: "Soporte 4K Ultra HD" },
];
const INIT_TX = [
  { id: 1, type: "purchase", productId: 1, qty: 5, unitPrice: 38, total: 190, date: "2025-05-01", notes: "" },
  { id: 2, type: "purchase", productId: 2, qty: 8, unitPrice: 20, total: 160, date: "2025-05-01", notes: "" },
  { id: 3, type: "purchase", productId: 3, qty: 3, unitPrice: 28, total: 84, date: "2025-05-03", notes: "" },
  { id: 4, type: "sale", productId: 1, qty: 2, unitPrice: 62, total: 124, date: "2025-05-12", notes: "Cliente: Marcos" },
  { id: 5, type: "sale", productId: 2, qty: 3, unitPrice: 35, total: 105, date: "2025-05-14", notes: "Cliente: Sofía" },
];

const usd = (n) => `$${(+n).toFixed(2)}`;
const todayStr = () => new Date().toISOString().split("T")[0];
const fmtDate = (d) => new Date(d + "T00:00").toLocaleDateString("es-NI", { day: "2-digit", month: "short" });

const card = {
  background: "var(--color-background-primary)",
  border: "0.5px solid var(--color-border-tertiary)",
  borderRadius: "var(--border-radius-lg)",
  padding: "1rem 1.25rem",
};
const surface = {
  background: "var(--color-background-secondary)",
  borderRadius: "var(--border-radius-md)",
  padding: "0.75rem 1rem",
};
const badge = (variant) => {
  const v = {
    success: ["var(--color-background-success)", "var(--color-text-success)"],
    warning: ["var(--color-background-warning)", "var(--color-text-warning)"],
    danger: ["var(--color-background-danger)", "var(--color-text-danger)"],
    info: ["var(--color-background-info)", "var(--color-text-info)"],
  };
  const [bg, color] = v[variant] || v.info;
  return { display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: "var(--border-radius-md)", fontSize: 12, fontWeight: 500, background: bg, color };
};
const btn = (variant = "default") => {
  const base = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 16px", borderRadius: "var(--border-radius-md)", fontWeight: 500, fontSize: 14, cursor: "pointer", border: "none", fontFamily: "inherit" };
  const variants = {
    default: { background: "transparent", border: "0.5px solid var(--color-border-secondary)", color: "var(--color-text-primary)" },
    success: { background: "var(--color-background-success)", color: "var(--color-text-success)" },
    warning: { background: "var(--color-background-warning)", color: "var(--color-text-warning)" },
    info: { background: "var(--color-background-info)", color: "var(--color-text-info)" },
    danger: { background: "var(--color-background-danger)", color: "var(--color-text-danger)" },
  };
  return { ...base, ...variants[variant] };
};

function Metric({ label, value, sub, variant = "default", icon }) {
  const textC = { default: "var(--color-text-primary)", success: "var(--color-text-success)", warning: "var(--color-text-warning)", info: "var(--color-text-info)", danger: "var(--color-text-danger)" };
  const bgC = { default: "var(--color-background-secondary)", success: "var(--color-background-success)", warning: "var(--color-background-warning)", info: "var(--color-background-info)", danger: "var(--color-background-danger)" };
  return (
    <div style={{ background: bgC[variant], borderRadius: "var(--border-radius-md)", padding: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
        <i className={`ti ${icon}`} style={{ fontSize: 16, color: textC[variant] }} aria-hidden="true" />
      </div>
      <div style={{ fontSize: 22, fontWeight: 500, color: textC[variant], fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("home");
  const [products, setProducts] = useState(INIT_PRODUCTS);
  const [transactions, setTransactions] = useState(INIT_TX);
  const [view, setView] = useState("main");
  const [form, setForm] = useState({});
  const [detailId, setDetailId] = useState(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  const getProd = (id) => products.find((p) => p.id === +id);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const stats = useMemo(() => {
    const invested = transactions.filter((t) => t.type === "purchase").reduce((s, t) => s + t.total, 0);
    const revenue = transactions.filter((t) => t.type === "sale").reduce((s, t) => s + t.total, 0);
    const cogs = transactions.filter((t) => t.type === "sale").reduce((s, t) => {
      const p = products.find((x) => x.id === t.productId);
      return s + (p ? p.purchasePrice * t.qty : 0);
    }, 0);
    const invValue = products.reduce((s, p) => s + p.purchasePrice * p.stock, 0);
    const units = products.reduce((s, p) => s + p.stock, 0);
    return { invested, revenue, profit: revenue - cogs, invValue, units };
  }, [products, transactions]);

  const fld = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const goAddProduct = (p = null) => {
    setForm(p ? { ...p } : { id: null, name: "", sku: "", purchasePrice: "", salePrice: "", stock: "0", notes: "" });
    setView("add-product");
  };
  const goSale = (p = null) => {
    const prod = p || products[0];
    setForm({ productId: prod?.id || "", qty: "1", unitPrice: prod?.salePrice || "", date: todayStr(), notes: "" });
    setView("add-sale");
  };
  const goPurchase = (p = null) => {
    const prod = p || products[0];
    setForm({ productId: prod?.id || "", qty: "1", unitPrice: prod?.purchasePrice || "", date: todayStr(), notes: "" });
    setView("add-purchase");
  };

  const saveProduct = () => {
    if (!form.name || !form.purchasePrice || !form.salePrice) { showToast("Nombre y precios son requeridos", "err"); return; }
    const p = { ...form, purchasePrice: +form.purchasePrice, salePrice: +form.salePrice, stock: +form.stock || 0 };
    if (p.id) {
      setProducts((ps) => ps.map((x) => (x.id === p.id ? p : x)));
      showToast("Producto actualizado");
    } else {
      setProducts((ps) => [...ps, { ...p, id: Date.now() }]);
      showToast("Producto agregado");
    }
    setView("main");
  };

  const saveSale = () => {
    const p = getProd(form.productId);
    if (!p) { showToast("Selecciona un producto", "err"); return; }
    if (!form.qty || +form.qty <= 0 || !form.unitPrice) { showToast("Completa cantidad y precio", "err"); return; }
    if (+form.qty > p.stock) { showToast(`Solo hay ${p.stock} u. en stock`, "err"); return; }
    const total = +form.unitPrice * +form.qty;
    setTransactions((ts) => [{ id: Date.now(), type: "sale", productId: +form.productId, qty: +form.qty, unitPrice: +form.unitPrice, total, date: form.date, notes: form.notes || "" }, ...ts]);
    setProducts((ps) => ps.map((x) => (x.id === +form.productId ? { ...x, stock: x.stock - +form.qty } : x)));
    showToast(`Venta de ${usd(total)} registrada`);
    setView("main");
  };

  const savePurchase = () => {
    if (!form.qty || +form.qty <= 0 || !form.unitPrice) { showToast("Completa cantidad y precio", "err"); return; }
    const total = +form.unitPrice * +form.qty;
    setTransactions((ts) => [{ id: Date.now(), type: "purchase", productId: +form.productId, qty: +form.qty, unitPrice: +form.unitPrice, total, date: form.date, notes: form.notes || "" }, ...ts]);
    if (form.productId) setProducts((ps) => ps.map((x) => (x.id === +form.productId ? { ...x, stock: x.stock + +form.qty } : x)));
    showToast(`Compra de ${usd(total)} registrada`);
    setView("main");
  };

  const deleteProduct = (id) => {
    setProducts((ps) => ps.filter((p) => p.id !== id));
    setView("main");
    showToast("Producto eliminado");
  };

  const exportCSV = () => {
    const inv = [["Producto","SKU","P.Compra","P.Venta","Stock","Valor Inventario","Margen"], ...products.map((p) => [p.name, p.sku || "", p.purchasePrice, p.salePrice, p.stock, (p.purchasePrice * p.stock).toFixed(2), (p.salePrice - p.purchasePrice).toFixed(2)])];
    const txRows = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).map((t) => {
      const p = getProd(t.productId);
      return [t.type === "sale" ? "Venta" : "Compra", p?.name || "", t.qty, t.unitPrice, t.total.toFixed(2), t.date, t.notes || ""];
    });
    const all = [...inv, [], ["Tipo","Producto","Cantidad","P.Unitario","Total","Fecha","Notas"], ...txRows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + all], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `inventario_${todayStr()}.csv`; a.click();
    showToast("CSV exportado");
  };

  const Toast = () =>
    toast ? (
      <div style={{ margin: "12px 16px 0", ...badge(toast.type === "err" ? "danger" : "success"), display: "flex", padding: "10px 16px", borderRadius: "var(--border-radius-md)", justifyContent: "center", gap: 8 }}>
        <i className={`ti ${toast.type === "err" ? "ti-alert-circle" : "ti-circle-check"}`} aria-hidden="true" /> {toast.msg}
      </div>
    ) : null;

  const FormHeader = ({ title, onSave, saveLabel = "Guardar", saveVariant = "info" }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
      <button onClick={() => setView("main")} style={{ ...btn(), padding: "7px 10px" }}>
        <i className="ti ti-arrow-left" aria-hidden="true" />
      </button>
      <h2 style={{ margin: 0, flex: 1, fontSize: 17 }}>{title}</h2>
      <button onClick={onSave} style={{ ...btn(saveVariant), padding: "8px 18px" }}>{saveLabel}</button>
    </div>
  );

  // ---- ADD/EDIT PRODUCT ----
  if (view === "add-product") {
    const margin = form.purchasePrice && form.salePrice ? +form.salePrice - +form.purchasePrice : null;
    const marginPct = margin !== null && +form.salePrice > 0 ? ((margin / +form.salePrice) * 100).toFixed(1) : null;
    return (
      <div style={{ padding: "16px" }}>
        <h2 className="sr-only">Formulario de producto</h2>
        <Toast />
        <FormHeader title={form.id ? "Editar producto" : "Nuevo producto"} onSave={saveProduct} />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Nombre *</span>
            <input value={form.name || ""} onChange={fld("name")} placeholder="Fire TV Stick 4K Max" style={{ width: "100%" }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>SKU / Código</span>
            <input value={form.sku || ""} onChange={fld("sku")} placeholder="FTV-4K-MAX" style={{ width: "100%" }} />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 12 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Precio compra ($) *</span>
              <input type="number" min="0" step="0.01" value={form.purchasePrice || ""} onChange={fld("purchasePrice")} placeholder="0.00" style={{ width: "100%" }} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Precio venta ($) *</span>
              <input type="number" min="0" step="0.01" value={form.salePrice || ""} onChange={fld("salePrice")} placeholder="0.00" style={{ width: "100%" }} />
            </label>
          </div>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Stock inicial</span>
            <input type="number" min="0" value={form.stock || 0} onChange={fld("stock")} style={{ width: "100%" }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Notas</span>
            <textarea value={form.notes || ""} onChange={fld("notes")} placeholder="Descripción, variante, etc." rows={3} style={{ width: "100%", resize: "vertical", fontFamily: "inherit" }} />
          </label>
          {margin !== null && (
            <div style={{ ...surface, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Margen por unidad</span>
              <span style={{ fontWeight: 500, color: margin >= 0 ? "var(--color-text-success)" : "var(--color-text-danger)" }}>
                {usd(margin)} ({marginPct}%)
              </span>
            </div>
          )}
          {form.id && (
            <button onClick={() => deleteProduct(form.id)} style={{ ...btn("danger"), width: "100%", padding: 12, marginTop: 8, justifyContent: "center" }}>
              <i className="ti ti-trash" aria-hidden="true" /> Eliminar producto
            </button>
          )}
        </div>
      </div>
    );
  }

  // ---- ADD SALE ----
  if (view === "add-sale") {
    const selProd = getProd(form.productId);
    const total = (+form.qty || 0) * (+form.unitPrice || 0);
    return (
      <div style={{ padding: "16px" }}>
        <h2 className="sr-only">Formulario de venta</h2>
        <Toast />
        <FormHeader title="Registrar venta" onSave={saveSale} saveVariant="success" saveLabel="Registrar" />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Producto</span>
            <select value={form.productId || ""} onChange={fld("productId")} style={{ width: "100%", fontFamily: "inherit" }}>
              <option value="">-- Seleccionar producto --</option>
              {products.map((p) => (<option key={p.id} value={p.id}>{p.name} (stock: {p.stock})</option>))}
            </select>
          </label>
          {selProd && (
            <div style={{ ...surface, display: "flex", gap: 16, fontSize: 13, flexWrap: "wrap" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>P. sugerido: <strong style={{ color: "var(--color-text-success)" }}>{usd(selProd.salePrice)}</strong></span>
              <span style={{ color: "var(--color-text-secondary)" }}>Stock disponible: <strong>{selProd.stock} u.</strong></span>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 12 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Cantidad</span>
              <input type="number" min="1" value={form.qty || ""} onChange={fld("qty")} style={{ width: "100%" }} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Precio venta ($)</span>
              <input type="number" min="0" step="0.01" value={form.unitPrice || ""} onChange={fld("unitPrice")} style={{ width: "100%" }} />
            </label>
          </div>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Fecha</span>
            <input type="date" value={form.date || ""} onChange={fld("date")} style={{ width: "100%" }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Notas (cliente, pedido, etc.)</span>
            <input value={form.notes || ""} onChange={fld("notes")} placeholder="Ej: Cliente: Juan" style={{ width: "100%" }} />
          </label>
          {total > 0 && (
            <div style={{ ...surface, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Total de venta</span>
              <span style={{ fontSize: 22, fontWeight: 500, color: "var(--color-text-success)" }}>{usd(total)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- ADD PURCHASE ----
  if (view === "add-purchase") {
    const total = (+form.qty || 0) * (+form.unitPrice || 0);
    return (
      <div style={{ padding: "16px" }}>
        <h2 className="sr-only">Formulario de compra</h2>
        <Toast />
        <FormHeader title="Registrar compra" onSave={savePurchase} saveVariant="warning" saveLabel="Registrar" />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Producto</span>
            <select value={form.productId || ""} onChange={fld("productId")} style={{ width: "100%", fontFamily: "inherit" }}>
              <option value="">-- Seleccionar producto --</option>
              {products.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 12 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Cantidad</span>
              <input type="number" min="1" value={form.qty || ""} onChange={fld("qty")} style={{ width: "100%" }} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Precio unitario ($)</span>
              <input type="number" min="0" step="0.01" value={form.unitPrice || ""} onChange={fld("unitPrice")} style={{ width: "100%" }} />
            </label>
          </div>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Fecha</span>
            <input type="date" value={form.date || ""} onChange={fld("date")} style={{ width: "100%" }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Notas (proveedor, etc.)</span>
            <input value={form.notes || ""} onChange={fld("notes")} placeholder="Ej: Proveedor: Amazon" style={{ width: "100%" }} />
          </label>
          {total > 0 && (
            <div style={{ ...surface, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Total invertido</span>
              <span style={{ fontSize: 22, fontWeight: 500, color: "var(--color-text-warning)" }}>{usd(total)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- PRODUCT DETAIL ----
  if (view === "detail" && detailId) {
    const prod = getProd(detailId);
    if (!prod) { setView("main"); return null; }
    const txs = transactions.filter((t) => t.productId === prod.id).sort((a, b) => b.date.localeCompare(a.date));
    const soldQty = txs.filter((t) => t.type === "sale").reduce((s, t) => s + t.qty, 0);
    const revenue = txs.filter((t) => t.type === "sale").reduce((s, t) => s + t.total, 0);
    const margin = prod.salePrice - prod.purchasePrice;
    const marginPct = prod.salePrice > 0 ? ((margin / prod.salePrice) * 100).toFixed(1) : 0;

    return (
      <div style={{ padding: "16px" }}>
        <h2 className="sr-only">Detalle de producto</h2>
        <Toast />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <button onClick={() => { setView("main"); setTab("inventory"); }} style={{ ...btn(), padding: "7px 10px" }}>
            <i className="ti ti-arrow-left" aria-hidden="true" />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 500, fontSize: 16, color: "var(--color-text-primary)" }}>{prod.name}</div>
            {prod.sku && <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>SKU: {prod.sku}</div>}
          </div>
          <button onClick={() => goAddProduct(prod)} style={{ ...btn(), padding: "7px 12px", fontSize: 13 }}>
            <i className="ti ti-edit" aria-hidden="true" /> Editar
          </button>
        </div>

        <div style={{ ...card, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>Stock actual</div>
            <div style={{ fontSize: 42, fontWeight: 500, color: prod.stock > 0 ? "var(--color-text-success)" : "var(--color-text-danger)", lineHeight: 1 }}>{prod.stock}</div>
            <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 4 }}>unidades</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>Valor en inventario</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: "var(--color-text-warning)" }}>{usd(prod.purchasePrice * prod.stock)}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 10, marginBottom: 12 }}>
          <div style={surface}>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Precio compra</div>
            <div style={{ fontSize: 20, fontWeight: 500, color: "var(--color-text-danger)" }}>{usd(prod.purchasePrice)}</div>
          </div>
          <div style={surface}>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Precio venta</div>
            <div style={{ fontSize: 20, fontWeight: 500, color: "var(--color-text-success)" }}>{usd(prod.salePrice)}</div>
          </div>
          <div style={surface}>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Margen</div>
            <div style={{ fontSize: 20, fontWeight: 500, color: "var(--color-text-warning)" }}>{usd(margin)}</div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{marginPct}% del precio</div>
          </div>
          <div style={surface}>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Total vendido</div>
            <div style={{ fontSize: 18, fontWeight: 500, color: "var(--color-text-primary)" }}>{soldQty} u.</div>
            <div style={{ fontSize: 13, color: "var(--color-text-success)" }}>{usd(revenue)}</div>
          </div>
        </div>

        {prod.notes && (
          <div style={{ ...surface, marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Notas</div>
            <div style={{ fontSize: 14, color: "var(--color-text-primary)" }}>{prod.notes}</div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 10, marginBottom: 24 }}>
          <button onClick={() => goSale(prod)} style={{ ...btn("success"), width: "100%", padding: "12px", justifyContent: "center" }}>
            <i className="ti ti-receipt" aria-hidden="true" /> Vender
          </button>
          <button onClick={() => goPurchase(prod)} style={{ ...btn("warning"), width: "100%", padding: "12px", justifyContent: "center" }}>
            <i className="ti ti-package" aria-hidden="true" /> Restock
          </button>
        </div>

        <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 12, color: "var(--color-text-primary)" }}>Historial de movimientos</div>
        {txs.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px 0", color: "var(--color-text-secondary)", fontSize: 14 }}>Sin movimientos aún</div>
        )}
        {txs.map((t) => (
          <div key={t.id} style={{ ...card, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={badge(t.type === "sale" ? "success" : "warning")}>
                <i className={`ti ${t.type === "sale" ? "ti-arrow-up" : "ti-arrow-down"}`} aria-hidden="true" />
              </span>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14, color: "var(--color-text-primary)" }}>{t.type === "sale" ? "Venta" : "Compra"} · {t.qty} u.</div>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{fmtDate(t.date)}{t.notes ? ` · ${t.notes}` : ""}</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 500, color: t.type === "sale" ? "var(--color-text-success)" : "var(--color-text-warning)" }}>{usd(t.total)}</div>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{usd(t.unitPrice)}/u</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ---- MAIN APP ----
  const TABS = [
    { id: "home", icon: "ti-home", label: "Inicio" },
    { id: "inventory", icon: "ti-box", label: "Inventario" },
    { id: "sales", icon: "ti-trending-up", label: "Ventas" },
    { id: "purchases", icon: "ti-shopping-cart", label: "Compras" },
  ];

  const filtered = products.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || "").toLowerCase().includes(search.toLowerCase()));
  const saleTxs = [...transactions].filter((t) => t.type === "sale").sort((a, b) => b.date.localeCompare(a.date));
  const purchaseTxs = [...transactions].filter((t) => t.type === "purchase").sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <h2 className="sr-only">FireControl — gestión de inventario</h2>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 0" }}>
        <div>
          <div style={{ fontWeight: 500, fontSize: 18, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ti ti-flame" style={{ color: "var(--color-text-danger)" }} aria-hidden="true" /> FireControl
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Control de inventario</div>
        </div>
        <button onClick={exportCSV} style={{ ...btn(), padding: "7px 14px", fontSize: 13 }}>
          <i className="ti ti-download" aria-hidden="true" /> CSV
        </button>
      </div>

      <Toast />

      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: "0.5px solid var(--color-border-tertiary)", margin: "12px 0 0", padding: "0 8px" }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, background: "none", border: "none", borderBottom: tab === t.id ? "2px solid var(--color-text-info)" : "2px solid transparent", padding: "10px 4px 8px", cursor: "pointer", color: tab === t.id ? "var(--color-text-info)" : "var(--color-text-secondary)", fontSize: 11, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, fontWeight: tab === t.id ? 500 : 400, fontFamily: "inherit" }}>
            <i className={`ti ${t.icon}`} style={{ fontSize: 20 }} aria-hidden="true" />
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "16px" }}>

        {/* ============ HOME ============ */}
        {tab === "home" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 10, marginBottom: 16 }}>
              <Metric label="Inventario" value={usd(stats.invValue)} sub={`${stats.units} unidades`} icon="ti-box" variant="default" />
              <Metric label="Ganancia" value={usd(stats.profit)} sub="Sobre costo" icon="ti-trending-up" variant="success" />
              <Metric label="Total ventas" value={usd(stats.revenue)} sub={`${saleTxs.length} transac.`} icon="ti-cash" variant="info" />
              <Metric label="Total invertido" value={usd(stats.invested)} sub={`${purchaseTxs.length} compras`} icon="ti-coin" variant="warning" />
            </div>

            {products.some((p) => p.stock <= 2) && (
              <div style={{ ...card, marginBottom: 16, borderColor: "var(--color-border-danger)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <i className="ti ti-alert-triangle" style={{ color: "var(--color-text-danger)", fontSize: 18 }} aria-hidden="true" />
                  <span style={{ fontWeight: 500, fontSize: 14, color: "var(--color-text-danger)" }}>Alerta de stock bajo</span>
                </div>
                {products.filter((p) => p.stock <= 2).map((p) => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderTop: "0.5px solid var(--color-border-tertiary)" }}>
                    <span style={{ fontSize: 14, color: "var(--color-text-primary)" }}>{p.name}</span>
                    <span style={badge(p.stock === 0 ? "danger" : "warning")}>{p.stock} u.</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ fontSize: 13, color: "var(--color-text-secondary)", fontWeight: 500, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Acciones rápidas</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 10, marginBottom: 24 }}>
              <button onClick={() => goSale()} style={{ ...btn("success"), width: "100%", padding: 12, justifyContent: "center", fontSize: 13 }}><i className="ti ti-receipt" aria-hidden="true" /> Nueva venta</button>
              <button onClick={() => goPurchase()} style={{ ...btn("warning"), width: "100%", padding: 12, justifyContent: "center", fontSize: 13 }}><i className="ti ti-package" aria-hidden="true" /> Nueva compra</button>
              <button onClick={() => goAddProduct()} style={{ ...btn("info"), width: "100%", padding: 12, justifyContent: "center", fontSize: 13 }}><i className="ti ti-plus" aria-hidden="true" /> Nuevo producto</button>
              <button onClick={exportCSV} style={{ ...btn(), width: "100%", padding: 12, justifyContent: "center", fontSize: 13 }}><i className="ti ti-download" aria-hidden="true" /> Exportar CSV</button>
            </div>

            <div style={{ fontSize: 13, color: "var(--color-text-secondary)", fontWeight: 500, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Últimos movimientos</div>
            {[...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6).map((t) => {
              const p = getProd(t.productId);
              return (
                <div key={t.id} style={{ ...card, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={badge(t.type === "sale" ? "success" : "warning")}>
                      <i className={`ti ${t.type === "sale" ? "ti-arrow-up" : "ti-arrow-down"}`} aria-hidden="true" />
                    </span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)" }}>{p?.name || "—"}</div>
                      <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{t.type === "sale" ? "Venta" : "Compra"} · {t.qty} u. · {fmtDate(t.date)}</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 500, color: t.type === "sale" ? "var(--color-text-success)" : "var(--color-text-warning)" }}>{usd(t.total)}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* ============ INVENTORY ============ */}
        {tab === "inventory" && (
          <div>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, position: "relative" }}>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar producto o SKU..." style={{ width: "100%", paddingLeft: 34 }} />
                <i className="ti ti-search" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-secondary)", fontSize: 16, pointerEvents: "none" }} aria-hidden="true" />
              </div>
              <button onClick={() => goAddProduct()} style={{ ...btn("info"), padding: "8px 14px", flexShrink: 0 }}>
                <i className="ti ti-plus" aria-hidden="true" />
              </button>
            </div>

            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-secondary)", fontSize: 14 }}>
                {products.length === 0 ? "Sin productos. ¡Agrega el primero!" : "Sin resultados para tu búsqueda"}
              </div>
            )}
            {filtered.map((p) => (
              <div key={p.id} onClick={() => { setDetailId(p.id); setView("detail"); }} style={{ ...card, marginBottom: 10, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                    <div style={{ fontWeight: 500, fontSize: 15, color: "var(--color-text-primary)", marginBottom: 2 }}>{p.name}</div>
                    {p.sku && <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{p.sku}</div>}
                  </div>
                  <span style={badge(p.stock <= 0 ? "danger" : p.stock <= 2 ? "warning" : "success")}>{p.stock} u.</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                  <span>Compra: <strong style={{ color: "var(--color-text-danger)" }}>{usd(p.purchasePrice)}</strong></span>
                  <span>Venta: <strong style={{ color: "var(--color-text-success)" }}>{usd(p.salePrice)}</strong></span>
                  <span>Margen: <strong style={{ color: "var(--color-text-warning)" }}>{usd(p.salePrice - p.purchasePrice)}</strong></span>
                </div>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Valor inventario: {usd(p.purchasePrice * p.stock)}</span>
                  <i className="ti ti-chevron-right" style={{ fontSize: 14 }} aria-hidden="true" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ============ SALES ============ */}
        {tab === "sales" && (
          <div>
            <div style={{ ...card, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 2 }}>Total en ventas</div>
                <div style={{ fontSize: 28, fontWeight: 500, color: "var(--color-text-success)" }}>{usd(saleTxs.reduce((s, t) => s + t.total, 0))}</div>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{saleTxs.length} transacciones</div>
              </div>
              <button onClick={() => goSale()} style={{ ...btn("success"), padding: "10px 18px" }}>
                <i className="ti ti-plus" aria-hidden="true" /> Nueva
              </button>
            </div>
            {saleTxs.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-secondary)", fontSize: 14 }}>Sin ventas registradas aún</div>}
            {saleTxs.map((t) => {
              const p = getProd(t.productId);
              return (
                <div key={t.id} style={{ ...card, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14, color: "var(--color-text-primary)", marginBottom: 2 }}>{p?.name || "—"}</div>
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                      {t.qty} u. × {usd(t.unitPrice)} · {fmtDate(t.date)}{t.notes ? ` · ${t.notes}` : ""}
                    </div>
                  </div>
                  <div style={{ fontWeight: 500, fontSize: 16, color: "var(--color-text-success)" }}>{usd(t.total)}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* ============ PURCHASES ============ */}
        {tab === "purchases" && (
          <div>
            <div style={{ ...card, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 2 }}>Total invertido</div>
                <div style={{ fontSize: 28, fontWeight: 500, color: "var(--color-text-warning)" }}>{usd(purchaseTxs.reduce((s, t) => s + t.total, 0))}</div>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{purchaseTxs.length} compras registradas</div>
              </div>
              <button onClick={() => goPurchase()} style={{ ...btn("warning"), padding: "10px 18px" }}>
                <i className="ti ti-plus" aria-hidden="true" /> Nueva
              </button>
            </div>
            {purchaseTxs.length === 0 && <div style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-secondary)", fontSize: 14 }}>Sin compras registradas aún</div>}
            {purchaseTxs.map((t) => {
              const p = getProd(t.productId);
              return (
                <div key={t.id} style={{ ...card, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14, color: "var(--color-text-primary)", marginBottom: 2 }}>{p?.name || "—"}</div>
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                      {t.qty} u. × {usd(t.unitPrice)} · {fmtDate(t.date)}{t.notes ? ` · ${t.notes}` : ""}
                    </div>
                  </div>
                  <div style={{ fontWeight: 500, fontSize: 16, color: "var(--color-text-warning)" }}>{usd(t.total)}</div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
