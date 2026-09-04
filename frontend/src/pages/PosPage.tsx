import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CircleCheck, RotateCcw, ShoppingBag } from "lucide-react";
import { api } from "../lib/api";
import { money } from "../lib/format";
import type {
  CartItem,
  CashRegister,
  FiscalDocument,
  PaymentMethod,
  Product,
  Sale,
} from "../types";
import { ProductSearch } from "../components/pos/ProductSearch";
import { CartTable } from "../components/pos/CartTable";
import { PaymentModal } from "../components/pos/PaymentModal";
import { Button } from "../components/ui/Button";
import { useAuth } from "../contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { ReceiptModal } from "../components/pos/ReceiptModal";
import { createBarcodeAccumulator } from "../lib/barcode";

export function PosPage() {
  const { session } = useAuth();
  const canRemove = session?.role === "admin";
  const [searchParams] = useSearchParams();
  const presetCustomerId = Number(searchParams.get("customerId")) || undefined;
  const presetMethod = searchParams.get("payment") === "fiado" ? ("fiado" as const) : undefined;
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [query, setQuery] = useState("");
  const [payment, setPayment] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    api<Product[]>("/products")
      .then(setProducts)
      .catch((e) => setMessage(e.message));
  }, []);
  const total = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0),
    [cart],
  );
  const matches = query.trim()
    ? products
        .filter((p) => `${p.name} ${p.barcode}`.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 6)
    : [];
  const add = useCallback((product: Product) => {
    setCart((old) => {
      const found = old.find((i) => i.product.id === product.id);
      return found
        ? old.map((i) => (i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i))
        : [...old, { product, quantity: 1 }];
    });
    setQuery("");
    inputRef.current?.focus();
  }, []);
  const search = () => {
    const exact = products.find((p) => p.barcode === query.trim()) ?? matches[0];
    if (exact) add(exact);
    else setMessage("Produto não encontrado.");
  };
  useEffect(() => {
    const read = createBarcodeAccumulator((barcode) => {
      const product = products.find((item) => item.barcode === barcode);
      if (product) add(product);
      else setMessage(`Código ${barcode} não encontrado.`);
    });
    const listener = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      )
        return;
      read(event.key);
    };
    window.addEventListener("keydown", listener, true);
    return () => window.removeEventListener("keydown", listener, true);
  }, [products, add]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "F4" && cart.length) {
        e.preventDefault();
        setPaymentError("");
        setPayment(true);
      }
      if (e.key === "Escape") setPayment(false);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [cart.length]);
  function openPayment() {
    setPaymentError("");
    setPayment(true);
  }
  async function finish(method: PaymentMethod, customerId?: number) {
    if (busy) return;
    setBusy(true);
    setPaymentError("");
    try {
      const registers = await api<CashRegister[]>("/cash/registers");
      const register = registers.find((r) => r.status === "open");
      if (!register)
        throw new Error("O caixa está fechado. Abra o caixa antes de finalizar a venda.");
      const sale = await api<Sale>("/sales", {
        method: "POST",
        body: JSON.stringify({
          idempotencyKey: crypto.randomUUID(),
          paymentMethod: method,
          cashRegisterId: register.id,
          ...(method === "fiado" ? { customerId } : {}),
          items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        }),
      });
      setCart([]);
      setPayment(false);
      setCompletedSale(sale);
      setMessage("Venda finalizada com sucesso!");
    } catch (e) {
      setPaymentError(e instanceof Error ? e.message : "Erro ao finalizar a venda.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="pos-page">
      <header className="pos-header">
        <div>
          <span className="eyebrow">Ponto de venda</span>
          <h1>Nova venda</h1>
        </div>
        <span className="status">
          <i /> Caixa em atendimento
        </span>
      </header>
      {message && (
        <button className="toast" onClick={() => setMessage("")}>
          <CircleCheck />
          {message}
        </button>
      )}
      <div className="pos-layout">
        <section className="sale-panel">
          <ProductSearch ref={inputRef} value={query} onChange={setQuery} onSubmit={search} />
          {matches.length > 0 && (
            <div className="search-results">
              {matches.map((p) => (
                <button key={p.id} onClick={() => add(p)}>
                  <div>
                    <strong>{p.name}</strong>
                    <span>
                      {p.barcode} · Estoque {Number(p.stockQuantity).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <b>{money(p.price)}</b>
                </button>
              ))}
            </div>
          )}
          <div className="sale-panel__heading">
            <div>
              <ShoppingBag />
              <div>
                <h2>Itens da venda</h2>
                <span>
                  {cart.length} {cart.length === 1 ? "produto" : "produtos"}
                </span>
              </div>
            </div>
            {cart.length > 0 && canRemove && (
              <button onClick={() => setCart([])}>
                <RotateCcw /> Limpar venda
              </button>
            )}
          </div>
          <CartTable
            items={cart}
            canRemove={canRemove}
            onQuantity={(id, value) =>
              setCart((old) =>
                value <= 0
                  ? canRemove
                    ? old.filter((i) => i.product.id !== id)
                    : old
                  : old.map((i) =>
                      i.product.id === id ? { ...i, quantity: Math.round(value * 1000) / 1000 } : i,
                    ),
              )
            }
            onRemove={(id) => canRemove && setCart((old) => old.filter((i) => i.product.id !== id))}
          />
        </section>
        <aside className="checkout-card">
          <span>Resumo da venda</span>
          <div>
            <span>Subtotal</span>
            <strong>{money(total)}</strong>
          </div>
          <div>
            <span>Descontos</span>
            <strong>{money(0)}</strong>
          </div>
          <div className="checkout-total">
            <span>Total a pagar</span>
            <strong>{money(total)}</strong>
          </div>
          <Button disabled={!cart.length} onClick={openPayment}>
            Receber pagamento <kbd>F4</kbd>
          </Button>
          <p>Os preços e o total final são confirmados com segurança pelo sistema.</p>
        </aside>
      </div>
      <PaymentModal
        open={payment}
        total={total}
        busy={busy}
        error={paymentError}
        initialMethod={presetMethod}
        initialCustomerId={presetCustomerId}
        onClose={() => setPayment(false)}
        onConfirm={finish}
      />
      <ReceiptModal
        sale={completedSale}
        canFiscal={session?.role === "admin" || session?.role === "gerente"}
        onClose={() => setCompletedSale(null)}
        onFiscal={async () => {
          if (!completedSale) return;
          try {
            const fiscalDocument = await api<FiscalDocument>(
              `/sales/${completedSale.id}/nfce/simulate`,
              { method: "POST" },
            );
            setCompletedSale({ ...completedSale, fiscalDocument });
          } catch (e) {
            setMessage(e instanceof Error ? e.message : "Não foi possível simular a NFC-e.");
          }
        }}
      />
    </div>
  );
}
