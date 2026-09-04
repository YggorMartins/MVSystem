export type UserRole = "admin" | "gerente" | "caixa" | "estoque";
export interface User {
  id: number;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface AuditLog {
  id: number;
  action: string;
  details: string;
  createdAt: string;
  user?: Pick<User, "id" | "email" | "role"> | null;
}
export interface CashMovement {
  id: number;
  cashRegisterId: number;
  type: "cash_in" | "cash_out";
  amount: string | number;
  description?: string | null;
  createdAt: string;
}
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
  movements?: CashMovement[];
  expectedBalance?: string | number;
  difference?: string | number | null;
}

export interface Sale {
  id: number;
  totalAmount: string | number;
  paymentMethod: PaymentMethod;
  createdAt: string;
  items?: Array<{
    id: number;
    productId: number;
    quantity: string | number;
    unitPrice?: string | number;
    product?: Product;
  }>;
  customerId?: number | null;
  customer?: Customer | null;
  creditPaidAt?: string | null;
  creditPaidAmount?: string | number;
  cancelledAt?: string | null;
  fiscalDocument?: FiscalDocument | null;
}
export interface FiscalDocument {
  id: number;
  saleId: number;
  environment: "simulation" | "homologation" | "production";
  status: "authorized_simulation" | "authorized" | "cancelled" | "rejected";
  accessKey: string;
  protocol: string;
  issuedAt: string;
  cancelledAt?: string | null;
}
export interface Supplier {
  id: number;
  name: string;
  document?: string | null;
  phone?: string | null;
  email?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface Purchase {
  id: number;
  idempotencyKey: string;
  supplierId: number;
  supplier: Supplier;
  invoiceNumber?: string | null;
  totalAmount: string | number;
  receivedAt: string;
  cancelledAt?: string | null;
  items: Array<{
    id: number;
    productId: number;
    product: Product;
    quantity: string | number;
    unitCost: string | number;
  }>;
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
