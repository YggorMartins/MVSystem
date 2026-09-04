import {
  BarChart3,
  Boxes,
  CircleDollarSign,
  LayoutDashboard,
  LogOut,
  Menu,
  ShoppingCart,
  UsersRound,
  UserCog,
  ScrollText,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import type { UserRole } from "../../types";
import { canAccess } from "../../lib/presentation";

const links: Array<readonly [string, string, typeof LayoutDashboard, readonly UserRole[]]> = [
  ["/", "Visão geral", LayoutDashboard, ["admin", "gerente", "caixa"]],
  ["/pdv", "Nova venda", ShoppingCart, ["admin", "gerente", "caixa"]],
  ["/produtos", "Produtos", Boxes, ["admin", "gerente", "estoque"]],
  ["/caixa", "Caixa", CircleDollarSign, ["admin", "caixa"]],
  ["/fiado", "Fiado", UsersRound, ["admin", "gerente", "caixa"]],
  ["/relatorios", "Relatórios", BarChart3, ["admin", "gerente", "caixa"]],
  ["/auditoria", "Auditoria", ScrollText, ["admin", "gerente"]],
  ["/usuarios", "Usuários", UserCog, ["admin"]],
  ["/compras", "Compras", Truck, ["admin", "gerente", "estoque"]],
] as const;

export function AppShell() {
  const [open, setOpen] = useState(false);
  const { session, logout } = useAuth();
  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "sidebar--open" : ""}`}>
        <div className="brand">
          <div className="brand__mark">
            <b>M</b>
            <i>V</i>
          </div>
          <div>
            <strong>MVSystem</strong>
            <span>Mercadinho da Vizinha</span>
          </div>
        </div>
        <nav aria-label="Menu principal">
          {links
            .filter(([, , , roles]) => session && canAccess(session.role, roles))
            .map(([to, label, Icon]) => (
              <NavLink key={to} to={to} end={to === "/"} onClick={() => setOpen(false)}>
                <Icon />
                <span>{label}</span>
              </NavLink>
            ))}
        </nav>
        <div className="operator">
          <div className="avatar">{session?.email[0].toUpperCase()}</div>
          <div>
            <strong>{session?.email.split("@")[0]}</strong>
            <span>{session?.role}</span>
          </div>
          <button onClick={logout} aria-label="Sair">
            <LogOut />
          </button>
        </div>
      </aside>
      {open && <div className="sidebar-scrim" onClick={() => setOpen(false)} />}
      <main>
        <div className="mobile-bar">
          <button onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <strong>MVSystem</strong>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
