import { useEffect, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { api } from "../../lib/api";
import type { Product } from "../../types";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

interface Category {
  id: number;
  name: string;
}

function formatPrice(value: string | number) {
  return Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function maskPrice(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? formatPrice(Number(digits) / 100) : "";
}

export function ProductModal({
  open,
  product,
  onClose,
  onSaved,
}: {
  open: boolean;
  product?: Product | null;
  onClose(): void;
  onSaved(product: Product): void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    name: "",
    barcode: "",
    costPrice: "",
    price: "",
    stockQuantity: "",
    unit: "UN",
    lowStockThreshold: "",
    categoryId: "",
  });
  const [newCategory, setNewCategory] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm(
      product
        ? {
            name: product.name,
            barcode: product.barcode,
            costPrice: formatPrice(product.costPrice ?? 0),
            price: formatPrice(product.price),
            stockQuantity: String(product.stockQuantity),
            unit: product.unit ?? "UN",
            lowStockThreshold: String(product.lowStockThreshold ?? 0),
            categoryId: product.categoryId ? String(product.categoryId) : "",
          }
        : {
            name: "",
            barcode: "",
            costPrice: "",
            price: "",
            stockQuantity: "",
            unit: "UN",
            lowStockThreshold: "",
            categoryId: "",
          },
    );
    api<Category[]>("/categories")
      .then(setCategories)
      .catch((e) => setError(e.message));
  }, [open, product]);

  function decimal(value: string) {
    return Number(value.replace(/\./g, "").replace(",", "."));
  }

  async function createCategory() {
    if (newCategory.trim().length < 2)
      return setError("Informe um nome de categoria com pelo menos 2 caracteres.");
    setBusy(true);
    setError("");
    try {
      const category = await api<Category>("/categories", {
        method: "POST",
        body: JSON.stringify({ name: newCategory.trim() }),
      });
      setCategories((current) => [...current, category]);
      setForm((current) => ({ ...current, categoryId: String(category.id) }));
      setNewCategory("");
      setAddingCategory(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível criar a categoria.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const price = decimal(form.price);
    const costPrice = decimal(form.costPrice);
    const stockQuantity = decimal(form.stockQuantity);
    const lowStockThreshold = decimal(form.lowStockThreshold || "0");
    if (!Number.isFinite(price) || price <= 0) {
      setBusy(false);
      return setError("Informe um preço maior que zero.");
    }
    if (!Number.isFinite(stockQuantity) || stockQuantity < 0) {
      setBusy(false);
      return setError("Informe um estoque válido.");
    }
    if (!Number.isFinite(costPrice) || costPrice < 0) {
      setBusy(false);
      return setError("Informe um preço de custo válido.");
    }
    try {
      const saved = await api<Product>(product ? `/products/${product.id}` : "/products", {
        method: product ? "PATCH" : "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          barcode: form.barcode.trim(),
          costPrice,
          price,
          stockQuantity,
          unit: form.unit,
          lowStockThreshold,
          categoryId: form.categoryId ? Number(form.categoryId) : null,
        }),
      });
      onSaved({
        ...saved,
        category: categories.find((category) => category.id === Number(form.categoryId)),
      });
      setForm({
        name: "",
        barcode: "",
        costPrice: "",
        price: "",
        stockQuantity: "",
        unit: "UN",
        lowStockThreshold: "",
        categoryId: "",
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível cadastrar o produto.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      title={product ? "Atualizar produto" : "Cadastrar produto"}
      onClose={onClose}
    >
      <form className="product-form" onSubmit={submit}>
        <label className="field field--wide">
          Nome do produto
          <input
            autoFocus
            required
            maxLength={200}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ex.: Queijo mussarela"
          />
        </label>
        <label className="field field--wide">
          Código de barras
          <input
            required
            maxLength={64}
            value={form.barcode}
            onChange={(e) => setForm({ ...form, barcode: e.target.value })}
            placeholder="Leia ou digite o código"
          />
        </label>
        <label className="field">
          Preço de custo (R$)
          <input
            required
            inputMode="numeric"
            value={form.costPrice}
            onChange={(e) => setForm({ ...form, costPrice: maskPrice(e.target.value) })}
            placeholder="0,00"
          />
        </label>
        <label className="field">
          Preço de venda (R$)
          <input
            required
            inputMode="numeric"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: maskPrice(e.target.value) })}
            placeholder="0,00"
          />
        </label>
        <label className="field">
          Estoque inicial
          <input
            required
            inputMode="decimal"
            value={form.stockQuantity}
            onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
            placeholder="0,000"
          />
          <small>Aceita quantidade por quilo.</small>
        </label>
        <label className="field">
          Unidade
          <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
            {["UN", "KG", "G", "L", "ML", "CX", "PCT"].map((unit) => (
              <option key={unit}>{unit}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Alerta de estoque baixo
          <input
            inputMode="decimal"
            value={form.lowStockThreshold}
            onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
            placeholder="0,000"
          />
        </label>
        <div className="field field--wide">
          <label>Categoria</label>
          <div className="category-select">
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">Sem Categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAddingCategory(!addingCategory)}
              icon={<Plus />}
            >
              Nova
            </Button>
          </div>
        </div>
        {addingCategory && (
          <div className="new-category field--wide">
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Nome da nova categoria"
            />
            <Button type="button" variant="secondary" disabled={busy} onClick={createCategory}>
              Adicionar categoria
            </Button>
          </div>
        )}
        {error && (
          <div className="form-error field--wide" role="alert">
            {error}
          </div>
        )}
        <footer className="modal-actions field--wide">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Salvando..." : product ? "Salvar alterações" : "Cadastrar produto"}
          </Button>
        </footer>
      </form>
    </Modal>
  );
}
