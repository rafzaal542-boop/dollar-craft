import React, { useState, useRef, useEffect } from 'react';
import { Globe, Search, ChevronDown, Check, X } from 'lucide-react';
import { ALL_COUNTRIES, CountryOption } from '../data/countries';

interface SearchableCountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export const SearchableCountrySelect: React.FC<SearchableCountrySelectProps> = ({
  value,
  onChange,
  placeholder = 'Select Country...',
  required = false,
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Find selected country object if value matches
  const selectedCountry = ALL_COUNTRIES.find(
    (c) => `${c.flag} ${c.name}` === value || c.name === value
  );

  const filteredCountries = ALL_COUNTRIES.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.dialCode.toLowerCase().includes(q)
    );
  });

  const handleSelect = (c: CountryOption) => {
    const valStr = `${c.flag} ${c.name}`;
    onChange(valStr);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Hidden input for HTML form validation if required */}
      {required && (
        <input
          type="text"
          readOnly
          value={value}
          required
          className="sr-only"
          tabIndex={-1}
        />
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-[#07090E] border ${
          isOpen ? 'border-cyan-500 shadow-lg shadow-cyan-500/10' : 'border-slate-800 hover:border-slate-700'
        } rounded-xl pl-9 pr-9 py-2.5 text-xs text-left font-mono transition-all flex items-center justify-between cursor-pointer focus:outline-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <Globe className="w-4 h-4 text-cyan-400 absolute left-3 top-3 pointer-events-none" />

        <span className="truncate pr-2">
          {selectedCountry ? (
            <span className="text-white flex items-center gap-2">
              <span className="text-base leading-none">{selectedCountry.flag}</span>
              <span className="truncate">{selectedCountry.name}</span>
            </span>
          ) : value ? (
            <span className="text-white truncate">{value}</span>
          ) : (
            <span className="text-slate-500">{placeholder}</span>
          )}
        </span>

        <div className="absolute right-3 top-2.5 flex items-center gap-1">
          {value && (
            <span
              onClick={handleClear}
              className="p-0.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${
              isOpen ? 'rotate-180 text-cyan-400' : ''
            }`}
          />
        </div>
      </button>

      {/* Floating Dropdown */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-[#07090E] border border-cyan-500/40 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
          {/* Search Bar inside dropdown */}
          <div className="p-2 border-b border-slate-800/80 bg-slate-950/80 sticky top-0 z-10 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-1.5" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search country (e.g. USA, India, Pakistan)..."
              className="w-full bg-transparent text-white placeholder-slate-500 text-xs font-mono outline-none py-1"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Scrollable list */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-900/60 custom-scrollbar">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((c) => {
                const valStr = `${c.flag} ${c.name}`;
                const isSelected = value === valStr || value === c.name;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className={`w-full px-3 py-2 text-left text-xs font-mono flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/15 text-cyan-300 font-bold'
                        : 'text-slate-200 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-base shrink-0 leading-none">{c.flag}</span>
                      <span className="truncate">{c.name}</span>
                      <span className="text-[10px] text-cyan-400 font-semibold bg-cyan-950/80 border border-cyan-800/60 px-1.5 py-0.5 rounded ml-auto font-mono shrink-0">{c.dialCode}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-2" />}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-500 font-mono">
                No country found for "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
