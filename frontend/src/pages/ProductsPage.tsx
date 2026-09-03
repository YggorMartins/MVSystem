import { useEffect, useState } from "react";
import { PackagePlus, Pencil, Search, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { money, quantity } from "../lib/format";
import type { Product } from "../types";
import { EmptyState } from "../components/ui/EmptyState";
import { ProductModal } from "../components/products/ProductModal";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/Button";

export function ProductsPage() {
  const { session } = useAuth();
  const canEdit =
    session?.role === "admin" || session?.role === "gerente" || session?.role === "estoque";
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  useEffect(() => {
    api<Product[]>("/products")
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);
  const shown = products.filter((product) =>
    `${product.name} ${product.barcode}`.toLowerCase().includes(filter.toLowerCase()),
  );
  function openCreate() {
    setEditing(null);
    setModal(true);
  }
  function openEdit(product: Product) {
    setEditing(product);
    setModal(true);
  }
  function save(product: Product) {
    setProducts((current) =>
      editing
        ? current.map((item) => (item.id === product.id ? product : item))
        : [product, ...current],
    );
  }
  async function remove(product: Product) {
    if (
      !window.confirm(`Excluir ${product.name} do catálogo? O histórico de vendas será preservado.`)
    )
      return;
    setDeleting(product.id);
    setError("");
    try {
      await api(`/products/${product.id}`, { method: "DELETE" });
      setProducts((current) => current.filter((item) => item.id !== product.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível excluir o produto.");
    } finally {
      setDeleting(null);
    }
  }
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Estoque</span>
          <h1>Produtos</h1>
          <p>Consulte preços e quantidades disponíveis.</p>
        </div>
        {canEdit && (
          <button className="button button--primary" onClick={openCreate}>
            <PackagePlus />
            Novo produto
          </button>
        )}
      </header>
      {error && <div className="form-error">{error}</div>}
      <section className="panel table-panel">
        <div className="toolbar">
          <div className="compact-search">
            <Search />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Buscar produto..."
            />
          </div>
          <span>{shown.length} produtos</span>
        </div>
        {loading ? (
          <div className="loading">Carregando produtos...</div>
        ) : !shown.length ? (
          <EmptyState
            title="Nenhum produto encontrado"
            description="Tente buscar por outro nome ou código."
          />
        ) : (
          <div className="data-table">
            <div className={`data-row data-head ${canEdit ? "data-row--actions" : ""}`}>
              <span>Produto</span>
              <span>Código</span>
              <span>Estoque</span>
              <span>Preço</span>
              {canEdit && <span>Ações</span>}
            </div>
            {shown.map((product) => (
              <div className={`data-row ${canEdit ? "data-row--actions" : ""}`} key={product.id}>
                <strong>
                  {product.name}
                  <small>{product.category?.name ?? "Sem categoria"}</small>
                </strong>
                <span>{product.barcode}</span>
                <span>
                  {quantity(product.stockQuantity)} {product.unit ?? "UN"}
                </span>
                <strong>{money(product.price)}</strong>
                {canEdit && (
                  <div className="product-actions">
                    <Button variant="secondary" onClick={() => openEdit(product)} icon={<Pencil />}>
                      Editar
                    </Button>
                    {session?.role === "admin" && (
                      <Button
                        variant="danger"
                        disabled={deleting === product.id}
                        onClick={() => remove(product)}
                        icon={<Trash2 />}
                      >
                        {deleting === product.id ? "Excluindo..." : "Excluir"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
      <ProductModal open={modal} product={editing} onClose={() => setModal(false)} onSaved={save} />
    </div>
  );
}
