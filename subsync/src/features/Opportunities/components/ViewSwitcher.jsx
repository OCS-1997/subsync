import { Table2, Kanban } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';

export default function ViewSwitcher({ viewMode, onViewChange }) {
    return (
        <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-lg p-1 bg-gray-50 dark:bg-gray-800/50">
            <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewChange('table')}
                className={`h-9 gap-2 ${viewMode === 'table'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
            >
                <Table2 className="h-4 w-4" />
                <span className="hidden sm:inline">Table</span>
            </Button>
            <Button
                variant={viewMode === 'pipeline' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewChange('pipeline')}
                className={`h-9 gap-2 ${viewMode === 'pipeline'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
            >
                <Kanban className="h-4 w-4" />
                <span className="hidden sm:inline">Pipeline</span>
            </Button>
        </div>
    );
}
