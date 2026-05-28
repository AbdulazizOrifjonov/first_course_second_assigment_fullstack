import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import './SidebarFilters.css';

export function SidebarFilters({ filters, onClear }) {
  const [expandedFilter, setExpandedFilter] = useState(null);
  const activeFilters = filters.filter(f => f.value !== '');

  return (
    <div className="p-3 border-t border-gray-200 space-y-2">
      <div className="flex items-center justify-between px-4 py-2">
        <p className="text-xs font-semibold text-gray-500 uppercase">Filtrlar</p>
        {activeFilters.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-green-600 hover:text-green-700 font-semibold"
          >
            Tozalash
          </button>
        )}
      </div>

      <div className="space-y-1">
        {filters.map(filter => (
          <div key={filter.id} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setExpandedFilter(expandedFilter === filter.id ? null : filter.id)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 transition-colors text-sm"
            >
              <span className="text-gray-700 font-medium">{filter.label}</span>
              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform ${
                  expandedFilter === filter.id ? 'rotate-180' : ''
                }`}
              />
            </button>

            {expandedFilter === filter.id && (
              <div className="border-t border-gray-200 bg-white p-2 space-y-1">
                <button
                  onClick={() => filter.onChange('')}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    filter.value === ''
                      ? 'bg-green-100 text-green-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Barchasi
                </button>
                {filter.options.map(option => (
                  <button
                    key={option.value}
                    onClick={() => filter.onChange(option.value)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      filter.value === option.value
                        ? 'bg-green-100 text-green-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {activeFilters.length > 0 && (
        <div className="bg-green-50 rounded-lg p-2 border border-green-200">
          <p className="text-xs text-green-700 font-semibold mb-1">Faol filtrlar:</p>
          <div className="flex flex-wrap gap-1">
            {activeFilters.map(filter => {
              const selectedOption = filter.options.find(o => o.value === filter.value);
              return (
                <span
                  key={filter.id}
                  className="inline-flex items-center gap-1 bg-green-200 text-green-800 px-2 py-1 rounded text-xs font-medium"
                >
                  {selectedOption?.label}
                  <button
                    onClick={() => filter.onChange('')}
                    className="hover:text-green-900"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
