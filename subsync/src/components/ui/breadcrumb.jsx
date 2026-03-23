import { Link, useLocation, useParams } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Breadcrumb component for navigation
 * @param {Object} props
 * @param {Array} props.items - Array of breadcrumb items [{label: string, href?: string}]
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showHome - Whether to show home icon (default: true)
 */
export function Breadcrumb({ items = [], className, showHome = true }) {
    const { username } = useParams();
    const basePath = `/${username}/dashboard`;

    return (
        <nav aria-label="Breadcrumb" className={cn("mb-4", className)}>
            <ol className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
                {showHome && (
                    <>
                        <li>
                            <Link
                                to={basePath}
                                className="flex items-center gap-1 hover:text-foreground transition-colors duration-200"
                            >
                                <Home className="w-4 h-4" />
                                <span className="sr-only">Dashboard</span>
                            </Link>
                        </li>
                        {items.length > 0 && (
                            <li className="flex items-center">
                                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
                            </li>
                        )}
                    </>
                )}
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    return (
                        <li key={index} className="flex items-center gap-1.5">
                            {item.href && !isLast ? (
                                <Link
                                    to={item.href}
                                    className="hover:text-foreground transition-colors duration-200"
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <span className={cn(
                                    isLast && "text-foreground font-medium"
                                )}>
                                    {item.label}
                                </span>
                            )}
                            {!isLast && (
                                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

/**
 * Page header component with breadcrumb
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} props.description - Optional description
 * @param {Array} props.breadcrumbItems - Breadcrumb items
 * @param {React.ReactNode} props.actions - Optional action buttons
 * @param {string} props.className - Additional CSS classes
 */
export function PageHeader({
    title,
    description,
    breadcrumbItems = [],
    actions,
    className
}) {
    return (
        <div className={cn("mb-6", className)}>
            <Breadcrumb items={breadcrumbItems} />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-muted-foreground mt-1">{description}</p>
                    )}
                </div>
                {actions && (
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Breadcrumb;
