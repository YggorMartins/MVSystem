import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { dateTime } from "../lib/format";
import type { AuditLog } from "../types";
import { Button } from "../components/ui/Button";

export function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function load() {
    setLoading(true);
    setError("");
    try {
      setLogs(await api<AuditLog[]>("/audit/logs"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível carregar a auditoria.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Segurança</span>
          <h1>Auditoria</h1>
          <p>Histórico das ações administrativas e financeiras.</p>
        </div>
      </header>
      {error && (
        <div className="form-error">
          {error}{" "}
          <Button variant="ghost" onClick={load}>
            Tentar novamente
          </Button>
        </div>
      )}
      {loading ? (
        <section className="panel loading">Carregando auditoria...</section>
      ) : (
        <section className="panel table-panel">
          <div className="data-row audit-row data-head">
            <span>Data</span>
            <span>Usuário</span>
            <span>Ação</span>
            <span>Detalhes</span>
          </div>
          {logs.map((log) => (
            <div className="data-row audit-row" key={log.id}>
              <span>{dateTime.format(new Date(log.createdAt))}</span>
              <strong>
                {log.user?.email ?? "Sistema"}
                <small>{log.user?.role ?? "—"}</small>
              </strong>
              <span>{log.action}</span>
              <span>{log.details}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
