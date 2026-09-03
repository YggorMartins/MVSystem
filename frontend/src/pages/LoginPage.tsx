import { ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "../components/ui/Button";
import { useAuth } from "../contexts/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-story">
        <div className="login-brand">
          <span className="logo-mv">
            <b>M</b>
            <i>V</i>
          </span>
          <strong>Mercadinho da Vizinha</strong>
        </div>
        <div>
          <span className="eyebrow eyebrow--light">Seu negócio, no controle</span>
          <h1>
            Venda fácil.
            <br />
            Gestão tranquila.
          </h1>
          <p>Um caixa simples e rápido, feito para o ritmo da sua mercearia.</p>
        </div>
        <small>MVSystem · Sistema de ponto de venda</small>
      </section>
      <section className="login-form-wrap">
        <form className="login-card" onSubmit={submit}>
          <div className="login-icon">
            <LockKeyhole />
          </div>
          <span className="eyebrow">Acesso seguro</span>
          <h2>Bem-vindo de volta</h2>
          <p>Entre com seus dados para abrir o sistema.</p>
          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@mercearia.com"
              autoFocus
              required
            />
          </label>
          <label>
            Senha
            <div className="password-input">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                required
              />
              <button type="button" onClick={() => setShow(!show)} aria-label="Mostrar senha">
                {show ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </label>
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          <Button type="submit" disabled={busy}>
            {busy ? "Entrando..." : "Entrar"}
            <ArrowRight />
          </Button>
          <small>Precisa de acesso? Fale com o responsável pelo sistema.</small>
        </form>
      </section>
    </main>
  );
}
