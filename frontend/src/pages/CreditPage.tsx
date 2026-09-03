import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CheckCircle2, Clock3, Plus, Search, ShoppingCart, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { dateTime, money } from "../lib/format";
import type { Customer, Sale } from "../types";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";

export function CreditPage() {
  const navigate = useNavigate();
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [paying, setPaying] = useState<Customer | null>(null);
  const [paymentDigits, setPaymentDigits] = useState("");
  async function load() {
    try {
      const [creditSales, customerList] = await Promise.all([
        api<Sale[]>("/credits"),
        api<Customer[]>("/customers"),
      ]);
      setSales(creditSales);
      setCustomers(customerList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar clientes.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  const shownCustomers = customers.filter((customer) =>
    `${customer.name} ${customer.phone ?? ""}`.toLowerCase().includes(filter.toLowerCase()),
  );
  const balance = (sale: Sale) => Number(sale.totalAmount) - Number(sale.creditPaidAmount ?? 0);
  const openTotal = useMemo(
    () => sales.filter((sale) => !sale.creditPaidAt).reduce((sum, sale) => sum + balance(sale), 0),
    [sales],
  );
  const customerDebt = (id: number) =>
    sales
      .filter((sale) => sale.customerId === id && !sale.creditPaidAt)
      .reduce((sum, sale) => sum + balance(sale), 0);
  const paymentValue = Number(paymentDigits || "0") / 100;
  function startCredit(customer: Customer) {
    navigate(`/pdv?customerId=${customer.id}&payment=fiado`);
  }
  function openPayment(customer: Customer) {
    setPaying(customer);
    setPaymentDigits("");
    setError("");
  }
  async function createCustomer(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const customer = await api<Customer>("/customers", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
        }),
      });
      setCustomers((current) =>
        [...current, customer].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setForm({ name: "", phone: "" });
      setModal(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível cadastrar o cliente.");
    } finally {
      setSaving(false);
    }
  }
  async function receive(event: FormEvent) {
    event.preventDefault();
    if (!paying || paymentValue <= 0) return;
    setSaving(true);
    setError("");
    try {
      await api(`/customers/${paying.id}/credit-payments`, {
        method: "POST",
        body: JSON.stringify({ amount: paymentValue }),
      });
      setPaying(null);
      setPaymentDigits("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível registrar o pagamento.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Caderneta digital</span>
          <h1>Clientes e fiado</h1>
          <p>Receba valores parciais ou quite toda a conta do cliente.</p>
        </div>
        <div className="credit-header-actions">
          <div className="credit-total">
            <span>Total a receber</span>
            <strong>{money(openTotal)}</strong>
          </div>
          <Button icon={<Plus />} onClick={() => setModal(true)}>
            Cadastrar cliente
          </Button>
        </div>
      </header>
      {error && !paying && <div className="form-error">{error}</div>}
      <section className="panel customer-panel">
        <div className="toolbar">
          <div className="compact-search">
            <Search />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Buscar por nome ou telefone..."
            />
          </div>
          <span>{customers.length} clientes</span>
        </div>
        {loading ? (
          <div className="loading">Carregando clientes...</div>
        ) : !shownCustomers.length ? (
          <EmptyState
            title="Nenhum cliente encontrado"
            description="Cadastre o primeiro cliente para iniciar uma venda no fiado."
          />
        ) : (
          <div className="customer-grid">
            {shownCustomers.map((customer) => {
              const debt = customerDebt(customer.id);
              return (
                <article key={customer.id}>
                  <div className="customer-avatar">
                    <UserRound />
                  </div>
                  <div>
                    <strong>{customer.name}</strong>
                    <span>{customer.phone || "Telefone não informado"}</span>
                  </div>
                  <div className="customer-debt">
                    <small>Em aberto</small>
                    <strong>{money(debt)}</strong>
                  </div>
                  <div className="customer-actions">
                    <Button icon={<ShoppingCart />} onClick={() => startCredit(customer)}>
                      Nova venda
                    </Button>
                    {debt > 0 && (
                      <Button variant="secondary" onClick={() => openPayment(customer)}>
                        Receber pagamento
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
      <section className="panel table-panel credit-history">
        <div className="toolbar">
          <strong>Histórico de vendas fiadas</strong>
          <span>{sales.filter((sale) => !sale.creditPaidAt).length} em aberto</span>
        </div>
        {!sales.length ? (
          <EmptyState
            title="Nenhuma venda no fiado"
            description="As compras feitas para pagar depois aparecerão aqui."
          />
        ) : (
          <div className="credit-list">
            {sales.map((sale) => (
              <article key={sale.id} className={sale.creditPaidAt ? "paid" : ""}>
                <div className="customer-avatar">
                  <UserRound />
                </div>
                <div>
                  <strong>{sale.customer?.name ?? "Venda antiga sem cliente"}</strong>
                  <span>
                    Venda #{sale.id} · {dateTime.format(new Date(sale.createdAt))}
                  </span>
                </div>
                <div className="credit-value">
                  <strong>
                    {sale.creditPaidAt
                      ? money(sale.totalAmount)
                      : `${money(balance(sale))} em aberto`}
                  </strong>
                  <span>
                    {sale.creditPaidAt ? (
                      <>
                        <CheckCircle2 /> Quitado
                      </>
                    ) : (
                      <>
                        <Clock3 /> Pago {money(sale.creditPaidAmount ?? 0)} de{" "}
                        {money(sale.totalAmount)}
                      </>
                    )}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <Modal open={modal} title="Cadastrar cliente" onClose={() => setModal(false)}>
        <form className="customer-form" onSubmit={createCustomer}>
          <label>
            Nome completo
            <input
              autoFocus
              required
              minLength={2}
              maxLength={120}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nome do cliente"
            />
          </label>
          <label>
            Telefone (opcional)
            <input
              maxLength={30}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="(00) 00000-0000"
            />
          </label>
          <footer className="modal-actions">
            <Button type="button" variant="ghost" onClick={() => setModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Cadastrar cliente"}
            </Button>
          </footer>
        </form>
      </Modal>
      <Modal
        open={Boolean(paying)}
        title={`Receber de ${paying?.name ?? "cliente"}`}
        onClose={() => setPaying(null)}
      >
        {paying && (
          <form className="customer-form" onSubmit={receive}>
            <div className="payment-balance">
              <span>Saldo total em aberto</span>
              <strong>{money(customerDebt(paying.id))}</strong>
            </div>
            <label>
              Valor recebido
              <div className="money-field">
                <span>R$</span>
                <input
                  autoFocus
                  inputMode="numeric"
                  value={paymentValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  onChange={(e) =>
                    setPaymentDigits(e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, ""))
                  }
                />
              </div>
            </label>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPaymentDigits(String(Math.round(customerDebt(paying.id) * 100)))}
            >
              Preencher pagamento total
            </Button>
            {error && <div className="form-error">{error}</div>}
            <footer className="modal-actions">
              <Button type="button" variant="ghost" onClick={() => setPaying(null)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving || paymentValue <= 0 || paymentValue > customerDebt(paying.id)}
              >
                {saving
                  ? "Registrando..."
                  : paymentValue === customerDebt(paying.id)
                    ? "Quitar saldo total"
                    : "Registrar pagamento parcial"}
              </Button>
            </footer>
          </form>
        )}
      </Modal>
    </div>
  );
}
