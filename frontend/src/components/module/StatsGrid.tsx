interface StatsGridProps {
    columns?: 2 | 3 | 4
    children: React.ReactNode
}

const gridCols: Record<number, string> = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
}

export default function StatsGrid({ columns = 3, children }: StatsGridProps) {
    return (
        <div className={`grid gap-6 ${gridCols[columns]}`}>
            {children}
        </div>
    )
}
