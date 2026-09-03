import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CircleDollarSign, Clock3, LockKeyhole } from "lucide-react";
import { api } from "../lib/api";
import { dateTime, money } from "../lib/format";
import type { CashRegister } from "../types";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";

function parseMoney(value: string) {
  return Number(value.replace(/\./g, "").replace(",", "."));
}

export function CashPage() {
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"open" | "close" | null>(null);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const current = useMemo(
    () => registers.find((register) => register.status === "open"),
    [registers],
  );

  async function load() {
    try {
      setRegisters(await api<CashRegister[]>("/cash/registers"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível consultar o caixa.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  function showModal(nextMode: "open" | "close") {
    setAmount("");
    setError("");
    setMode(nextMode);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    const value = parseMoney(amount);
    if (!Number.isFinite(value) || value < 0) return setError("Informe um valor válido.");
    setBusy(true);
    setError("");
    try {
      if (mode === "open")
        await api<CashRegister>("/cash/open", {
          method: "POST",
          body: JSON.stringify({ initialAmount: value }),
        });
      if (mode === "close" && current)
        await api<CashRegister>(`/cash/close/${current.id}`, {
          method: "POST",
          body: JSON.stringify({ closingAmount: value }),
        });
      setMessage(
        mode === "open"
          ? "Caixa aberto. Você já pode finalizar vendas."
          : "Caixa fechado com sucesso.",
      );
      setMode(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível concluir a operação.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Movimentação</span>
          <h1>Caixa</h1>
          <p>Abra, acompanhe e feche o caixa com segurança.</p>
        </div>
        {current ? (
          <Button variant="secondary" icon={<LockKeyhole />} onClick={() => showModal("close")}>
            Fechar caixa
          </Button>
        ) : (
          <Button icon={<CircleDollarSign />} onClick={() => showModal("open")}>
            Abrir caixa
          </Button>
        )}
      </header>
      {message && <div className="success-banner">{message}</div>}
      {error && !mode && <div className="form-error">{error}</div>}
      {loading ? (
        <section className="panel loading">Consultando caixa...</section>
      ) : current ? (
        <section className="cash-hero">
          <div>
            <span className="status status--light">
              <i /> Caixa aberto
            </span>
            <h2>Caixa #{current.id}</h2>
            <p>
              <Clock3 /> Aberto em {dateTime.format(new Date(current.openedAt))}
            </p>
          </div>
          <div>
            <span>Saldo inicial</span>
            <strong>{money(current.initialAmount)}</strong>
          </div>
        </section>
      ) : (
        <section className="panel closed-cash">
          <div className="metric-icon orange">
            <LockKeyhole />
          </div>
          <h2>O caixa está fechado</h2>
          <p>Abra o caixa e informe o valor disponível na gaveta antes de começar as vendas.</p>
          <Button onClick={() => showModal("open")}>Abrir caixa agora</Button>
        </section>
      )}
      <Modal
        open={mode !== null}
        title={mode === "open" ? "Abrir caixa" : "Fechar caixa"}
        onClose={() => setMode(null)}
      >
        <form className="cash-form" onSubmit={submit}>
          <p>
            {mode === "open"
              ? "Conte o dinheiro disponível na gaveta para iniciar o expediente."
              : "Conte todo o dinheiro disponível na gaveta antes de encerrar."}
          </p>
          <label>
            {mode === "open" ? "Saldo inicial" : "Valor contado"}
            <div className="money-field">
              <span>R$</span>
              <input
                autoFocus
                required
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
              />
            </div>
          </label>
          {error && <div className="form-error">{error}</div>}
          <footer className="modal-actions">
            <Button type="button" variant="ghost" onClick={() => setMode(null)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy
                ? "Confirmando..."
                : mode === "open"
                  ? "Confirmar abertura"
                  : "Confirmar fechamento"}
            </Button>
          </footer>
        </form>
      </Modal>
    </div>
  );
}
