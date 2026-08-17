import React, { useState, useRef, useEffect } from 'react';
import { Tag, Search, Check, ChevronDown, Plus, X } from 'lucide-react';

export function CategorySelect({
  value,
  onChange,
  categories = [],
  placeholder = 'Select Category',
  allowCustom = true,
  className = '',
  buttonVariant = 'form', // 'form' | 'filter'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (cat) => {
    onChange(cat);
    setIsOpen(false);
    setSearchTerm('');
    setIsCustomMode(false);
  };

  const handleCreateCustom = (customName) => {
    const trimmed = (customName || searchTerm || customValue).trim();
    if (trimmed) {
      onChange(trimmed);
      setIsOpen(false);
      setSearchTerm('');
      setCustomValue('');
      setIsCustomMode(false);
    }
  };

  const isFilter = buttonVariant === 'filter';

  return (
    <div className={`relative ${isOpen ? 'z-30' : ''} ${isFilter ? 'inline-flex' : 'w-full'}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={
          isFilter
            ? `px-3 py-2 rounded-xl text-xs font-semibold border flex items-center justify-between gap-2 transition-all outline-none ${
                value && value !== 'ALL'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              } ${className}`
            : `w-full px-3.5 py-2.5 rounded-xl text-sm border flex items-center justify-between gap-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none ${className}`
        }
      >
        <div className="flex items-center gap-2 truncate">
          <Tag className={isFilter ? 'w-3.5 h-3.5 text-blue-500' : 'w-4 h-4 text-slate-400'} />
          <span className="truncate">
            {isFilter
              ? value && value !== 'ALL'
                ? `Cat: ${value}`
                : 'Category: All'
              : value || placeholder}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className={`absolute top-full mt-1.5 w-64 max-w-[calc(100vw-2rem)] z-[100] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 ${isFilter ? 'right-0 sm:left-0 sm:right-auto' : 'left-0'}`}>
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1.5" />
            <input
              type="text"
              placeholder="Search or type category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-900 dark:text-white outline-none placeholder-slate-400 py-1"
              autoFocus
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-52 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin">
            {isFilter && (
              <button
                type="button"
                onClick={() => handleSelect('ALL')}
                className={`w-full px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                  value === 'ALL' || !value
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>Category: All</span>
                {(value === 'ALL' || !value) && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
              </button>
            )}

            {filteredCategories.map((cat) => {
              const isSelected = value === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleSelect(cat)}
                  className={`w-full px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{cat}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                </button>
              );
            })}

            {filteredCategories.length === 0 && !searchTerm && (
              <div className="p-3 text-xs text-center text-slate-400">
                No categories available
              </div>
            )}
          </div>

          {/* Footer: Create Custom Category */}
          {allowCustom && (
            <div className="p-1.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              {searchTerm && !categories.some(c => c.toLowerCase() === searchTerm.toLowerCase()) ? (
                <button
                  type="button"
                  onClick={() => handleCreateCustom(searchTerm)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-blue-500 text-white flex items-center justify-center gap-1.5 shadow-sm hover:bg-blue-600 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create &quot;{searchTerm}&quot;
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCustomMode(!isCustomMode)}
                  className="w-full px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Add Custom Category
                </button>
              )}

              {isCustomMode && !searchTerm && (
                <div className="mt-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2">
                  <input
                    type="text"
                    placeholder="Enter category name..."
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                    autoFocus
                  />
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCreateCustom(customValue)}
                      className="flex-1 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCustomMode(false)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CategorySelect;
