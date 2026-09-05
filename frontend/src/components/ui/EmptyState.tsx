interface EmptyStateProps {
  icon: string          // Material Symbols icon name
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-2xl px-xl text-center">
      <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-lg">
        <span className="material-symbols-outlined text-3xl text-on-surface-variant">{icon}</span>
      </div>
      <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs">{title}</h3>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mb-lg">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-lg py-md bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:opacity-90 active:scale-[0.98] transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
