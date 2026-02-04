import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

export interface BreadcrumbItem {
  path: string
  label: string
}

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: ReactNode
}

export function PageHeader({ title, description, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
      <div className="flex-1 min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-2 mb-3 text-sm overflow-x-auto" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.path} className="flex items-center gap-2 flex-shrink-0">
                {index > 0 && <ChevronRight className="w-4 h-4 text-gray-500" aria-hidden />}
                <Link
                  to={crumb.path}
                  className={`transition-colors duration-200 whitespace-nowrap ${
                    index === breadcrumbs.length - 1
                      ? 'text-white font-medium'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {crumb.label}
                </Link>
              </div>
            ))}
          </nav>
        )}
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-1">{title}</h1>
        {description && <p className="text-sm text-gray-400">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 md:gap-3 flex-wrap md:flex-nowrap md:ml-6">{actions}</div>}
    </div>
  )
}
