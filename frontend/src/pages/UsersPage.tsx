import { useEffect, useState, type FormEvent } from "react";
import { UserPlus } from "lucide-react";
import { api } from "../lib/api";
import type { User, UserRole } from "../types";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";

const roles: UserRole[] = ["admin", "gerente", "caixa", "estoque"];
export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [editing, setEditing] = useState<User | null | undefined>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("caixa");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  async function load() {
    setLoading(true);
    setError("");
    try {
      setUsers(await api<User[]>("/users"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  function open(user?: User) {
    setEditing(user ?? null);
    setEmail(user?.email ?? "");
    setPassword("");
    setRole(user?.role ?? "caixa");
    setError("");
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(editing ? `/users/${editing.id}` : "/users", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify({ email, role, ...(!editing || password ? { password } : {}) }),
      });
      setEditing(undefined);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar usuário.");
    } finally {
      setBusy(false);
    }
  }
  async function toggle(user: User) {
    setError("");
    try {
      await api(`/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !user.active }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao alterar usuário.");
    }
  }
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Administração</span>
          <h1>Usuários</h1>
          <p>Gerencie funcionários, perfis e acessos.</p>
        </div>
        <Button icon={<UserPlus />} onClick={() => open()}>
          Novo usuário
        </Button>
      </header>
      {error && editing === undefined && <div className="form-error">{error}</div>}
      {loading ? (
        <section className="panel loading">Carregando usuários...</section>
      ) : (
        <section className="panel table-panel">
          <div className="data-row user-row data-head">
            <span>E-mail</span>
            <span>Perfil</span>
            <span>Status</span>
            <span>Ações</span>
          </div>
          {users.map((user) => (
            <div className="data-row user-row" key={user.id}>
              <strong>{user.email}</strong>
              <span>{user.role}</span>
              <span>{user.active ? "Ativo" : "Bloqueado"}</span>
              <div className="product-actions">
                <Button variant="ghost" onClick={() => open(user)}>
                  Editar
                </Button>
                <Button variant={user.active ? "danger" : "secondary"} onClick={() => toggle(user)}>
                  {user.active ? "Bloquear" : "Ativar"}
                </Button>
              </div>
            </div>
          ))}
        </section>
      )}
      <Modal
        open={editing !== undefined}
        title={editing ? "Editar usuário" : "Novo usuário"}
        onClose={() => setEditing(undefined)}
      >
        <form className="product-form" onSubmit={submit}>
          <label className="field field--wide">
            E-mail
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="field">
            Perfil
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              {roles.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label className="field">
            {editing ? "Nova senha (opcional)" : "Senha"}
            <input
              required={!editing}
              minLength={12}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <div className="form-error field--wide">{error}</div>}
          <footer className="modal-actions field--wide">
            <Button type="button" variant="ghost" onClick={() => setEditing(undefined)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Salvando..." : "Salvar"}
            </Button>
          </footer>
        </form>
      </Modal>
    </div>
  );
}
