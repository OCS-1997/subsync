import { useState, useEffect, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Search, ExternalLink, Loader2, Sparkles, AlertCircle, Globe, Link2 } from 'lucide-react';
import api from '@/lib/axiosInstance.js';
import { toast } from 'react-toastify';

function QuickToolsWidget() {
  const [tools, setTools] = useState([]);
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      fetchTools();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setDomain('');
    }
  }, [open]);

  // Keyboard shortcut: Ctrl+Shift+Q
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'Q') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchTools = async () => {
    try {
      setLoading(true);
      const response = await api.get('/quick-tools');
      setTools(response.data || []);
    } catch (error) {
      console.error('Error fetching quick tools:', error);
      toast.error('Failed to load quick tools');
    } finally {
      setLoading(false);
    }
  };

  const handleToolClick = (tool) => {
    if (!domain.trim()) {
      toast.error('Please enter a domain first');
      return;
    }

    const url = tool.url_template.replace(/\{\{domain\}\}/g, encodeURIComponent(domain.trim()));

    try {
      const urlObj = new URL(url);
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        toast.error('Invalid URL scheme');
        return;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
      toast.success(`Opening ${tool.name}...`);
    } catch (error) {
      toast.error('Invalid URL');
    }
  };

  const validateDomain = (input) => {
    if (!input.trim()) return true;
    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?$/;
    return domainRegex.test(input.trim());
  };

  const filteredTools = tools;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200"
          title="Quick Tools (Ctrl+Shift+Q)"
        >
          <Link2 className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[380px] p-0 shadow-xl border-blue-200 dark:border-blue-800"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-blue-100 dark:border-blue-900 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-600 dark:bg-blue-500">
              <Link2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Quick Tools</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Analyze domains instantly</p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Domain Input Section */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Domain Name
            </Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && domain.trim() && filteredTools.length > 0) {
                    handleToolClick(filteredTools[0]);
                  }
                }}
                className="pl-10 h-10 border-blue-200 dark:border-blue-800 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                autoComplete="off"
              />
            </div>
            {domain && !validateDomain(domain) && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-1.5 rounded-md">
                <AlertCircle className="h-3 w-3" />
                <span>Please enter a valid domain format</span>
              </div>
            )}
          </div>

          {/* Tools List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Available Tools
              </Label>
              {filteredTools.length > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'}
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading tools...</p>
              </div>
            ) : filteredTools.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="mx-auto w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                  <Search className="h-7 w-7 text-blue-300 dark:text-blue-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No tools available</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Contact your administrator</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
                {filteredTools.map((tool) => (
                  <button
                    key={tool.tool_id}
                    onClick={() => handleToolClick(tool)}
                    disabled={!domain.trim() || !validateDomain(domain)}
                    className="group w-full flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 dark:disabled:hover:border-gray-700 disabled:hover:bg-transparent"
                  >
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center group-hover:bg-blue-600 dark:group-hover:bg-blue-500 transition-colors">
                      <i className={`fas ${tool.icon} text-base text-blue-600 dark:text-blue-400 group-hover:text-white`}></i>
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                        {tool.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        Click to analyze
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Hint */}
        {filteredTools.length > 0 && (
          <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              💡 Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono mx-0.5">Enter</kbd> to open first tool
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Label component for consistency
function Label({ children, className = '' }) {
  return <label className={`block ${className}`}>{children}</label>;
}

export default QuickToolsWidget;
