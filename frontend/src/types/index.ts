export type UserRole = "admin" | "gerente" | "caixa" | "estoque";
export type PaymentMethod = "dinheiro" | "cartao_credito" | "cartao_debito" | "pix" | "fiado";

export interface Product {
  id: number;
  name: string;
  barcode: string;
  price: string | number;
  costPrice: string | number;
  stockQuantity: string | number;
  unit: string;
  lowStockThreshold: string | number;
  archivedAt?: string | null;
  categoryId: number | null;
  category?: { id: number; name: string };
}

export interface InventoryReport {
  generatedAt: string;
  categories: Array<{
    categoryId: number | null;
    categoryName: string;
    metrics: {
      productsCount: number;
      stockVolume: string | number;
      totalCost: string | number;
      totalSaleValue: string | number;
    };
    products: Array<{
      id: number;
      barcode: string;
      name: string;
      stockQuantity: string | number;
      unit: string;
      costPrice: string | number;
      salePrice: string | number;
      stockCostValue: string | number;
      stockSaleValue: string | number;
      lowStockThreshold: string | number;
    }>;
  }>;
  summary: {
    productsCount: number;
    totalCost: string | number;
    totalSaleValue: string | number;
    potentialGrossMargin: string | number;
    potentialGrossMarginPercent: string | number;
  };
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CashRegister {
  id: number;
  openedAt: string;
  closedAt?: string | null;
  initialAmount: string | number;
  closingAmount?: string | number | null;
  status: "open" | "closed";
}

export interface Sale {
  id: number;
  totalAmount: string | number;
  paymentMethod: PaymentMethod;
  createdAt: string;
  items?: Array<{
    id: number;
    quantity: string | number;
    unitPrice?: string | number;
    product?: Product;
  }>;
  customerId?: number | null;
  customer?: Customer | null;
  creditPaidAt?: string | null;
  creditPaidAmount?: string | number;
  cancelledAt?: string | null;
}

export interface Customer {
  id: number;
  name: string;
  phone?: string | null;
}

export interface DailyReport {
  date: string;
  totalSales: string | number;
  totalItems: string | number;
  salesCount: number;
  creditTotal: string | number;
  creditOpen: string | number;
  byPaymentMethod: Partial<Record<PaymentMethod, { count: number; total: string | number }>>;
}

export interface DashboardReport extends DailyReport {
  openCashRegisters: number;
  outstandingCredit: string | number;
  creditReceivedThisMonth: string | number;
  cashRegisters: Array<CashRegister & { balance: string | number }>;
  recentSales: Array<{
    id: number;
    totalAmount: string | number;
    paymentMethod: PaymentMethod;
    createdAt: string;
    items: Array<{ productName: string; quantity: string | number }>;
  }>;
}
