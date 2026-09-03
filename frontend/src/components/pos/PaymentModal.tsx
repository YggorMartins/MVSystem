import { useEffect, useState } from "react";
import { Banknote, CreditCard, Landmark, NotebookTabs, QrCode } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { money } from "../../lib/format";
import type { PaymentMethod } from "../../types";
import type { Customer } from "../../types";
import { api } from "../../lib/api";

const methods = [
  ["dinheiro", "Dinheiro", Banknote, "F5"],
  ["pix", "Pix", QrCode, "F6"],
  ["cartao_debito", "Débito", CreditCard, "F7"],
  ["cartao_credito", "Crédito", Landmark, "F8"],
  ["fiado", "Fiado", NotebookTabs, "F9"],
] as const;

export function PaymentModal({
  open,
  total,
  busy,
  error,
  initialMethod,
  initialCustomerId,
  onClose,
  onConfirm,
}: {
  open: boolean;
  total: number;
  busy: boolean;
  error?: string;
  initialMethod?: PaymentMethod;
  initialCustomerId?: number;
  onClose(): void;
  onConfirm(method: PaymentMethod, customerId?: number): void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("dinheiro");
  const [received, setReceived] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerError, setCustomerError] = useState("");
  useEffect(() => {
    if (open) {
      setMethod(initialMethod ?? "dinheiro");
      setCustomerId(initialCustomerId ? String(initialCustomerId) : "");
      setReceived("");
    }
  }, [open, initialMethod, initialCustomerId]);
  useEffect(() => {
    if (open)
      api<Customer[]>("/customers")
        .then(setCustomers)
        .catch(() => undefined);
  }, [open]);
  const receivedValue = Number(received || "0") / 100;
  const change = Math.max(0, receivedValue - total);
  const receivedDisplay = receivedValue.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const canConfirm =
    !busy &&
    (method !== "dinheiro" || receivedValue >= total) &&
    (method !== "fiado" || Boolean(customerId));
  async function addCustomer() {
    if (customerName.trim().length < 2) return setCustomerError("Informe o nome do cliente.");
    try {
      const customer = await api<Customer>("/customers", {
        method: "POST",
        body: JSON.stringify({ name: customerName.trim() }),
      });
      setCustomers((current) => [...current, customer]);
      setCustomerId(String(customer.id));
      setCustomerName("");
      setCustomerError("");
    } catch (e) {
      setCustomerError(e instanceof Error ? e.message : "Erro ao cadastrar cliente.");
    }
  }
  useEffect(() => {
    if (!open) return;
    const shortcuts: Record<string, PaymentMethod> = {
      F5: "dinheiro",
      F6: "pix",
      F7: "cartao_debito",
      F8: "cartao_credito",
      F9: "fiado",
    };
    const handleKey = (event: KeyboardEvent) => {
      if (shortcuts[event.key]) {
        event.preventDefault();
        setMethod(shortcuts[event.key]);
        return;
      }
      if (event.key === "Enter" && canConfirm && !event.repeat) {
        event.preventDefault();
        onConfirm(method, customerId ? Number(customerId) : undefined);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, canConfirm, method, customerId, onConfirm]);
  return (
    <Modal open={open} title="Receber pagamento" onClose={onClose}>
      <div className="payment-total">
        <span>Total da venda</span>
        <strong>{money(total)}</strong>
      </div>
      <div className="payment-methods">
        {methods.map(([id, label, Icon, key]) => (
          <button
            type="button"
            key={id}
            className={method === id ? "selected" : ""}
            onClick={() => setMethod(id)}
          >
            <Icon />
            <span>{label}</span>
            <small>{key}</small>
          </button>
        ))}
      </div>
      {method === "dinheiro" && (
        <div className="cash-received">
          <label>
            Valor recebido
            <input
              autoFocus
              inputMode="numeric"
              value={receivedDisplay}
              onChange={(e) =>
                setReceived(e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, ""))
              }
              placeholder="0,00"
              aria-label="Valor recebido em reais"
            />
          </label>
          <div>
            <span>Troco</span>
            <strong>{money(change)}</strong>
          </div>
        </div>
      )}
      {method === "fiado" && (
        <div className="credit-customer">
          <label>
            Cliente
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Selecione quem vai comprar</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </label>
          <div>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Ou cadastre um novo cliente"
            />
            <Button type="button" variant="secondary" onClick={addCustomer}>
              Adicionar
            </Button>
          </div>
          {customerError && <small>{customerError}</small>}
        </div>
      )}
      {error && (
        <div className="form-error payment-error" role="alert">
          {error}
        </div>
      )}
      <footer className="modal-actions">
        <Button type="button" variant="ghost" onClick={onClose}>
          Voltar · Esc
        </Button>
        <Button
          type="button"
          disabled={!canConfirm}
          onClick={() => onConfirm(method, customerId ? Number(customerId) : undefined)}
        >
          {busy ? "Finalizando..." : "Confirmar venda · Enter"}
        </Button>
      </footer>
    </Modal>
  );
}
