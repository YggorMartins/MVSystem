import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CircleDollarSign,
  Clock3,
  LockKeyhole,
} from "lucide-react";
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
  const [mode, setMode] = useState<"open" | "close" | "in" | "out" | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
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

  function showModal(nextMode: "open" | "close" | "in" | "out") {
    setAmount("");
    setDescription("");
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
      if ((mode === "in" || mode === "out") && current)
        await api("/cash/movement", {
          method: "POST",
          body: JSON.stringify({
            cashRegisterId: current.id,
            type: mode,
            amount: value,
            description: description.trim() || undefined,
          }),
        });
      setMessage(
        mode === "open"
          ? "Caixa aberto. Você já pode finalizar vendas."
          : mode === "close"
            ? "Caixa fechado com sucesso."
            : "Movimentação registrada com sucesso.",
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
          <div className="header-actions">
            <Button variant="secondary" icon={<ArrowUpCircle />} onClick={() => showModal("in")}>
              Suprimento
            </Button>
            <Button variant="danger" icon={<ArrowDownCircle />} onClick={() => showModal("out")}>
              Sangria
            </Button>
            <Button variant="secondary" icon={<LockKeyhole />} onClick={() => showModal("close")}>
              Fechar caixa
            </Button>
          </div>
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
            <span>Saldo esperado</span>
            <strong>{money(current.expectedBalance ?? current.initialAmount)}</strong>
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
      {!loading && registers.length > 0 && (
        <section className="panel table-panel cash-history">
          <div className="data-row cash-row data-head">
            <span>Caixa</span>
            <span>Período</span>
            <span>Esperado</span>
            <span>Contado</span>
            <span>Diferença</span>
          </div>
          {registers.slice(0, 20).map((register) => (
            <div className="data-row cash-row" key={register.id}>
              <strong>
                #{register.id}
                <small>{register.status === "open" ? "Aberto" : "Fechado"}</small>
              </strong>
              <span>
                {dateTime.format(new Date(register.openedAt))}
                {register.closedAt ? ` — ${dateTime.format(new Date(register.closedAt))}` : ""}
              </span>
              <span>{money(register.expectedBalance ?? register.initialAmount)}</span>
              <span>{register.closingAmount == null ? "—" : money(register.closingAmount)}</span>
              <strong>{register.difference == null ? "—" : money(register.difference)}</strong>
            </div>
          ))}
        </section>
      )}
      <Modal
        open={mode !== null}
        title={
          mode === "open"
            ? "Abrir caixa"
            : mode === "close"
              ? "Fechar caixa"
              : mode === "in"
                ? "Registrar suprimento"
                : "Registrar sangria"
        }
        onClose={() => setMode(null)}
      >
        <form className="cash-form" onSubmit={submit}>
          <p>
            {mode === "open"
              ? "Conte o dinheiro disponível na gaveta para iniciar o expediente."
              : mode === "close"
                ? `Conte a gaveta. O saldo esperado é ${money(current?.expectedBalance ?? 0)}.`
                : mode === "in"
                  ? "Informe o dinheiro acrescentado à gaveta."
                  : "Informe o dinheiro retirado da gaveta."}
          </p>
          <label>
            {mode === "open" ? "Saldo inicial" : mode === "close" ? "Valor contado" : "Valor"}
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
          {(mode === "in" || mode === "out") && (
            <label className="field">
              Descrição
              <input
                maxLength={500}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  mode === "in" ? "Ex.: Reforço de troco" : "Ex.: Pagamento de fornecedor"
                }
              />
            </label>
          )}
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
                  : mode === "close"
                    ? "Confirmar fechamento"
                    : "Registrar movimentação"}
            </Button>
          </footer>
        </form>
      </Modal>
    </div>
  );
}
