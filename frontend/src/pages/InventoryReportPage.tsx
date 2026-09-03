import { useEffect, useState } from "react";
import { ArrowLeft, Boxes, Printer, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { dateTime, money, quantity } from "../lib/format";
import type { InventoryReport } from "../types";
import { Button } from "../components/ui/Button";

export function InventoryReportPage() {
  const [report, setReport] = useState<InventoryReport | null>(null);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [categoryId, setCategoryId] = useState("");
  const [stock, setStock] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  async function load(initial = false) {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams();
      if (categoryId) query.set("categoryId", categoryId);
      if (stock) query.set("stock", stock);
      const data = await api<InventoryReport>(`/reports/inventory?${query}`);
      setReport(data);
      if (initial)
        setCategories(
          data.categories
            .filter((group) => group.categoryId)
            .map((group) => ({ id: group.categoryId!, name: group.categoryName })),
        );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível gerar o relatório.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load(true);
  }, []);
  return (
    <div className="page inventory-report">
      <header className="page-header print-header">
        <div>
          <Link className="back-link no-print" to="/relatorios">
            <ArrowLeft /> Voltar aos relatórios
          </Link>
          <span className="eyebrow">Posição atual do estoque</span>
          <h1>Relatório analítico de estoque</h1>
          <p>
            {report
              ? `Gerado em ${dateTime.format(new Date(report.generatedAt))}`
              : "Valores de custo, venda e margem potencial."}
          </p>
        </div>
        <Button className="no-print" icon={<Printer />} onClick={() => window.print()}>
          Imprimir / PDF
        </Button>
      </header>
      <section className="inventory-filters no-print">
        <label>
          Categoria
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Todas as categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Situação
          <select value={stock} onChange={(e) => setStock(e.target.value)}>
            <option value="">Todos os produtos</option>
            <option value="low">Somente estoque baixo</option>
            <option value="zero">Somente estoque zerado</option>
          </select>
        </label>
        <Button variant="secondary" icon={<RefreshCw />} onClick={() => load()}>
          Aplicar filtros
        </Button>
      </section>
      {error && <div className="form-error">{error}</div>}
      {loading ? (
        <section className="panel loading">Calculando posição do estoque...</section>
      ) : (
        report && (
          <>
            {!report.categories.length ? (
              <section className="panel inventory-empty">
                <Boxes />
                <h2>Nenhum produto encontrado</h2>
                <p>Não existem produtos correspondentes aos filtros.</p>
              </section>
            ) : (
              report.categories.map((group) => (
                <section className="inventory-group" key={group.categoryId ?? "none"}>
                  <header>
                    <div>
                      <span className="eyebrow">Categoria</span>
                      <h2>{group.categoryName}</h2>
                    </div>
                    <div className="category-totals">
                      <span>
                        <small>Produtos</small>
                        <strong>{group.metrics.productsCount}</strong>
                      </span>
                      <span>
                        <small>Volume</small>
                        <strong>{quantity(group.metrics.stockVolume)}</strong>
                      </span>
                      <span>
                        <small>Custo investido</small>
                        <strong>{money(group.metrics.totalCost)}</strong>
                      </span>
                      <span>
                        <small>Venda estimada</small>
                        <strong>{money(group.metrics.totalSaleValue)}</strong>
                      </span>
                    </div>
                  </header>
                  <div className="inventory-table">
                    <div className="inventory-row inventory-head">
                      <span>ID / EAN</span>
                      <span>Produto</span>
                      <span>Estoque</span>
                      <span>Custo un.</span>
                      <span>Venda un.</span>
                      <span>Total em custo</span>
                    </div>
                    {group.products.map((product) => (
                      <div className="inventory-row" key={product.id}>
                        <span>
                          <strong>#{product.id}</strong>
                          <small>{product.barcode}</small>
                        </span>
                        <strong>{product.name}</strong>
                        <span>
                          {quantity(product.stockQuantity)} {product.unit}
                        </span>
                        <span>{money(product.costPrice)}</span>
                        <span>{money(product.salePrice)}</span>
                        <strong>{money(product.stockCostValue)}</strong>
                      </div>
                    ))}
                  </div>
                </section>
              ))
            )}
            <footer className="inventory-summary">
              <div>
                <span className="eyebrow eyebrow--light">Consolidado geral</span>
                <h2>Valor do estoque</h2>
                <small>{report.summary.productsCount} produtos considerados</small>
              </div>
              <div>
                <span>
                  Custo total<strong>{money(report.summary.totalCost)}</strong>
                </span>
                <span>
                  Venda estimada<strong>{money(report.summary.totalSaleValue)}</strong>
                </span>
                <span>
                  Margem bruta potencial
                  <strong>
                    {money(report.summary.potentialGrossMargin)}{" "}
                    <small>({quantity(report.summary.potentialGrossMarginPercent)}%)</small>
                  </strong>
                </span>
              </div>
            </footer>
          </>
        )
      )}
    </div>
  );
}
