import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { useAuth } from "./contexts/AuthContext";
import { CashPage } from "./pages/CashPage";
import { CreditPage } from "./pages/CreditPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { PosPage } from "./pages/PosPage";
import { ProductsPage } from "./pages/ProductsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { InventoryReportPage } from "./pages/InventoryReportPage";

export function App() {
  const { session } = useAuth();
  if (!session) return <LoginPage />;
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="pdv" element={<PosPage />} />
        <Route path="produtos" element={<ProductsPage />} />
        <Route path="caixa" element={<CashPage />} />
        <Route path="fiado" element={<CreditPage />} />
        <Route path="relatorios" element={<ReportsPage />} />
        <Route path="relatorios/estoque" element={<InventoryReportPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
