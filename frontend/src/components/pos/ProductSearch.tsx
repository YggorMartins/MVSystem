import { Search, ScanBarcode } from "lucide-react";
import { forwardRef } from "react";

export const ProductSearch = forwardRef<
  HTMLInputElement,
  { value: string; onChange(value: string): void; onSubmit(): void }
>(function ProductSearch({ value, onChange, onSubmit }, ref) {
  return (
    <div className="product-search">
      <Search />
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        placeholder="Digite o produto ou leia o código de barras"
        aria-label="Buscar produto"
      />
      <span>
        <ScanBarcode /> F2
      </span>
    </div>
  );
});
