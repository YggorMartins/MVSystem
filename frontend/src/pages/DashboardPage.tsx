import { ArrowRight, CircleDollarSign, PackageCheck, ShoppingCart, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { money } from "../lib/format";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { DashboardReport, Product } from "../types";

export function DashboardPage() {
  const [report, setReport] = useState<DashboardReport | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    api<DashboardReport>("/reports/dashboard").then(setReport);
    api<Product[]>("/products").then(setProducts);
  }, []);
  const currentCash = report?.cashRegisters.find((register) => register.status === "open");
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Quinta-feira, 3 de setembro</span>
          <h1>Bom dia! Vamos vender?</h1>
          <p>Acompanhe o movimento da sua mercearia hoje.</p>
        </div>
        <Link className="button button--primary" to="/pdv">
          <ShoppingCart />
          Abrir nova venda
        </Link>
      </header>
      <section className="metrics">
        <article>
          <div className="metric-icon green">
            <CircleDollarSign />
          </div>
          <span>Vendas de hoje</span>
          <strong>{money(report?.totalSales ?? 0)}</strong>
          <small>
            <TrendingUp /> Atualizado agora
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
          <small>Itens no catálogo</small>
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
    </div>
  );
}
