import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Edit2, Trash2, Power, PowerOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge.jsx';

function ToolCard({ tool, onEdit, onDelete, onToggleActive }) {
  const roles = Array.isArray(tool.roles_allowed)
    ? tool.roles_allowed
    : JSON.parse(tool.roles_allowed || '[]');

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-gray-200 dark:border-gray-700">
      <CardContent className="p-5">
        <div className="space-y-4">
          {/* Header Section */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Icon */}
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <i className={`fas ${tool.icon} text-lg text-blue-600 dark:text-blue-400`}></i>
              </div>

              {/* Title and Status */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 truncate">
                    {tool.name}
                  </h3>
                  {tool.is_active ? (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800 text-xs flex-shrink-0">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                      Inactive
                    </Badge>
                  )}
                </div>

                {/* URL - Truncated with tooltip */}
                <p
                  className="text-xs text-gray-500 dark:text-gray-400 truncate font-mono"
                  title={tool.url_template}
                >
                  {tool.url_template}
                </p>
              </div>
            </div>
          </div>

          {/* Roles Section */}
          {roles.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {roles.map((role) => (
                <Badge
                  key={role}
                  variant="outline"
                  className="text-xs capitalize bg-gray-50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600"
                >
                  {role}
                </Badge>
              ))}
            </div>
          )}

          {/* Actions Section */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              size="sm"
              className={`flex-1 ${tool.is_active
                ? 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/30'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              onClick={() => onToggleActive(tool)}
            >
              {tool.is_active ? (
                <>
                  <Power className="h-3.5 w-3.5 mr-1.5" />
                  Active
                </>
              ) : (
                <>
                  <PowerOff className="h-3.5 w-3.5 mr-1.5" />
                  Inactive
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
              onClick={() => onEdit(tool)}
            >
              <Edit2 className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
              onClick={() => onDelete(tool)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ToolCard;
