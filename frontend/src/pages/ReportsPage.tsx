import {
  Banknote,
  CreditCard,
  NotebookTabs,
  PackageCheck,
  ReceiptText,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { dateTime, money, quantity } from "../lib/format";
import type { DashboardReport, PaymentMethod, Sale } from "../types";

const labels: Record<PaymentMethod, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao_debito: "Cartão de débito",
  cartao_credito: "Cartão de crédito",
  fiado: "Fiado",
};

export function ReportsPage() {
  const { session } = useAuth();
  const [report, setReport] = useState<DashboardReport | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [selected, setSelected] = useState<Sale | null>(null);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState<number | null>(null);
  async function load() {
    try {
      const [nextReport, nextSales] = await Promise.all([
        api<DashboardReport>("/reports/dashboard"),
        api<Sale[]>("/sales"),
      ]);
      setReport(nextReport);
      setSales(nextSales);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar relatório.");
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function cancelSale(sale: Sale) {
    if (
      !window.confirm(
        `Cancelar a venda #${sale.id} no valor de ${money(sale.totalAmount)}? O estoque será devolvido.`,
      )
    )
      return;
    setCancelling(sale.id);
    setError("");
    try {
      await api(`/sales/${sale.id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível cancelar a venda.");
    } finally {
      setCancelling(null);
    }
  }
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Resultados de hoje</span>
          <h1>Relatórios</h1>
          <p>Vendas, recebimentos e movimento do dia em um só lugar.</p>
        </div>
        <Link className="button button--secondary" to="/relatorios/estoque">
          <PackageCheck />
          Relatório de estoque
        </Link>
      </header>
      {error && <div className="form-error">{error}</div>}
      {!report ? (
        <section className="panel loading">Carregando relatório...</section>
      ) : (
        <>
          <section className="metrics report-metrics">
            <article>
              <div className="metric-icon green">
                <TrendingUp />
              </div>
              <span>Total vendido</span>
              <strong>{money(report.totalSales)}</strong>
              <small>{report.salesCount} vendas hoje</small>
            </article>
            <article>
              <div className="metric-icon blue">
                <PackageCheck />
              </div>
              <span>Itens vendidos</span>
              <strong>{quantity(report.totalItems)}</strong>
              <small>Unidades e quilos</small>
            </article>
            <article>
              <div className="metric-icon orange">
                <NotebookTabs />
              </div>
              <span>Fiado em aberto</span>
              <strong>{money(report.outstandingCredit)}</strong>
              <small>Recebido no mês: {money(report.creditReceivedThisMonth ?? 0)}</small>
            </article>
          </section>
          <div className="reports-grid">
            <section className="panel">
              <div className="panel-title">
                <div>
                  <span className="eyebrow">Recebimentos</span>
                  <h2>Por forma de pagamento</h2>
                </div>
                <Banknote />
              </div>
              <div className="payment-report">
                {(Object.keys(labels) as PaymentMethod[]).map((method) => (
                  <div key={method}>
                    <span>
                      {labels[method]}
                      <small>{report.byPaymentMethod[method]?.count ?? 0} vendas</small>
                    </span>
                    <strong>{money(report.byPaymentMethod[method]?.total ?? 0)}</strong>
                  </div>
                ))}
              </div>
            </section>
            <section className="panel">
              <div className="panel-title">
                <div>
                  <span className="eyebrow">Últimos lançamentos</span>
                  <h2>Vendas recentes</h2>
                </div>
                <ReceiptText />
              </div>
              {!report.recentSales.length ? (
                <p className="muted">Nenhuma venda registrada hoje.</p>
              ) : (
                <div className="recent-sales">
                  {report.recentSales.map((sale) => (
                    <div key={sale.id}>
                      <div className="sale-badge">
                        <CreditCard />
                      </div>
                      <span>
                        <strong>Venda #{sale.id}</strong>
                        <small>
                          {labels[sale.paymentMethod]} · {dateTime.format(new Date(sale.createdAt))}
                        </small>
                      </span>
                      <strong>{money(sale.totalAmount)}</strong>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
          <section className="panel sales-history">
            <div className="panel-title">
              <div>
                <span className="eyebrow">Área administrativa</span>
                <h2>Gerenciar vendas</h2>
                <p>Visualize os itens ou cancele uma venda para devolver o estoque.</p>
              </div>
              <span>{sales.length} registros</span>
            </div>
            <div className="sales-history-list">
              {sales.map((sale) => (
                <article key={sale.id} className={sale.cancelledAt ? "cancelled" : ""}>
                  <button className="sale-main" onClick={() => setSelected(sale)}>
                    <strong>Venda #{sale.id}</strong>
                    <span>
                      {dateTime.format(new Date(sale.createdAt))} · {labels[sale.paymentMethod]}
                    </span>
                  </button>
                  <strong>{money(sale.totalAmount)}</strong>
                  <span className={sale.cancelledAt ? "cancelled-label" : "sale-ok"}>
                    {sale.cancelledAt ? "Cancelada" : "Concluída"}
                  </span>
                  <div className="sale-actions">
                    <Button variant="secondary" onClick={() => setSelected(sale)}>
                      Ver detalhes
                    </Button>
                    {session?.role === "admin" && !sale.cancelledAt && (
                      <Button
                        variant="danger"
                        disabled={cancelling === sale.id}
                        onClick={() => cancelSale(sale)}
                        icon={<XCircle />}
                      >
                        {cancelling === sale.id ? "Cancelando..." : "Cancelar"}
                      </Button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
          <Modal
            open={Boolean(selected)}
            title={`Detalhes da venda #${selected?.id ?? ""}`}
            onClose={() => setSelected(null)}
          >
            {selected && (
              <div className="sale-details">
                <div className="sale-detail-meta">
                  <span>
                    <small>Data e hora</small>
                    <strong>{dateTime.format(new Date(selected.createdAt))}</strong>
                  </span>
                  <span>
                    <small>Pagamento</small>
                    <strong>{labels[selected.paymentMethod]}</strong>
                  </span>
                  {selected.customer && (
                    <span>
                      <small>Cliente</small>
                      <strong>{selected.customer.name}</strong>
                    </span>
                  )}
                </div>
                <div className="sale-detail-items">
                  <div className="sale-detail-head">
                    <span>Produto</span>
                    <span>Qtd.</span>
                    <span>Unitário</span>
                    <span>Total</span>
                  </div>
                  {selected.items?.map((item) => (
                    <div key={item.id}>
                      <strong>{item.product?.name ?? `Produto #${item.product?.id ?? ""}`}</strong>
                      <span>
                        {quantity(item.quantity)} {item.product?.unit ?? "UN"}
                      </span>
                      <span>{money(item.unitPrice ?? item.product?.price ?? 0)}</span>
                      <strong>
                        {money(
                          Number(item.quantity) *
                            Number(item.unitPrice ?? item.product?.price ?? 0),
                        )}
                      </strong>
                    </div>
                  ))}
                </div>
                <footer>
                  <span>Total da venda</span>
                  <strong>{money(selected.totalAmount)}</strong>
                </footer>
              </div>
            )}
          </Modal>
        </>
      )}
    </div>
  );
}
