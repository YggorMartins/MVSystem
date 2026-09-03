import type { LucideIcon } from "lucide-react";
export function PlaceholderPage({
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </header>
      <section className="panel coming-soon">
        <div className="metric-icon green">
          <Icon />
        </div>
        <h2>Estrutura pronta para evoluir</h2>
        <p>
          Este módulo já possui rota e navegação próprias. A integração será conectada aos endpoints
          correspondentes da API.
        </p>
      </section>
    </div>
  );
}
