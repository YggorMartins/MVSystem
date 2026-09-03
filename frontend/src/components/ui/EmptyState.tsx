import { PackageOpen } from "lucide-react";
export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="empty-state">
      <PackageOpen />
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  );
}
