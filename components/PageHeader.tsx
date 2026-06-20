/**
 * Standard tab/page header: a heading with optional subtitle and a right-aligned
 * action slot (e.g. an Add button or sign-out).
 */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-3 px-1 pb-4 pt-2">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-ink">
          {title}
        </h1>
        {subtitle && <p className="mt-0.5 text-sm text-ink/55">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 pt-1">{action}</div>}
    </header>
  );
}
