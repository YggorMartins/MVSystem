import { Minus, Plus, Trash2 } from "lucide-react";
import { EmptyState } from "../ui/EmptyState";
import { money, quantity } from "../../lib/format";
import type { CartItem } from "../../types";

export function CartTable({
  items,
  canRemove,
  onQuantity,
  onRemove,
}: {
  items: CartItem[];
  canRemove: boolean;
  onQuantity(id: number, value: number): void;
  onRemove(id: number): void;
}) {
  if (!items.length)
    return (
      <EmptyState
        title="A venda está vazia"
        description="Busque um produto ou leia o código de barras para começar."
      />
    );
  return (
    <div className="cart-list">
      {items.map((item, index) => (
        <article className="cart-item" key={item.product.id}>
          <span className="cart-item__number">{String(index + 1).padStart(2, "0")}</span>
          <div className="cart-item__info">
            <strong>{item.product.name}</strong>
            <span>{money(item.product.price)} por un.</span>
          </div>
          <div className="stepper">
            <button
              disabled={!canRemove && item.quantity <= (item.quantity < 1 ? 0.05 : 1)}
              onClick={() =>
                onQuantity(item.product.id, item.quantity - (item.quantity < 1 ? 0.05 : 1))
              }
            >
              <Minus />
            </button>
            <span>{quantity(item.quantity)}</span>
            <button
              onClick={() =>
                onQuantity(item.product.id, item.quantity + (item.quantity < 1 ? 0.05 : 1))
              }
            >
              <Plus />
            </button>
          </div>
          <strong className="cart-item__total">
            {money(Number(item.product.price) * item.quantity)}
          </strong>
          {canRemove && (
            <button
              className="remove"
              onClick={() => onRemove(item.product.id)}
              aria-label={`Remover ${item.product.name}`}
            >
              <Trash2 />
            </button>
          )}
        </article>
      ))}
    </div>
  );
}
