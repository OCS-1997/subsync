import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Edit2, Trash2, Power, PowerOff, Globe, ExternalLink, Shield, Lock, Terminal } from 'lucide-react';
import { Badge } from '@/components/ui/badge.jsx';
import { cn } from "@/lib/utils";

function ToolCard({ tool, onEdit, onDelete, onToggleActive }) {
  const roles = Array.isArray(tool.roles_allowed)
    ? tool.roles_allowed
    : JSON.parse(tool.roles_allowed || '[]');

  return (
    <Card className="group relative rounded-[2rem] border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900/50 backdrop-blur-xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1">
      {/* Visual Accent Gradient */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r transition-all duration-500",
        tool.is_active ? "from-blue-500 to-indigo-500 opacity-100" : "from-slate-300 to-slate-400 opacity-30"
      )} />

      <CardContent className="p-8">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              {/* Modernized Icon Container */}
              <div className={cn(
                "flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner",
                tool.is_active
                  ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rotate-0 group-hover:rotate-6 group-hover:scale-110"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 scale-95"
              )}>
                <i className={`fas ${tool.icon} text-2xl`}></i>
              </div>

              {/* Title and Status Information */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-black text-lg text-slate-900 dark:text-slate-100 truncate tracking-tight">
                    {tool.name}
                  </h3>
                  {tool.is_active ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none hover:bg-emerald-500/20 font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-lg">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-500 border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-lg">
                      Inactive
                    </Badge>
                  )}
                </div>

                {/* URL - Sophisticated font and styling */}
                <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-mono italic tracking-tighter truncate group-hover:text-blue-500/60 transition-colors">
                  <Terminal className="h-3 w-3 shrink-0" />
                  <span className="truncate" title={tool.url_template}>{tool.url_template}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Roles Metadata Tags */}
          {roles.length > 0 && (
            <div className="flex flex-wrap gap-2 py-1">
              {roles.map((role) => (
                <Badge
                  key={role}
                  variant="outline"
                  className="text-[9px] font-black uppercase tracking-widest border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 px-2 shadow-sm"
                >
                  {role}
                </Badge>
              ))}
            </div>
          )}

          {/* Action Interface */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-50 dark:border-slate-800/50">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex-1 h-10 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all",
                tool.is_active
                  ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
              onClick={() => onToggleActive(tool)}
            >
              {tool.is_active ? (
                <>
                  <Power className="h-3.5 w-3.5 mr-2" />
                  Active
                </>
              ) : (
                <>
                  <PowerOff className="h-3.5 w-3.5 mr-2" />
                  Inactive
                </>
              )}
            </Button>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10 transition-all border border-transparent hover:border-blue-100 dark:hover:border-blue-900/50"
                onClick={() => onEdit(tool)}
                title="Edit tool configuration"
              >
                <Edit2 className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 transition-all border border-transparent hover:border-red-100 dark:hover:border-red-900/50"
                onClick={() => onDelete(tool)}
                title="Permanently remove tool"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ToolCard;
