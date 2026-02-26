interface PageHeaderProps {
    title: string
    action?: React.ReactNode
}

export default function PageHeader({ title, action }: PageHeaderProps) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold text-ds-text-primary">{title}</h1>
            {action && <div>{action}</div>}
        </div>
    )
}
