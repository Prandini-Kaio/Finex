interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
}

export const Card: React.FC<CardProps> = ({ children, className = '', title }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-slate-700 ${className}`}>
    {title && (
      <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
      </div>
    )}
    <div className="p-4">{children}</div>
  </div>
)
