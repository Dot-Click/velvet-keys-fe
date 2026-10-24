import { EmptyState, type EmptyStateProps } from "@/components/empty-state";

interface PanelPlaceholderProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyDescription: string;
  illustration: NonNullable<EmptyStateProps["illustration"]>;
}

/** Home screen for a panel whose modules arrive in a later phase. */
export function PanelPlaceholder({
  eyebrow,
  title,
  subtitle,
  emptyTitle,
  emptyDescription,
  illustration,
}: PanelPlaceholderProps) {
  return (
    <div className="relative mx-auto max-w-[1720px] space-y-8 px-4 py-8 sm:px-8 lg:px-12">
      <header className="space-y-2">
        <p className="text-label-caps text-primary">{eyebrow}</p>
        <h1 className="font-display text-3xl uppercase tracking-[0.1em] text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
      </header>
      <EmptyState
        illustration={illustration}
        title={emptyTitle}
        description={emptyDescription}
        className="min-h-96"
      />
    </div>
  );
}
