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
import { UsersPage } from "./pages/UsersPage";
import { AuditPage } from "./pages/AuditPage";
import { RoleRoute } from "./components/layout/RoleRoute";
import { PurchasesPage } from "./pages/PurchasesPage";

export function App() {
  const { session } = useAuth();
  if (!session) return <LoginPage />;
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route
          path="compras"
          element={
            <RoleRoute roles={["admin", "gerente", "estoque"]}>
              <PurchasesPage />
            </RoleRoute>
          }
        />
        <Route
          index
          element={
            session.role === "estoque" ? <Navigate to="/produtos" replace /> : <DashboardPage />
          }
        />
        <Route
          path="pdv"
          element={
            <RoleRoute roles={["admin", "gerente", "caixa"]}>
              <PosPage />
            </RoleRoute>
          }
        />
        <Route
          path="produtos"
          element={
            <RoleRoute roles={["admin", "gerente", "estoque"]}>
              <ProductsPage />
            </RoleRoute>
          }
        />
        <Route
          path="caixa"
          element={
            <RoleRoute roles={["admin", "caixa"]}>
              <CashPage />
            </RoleRoute>
          }
        />
        <Route
          path="fiado"
          element={
            <RoleRoute roles={["admin", "gerente", "caixa"]}>
              <CreditPage />
            </RoleRoute>
          }
        />
        <Route
          path="relatorios"
          element={
            <RoleRoute roles={["admin", "gerente", "caixa"]}>
              <ReportsPage />
            </RoleRoute>
          }
        />
        <Route
          path="relatorios/estoque"
          element={
            <RoleRoute roles={["admin", "gerente", "estoque"]}>
              <InventoryReportPage />
            </RoleRoute>
          }
        />
        <Route
          path="auditoria"
          element={
            <RoleRoute roles={["admin", "gerente"]}>
              <AuditPage />
            </RoleRoute>
          }
        />
        <Route
          path="usuarios"
          element={
            <RoleRoute roles={["admin"]}>
              <UsersPage />
            </RoleRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
