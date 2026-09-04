import { ArrowRight, CircleDollarSign, PackageCheck, ShoppingCart, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { money } from "../lib/format";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import type { DashboardReport, Product } from "../types";
import { Button } from "../components/ui/Button";
import { getGreeting } from "../lib/presentation";

export function DashboardPage() {
  const [report, setReport] = useState<DashboardReport | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(new Date());
  const load = useCallback(async () => {
    setError("");
    try {
      const [nextReport, nextProducts] = await Promise.all([
        api<DashboardReport>("/reports/dashboard"),
        api<Product[]>("/products"),
      ]);
      setReport(nextReport);
      setProducts(nextProducts);
      setUpdatedAt(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível carregar o painel.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
    const timer = window.setInterval(load, 60_000);
    return () => window.clearInterval(timer);
  }, [load]);
  const currentCash = report?.cashRegisters.find((register) => register.status === "open");
  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(
        new Date(),
      ),
    [],
  );
  const lowStock = products.filter(
    (product) => Number(product.stockQuantity) <= Number(product.lowStockThreshold),
  ).length;
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">{dateLabel}</span>
          <h1>{getGreeting()}! Vamos vender?</h1>
          <p>Acompanhe o movimento da sua mercearia hoje.</p>
        </div>
        <Link className="button button--primary" to="/pdv">
          <ShoppingCart />
          Abrir nova venda
        </Link>
      </header>
      {error && (
        <div className="form-error">
          {error}{" "}
          <Button variant="ghost" onClick={load}>
            Tentar novamente
          </Button>
        </div>
      )}
      {loading && <section className="panel loading">Atualizando visão geral...</section>}
      {!loading && (
        <>
          <section className="metrics">
            <article>
              <div className="metric-icon green">
                <CircleDollarSign />
              </div>
              <span>Vendas de hoje</span>
              <strong>{money(report?.totalSales ?? 0)}</strong>
              <small>
                <TrendingUp /> Atualizado às{" "}
                {updatedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </small>
            </article>
            <article>
              <div className="metric-icon orange">
                <ShoppingCart />
              </div>
              <span>Vendas realizadas</span>
              <strong>{report?.salesCount ?? 0}</strong>
              <small>Hoje</small>
            </article>
            <article>
              <div className="metric-icon blue">
                <PackageCheck />
              </div>
              <span>Produtos cadastrados</span>
              <strong>{products.length}</strong>
              <small>{lowStock ? `${lowStock} com estoque baixo` : "Estoque em dia"}</small>
            </article>
          </section>
          <section className="dashboard-grid">
            <article className="panel quick-sale">
              <span className="eyebrow">Atalho rápido</span>
              <h2>Caixa livre</h2>
              <p>Comece uma venda e encontre produtos pelo nome ou código de barras.</p>
              <Link to="/pdv">
                Começar venda <ArrowRight />
              </Link>
            </article>
            <article className="panel">
              <div className="panel-title">
                <div>
                  <span className="eyebrow">Agora</span>
                  <h2>Resumo do caixa</h2>
                </div>
                <span className="status">
                  <i /> {currentCash ? "Caixa aberto" : "Caixa fechado"}
                </span>
              </div>
              <div className="summary-row">
                <span>Saldo inicial</span>
                <strong>{currentCash ? money(currentCash.initialAmount) : "—"}</strong>
              </div>
              <div className="summary-row">
                <span>Total vendido hoje</span>
                <strong>{money(report?.totalSales ?? 0)}</strong>
              </div>
              <div className="summary-row">
                <span>Fiado em aberto</span>
                <strong>{money(report?.outstandingCredit ?? 0)}</strong>
              </div>
            </article>
          </section>
        </>
      )}
    </div>
  );
}
