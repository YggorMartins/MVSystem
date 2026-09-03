import {
  BarChart3,
  Boxes,
  CircleDollarSign,
  LayoutDashboard,
  LogOut,
  Menu,
  ShoppingCart,
  UsersRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const links = [
  ["/", "Visão geral", LayoutDashboard],
  ["/pdv", "Nova venda", ShoppingCart],
  ["/produtos", "Produtos", Boxes],
  ["/caixa", "Caixa", CircleDollarSign],
  ["/fiado", "Fiado", UsersRound],
  ["/relatorios", "Relatórios", BarChart3],
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
          <button className="sidebar-close" onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>
        <nav aria-label="Menu principal">
          {links.map(([to, label, Icon]) => (
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
