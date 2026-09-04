import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus, Truck } from "lucide-react";
import { api } from "../lib/api";
import { dateTime, money } from "../lib/format";
import type { Product, Purchase, Supplier } from "../types";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { useAuth } from "../contexts/AuthContext";

type Line = { productId: number; quantity: string; unitCost: string };
const number = (value: string) => Number(value.replace(",", "."));
export function PurchasesPage() {
  const { session } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [mode, setMode] = useState<"supplier" | "purchase" | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [supplierName, setSupplierName] = useState("");
  const [document, setDocument] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [invoice, setInvoice] = useState("");
  const [lines, setLines] = useState<Line[]>([{ productId: 0, quantity: "1", unitCost: "0" }]);
  async function load() {
    setError("");
    try {
      const [s, p, h] = await Promise.all([
        api<Supplier[]>("/suppliers"),
        api<Product[]>("/products"),
        api<Purchase[]>("/purchases"),
      ]);
      setSuppliers(s);
      setProducts(p);
      setPurchases(h);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar compras.");
    }
  }
  useEffect(() => {
    void load();
  }, []);
  const total = useMemo(
    () => lines.reduce((sum, line) => sum + number(line.quantity) * number(line.unitCost), 0),
    [lines],
  );
  async function saveSupplier(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/suppliers", {
        method: "POST",
        body: JSON.stringify({
          name: supplierName,
          document: document.replace(/\D/g, "") || undefined,
        }),
      });
      setMode(null);
      setSupplierName("");
      setDocument("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar fornecedor.");
    } finally {
      setBusy(false);
    }
  }
  async function savePurchase(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const items = lines.map((line) => ({
        productId: line.productId,
        quantity: number(line.quantity),
        unitCost: number(line.unitCost),
      }));
      await api("/purchases", {
        method: "POST",
        body: JSON.stringify({
          idempotencyKey: crypto.randomUUID(),
          supplierId: Number(supplierId),
          invoiceNumber: invoice.trim() || undefined,
          items,
        }),
      });
      setMode(null);
      setLines([{ productId: 0, quantity: "1", unitCost: "0" }]);
      setInvoice("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao registrar compra.");
    } finally {
      setBusy(false);
    }
  }
  async function cancel(purchase: Purchase) {
    if (!confirm(`Estornar a compra #${purchase.id}?`)) return;
    try {
      await api(`/purchases/${purchase.id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao estornar compra.");
    }
  }
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Abastecimento</span>
          <h1>Fornecedores e compras</h1>
          <p>Registre entradas com rastreabilidade e atualização automática do estoque.</p>
        </div>
        <div className="header-actions">
          <Button
            variant="secondary"
            icon={<Truck />}
            onClick={() => {
              setError("");
              setMode("supplier");
            }}
          >
            Novo fornecedor
          </Button>
          <Button
            icon={<Plus />}
            onClick={() => {
              setError("");
              setMode("purchase");
            }}
          >
            Registrar compra
          </Button>
        </div>
      </header>
      {error && !mode && <div className="form-error">{error}</div>}
      <section className="panel table-panel">
        <div className="data-row purchase-row data-head">
          <span>Compra</span>
          <span>Fornecedor</span>
          <span>Nota</span>
          <span>Data</span>
          <span>Total</span>
          <span>Ações</span>
        </div>
        {purchases.map((purchase) => (
          <div className="data-row purchase-row" key={purchase.id}>
            <strong>
              #{purchase.id}
              <small>{purchase.cancelledAt ? "Estornada" : "Recebida"}</small>
            </strong>
            <span>{purchase.supplier.name}</span>
            <span>{purchase.invoiceNumber ?? "—"}</span>
            <span>{dateTime.format(new Date(purchase.receivedAt))}</span>
            <strong>{money(purchase.totalAmount)}</strong>
            <span>
              {!purchase.cancelledAt && session?.role !== "estoque" && (
                <Button variant="danger" onClick={() => cancel(purchase)}>
                  Estornar
                </Button>
              )}
            </span>
          </div>
        ))}
      </section>
      <Modal open={mode === "supplier"} title="Novo fornecedor" onClose={() => setMode(null)}>
        <form className="product-form" onSubmit={saveSupplier}>
          <label className="field field--wide">
            Nome
            <input
              required
              minLength={2}
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
            />
          </label>
          <label className="field field--wide">
            CPF/CNPJ (opcional)
            <input
              inputMode="numeric"
              value={document}
              onChange={(e) => setDocument(e.target.value)}
            />
          </label>
          {error && <div className="form-error field--wide">{error}</div>}
          <footer className="modal-actions field--wide">
            <Button type="button" variant="ghost" onClick={() => setMode(null)}>
              Cancelar
            </Button>
            <Button disabled={busy}>{busy ? "Salvando..." : "Salvar fornecedor"}</Button>
          </footer>
        </form>
      </Modal>
      <Modal open={mode === "purchase"} title="Registrar compra" onClose={() => setMode(null)}>
        <form className="purchase-form" onSubmit={savePurchase}>
          <label className="field">
            Fornecedor
            <select required value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">Selecione</option>
              {suppliers
                .filter((s) => s.active)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="field">
            Número da nota
            <input maxLength={60} value={invoice} onChange={(e) => setInvoice(e.target.value)} />
          </label>
          <div className="purchase-lines">
            {lines.map((line, index) => (
              <div className="purchase-line" key={index}>
                <select
                  required
                  value={line.productId || ""}
                  onChange={(e) =>
                    setLines((old) =>
                      old.map((item, i) =>
                        i === index ? { ...item, productId: Number(e.target.value) } : item,
                      ),
                    )
                  }
                >
                  <option value="">Produto</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                <input
                  required
                  inputMode="decimal"
                  aria-label="Quantidade"
                  value={line.quantity}
                  onChange={(e) =>
                    setLines((old) =>
                      old.map((item, i) =>
                        i === index ? { ...item, quantity: e.target.value } : item,
                      ),
                    )
                  }
                />
                <input
                  required
                  inputMode="decimal"
                  aria-label="Custo unitário"
                  value={line.unitCost}
                  onChange={(e) =>
                    setLines((old) =>
                      old.map((item, i) =>
                        i === index ? { ...item, unitCost: e.target.value } : item,
                      ),
                    )
                  }
                />
                <Button
                  type="button"
                  variant="danger"
                  disabled={lines.length === 1}
                  onClick={() => setLines((old) => old.filter((_, i) => i !== index))}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              setLines((old) => [...old, { productId: 0, quantity: "1", unitCost: "0" }])
            }
          >
            + Adicionar item
          </Button>
          <div className="payment-total">
            <span>Total calculado</span>
            <strong>{money(total)}</strong>
          </div>
          {error && <div className="form-error">{error}</div>}
          <footer className="modal-actions">
            <Button type="button" variant="ghost" onClick={() => setMode(null)}>
              Cancelar
            </Button>
            <Button
              disabled={
                busy ||
                !supplierId ||
                lines.some(
                  (line) =>
                    !line.productId || number(line.quantity) <= 0 || number(line.unitCost) < 0,
                )
              }
            >
              {busy ? "Registrando..." : "Confirmar entrada"}
            </Button>
          </footer>
        </form>
      </Modal>
    </div>
  );
}
