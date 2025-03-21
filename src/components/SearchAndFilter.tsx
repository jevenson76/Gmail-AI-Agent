import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, X, Calendar, Tag, Star, CheckCircle } from 'lucide-react';
import { EMAIL_CATEGORIES, EMAIL_PRIORITIES } from '../config/constants';

export interface SearchOptions {
  searchTerm: string;
  categories: string[];
  importance: number[];
  dateRange: {
    from: string | null;
    to: string | null;
  };
  hasLabel: string | null;
  hasDraft: boolean | null;
  isArchived: boolean | null;
}

interface SearchAndFilterProps {
  onSearchChange: (options: SearchOptions) => void;
  className?: string;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({ onSearchChange, className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedImportance, setSelectedImportance] = useState<number[]>([]);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState<boolean | null>(null);
  const [isArchived, setIsArchived] = useState<boolean | null>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  // Available filter options
  const categories = Object.values(EMAIL_CATEGORIES);
  const importanceOptions = [
    { value: 10, label: 'Critical (10)' },
    { value: 9, label: 'Very High (9)' },
    { value: 8, label: 'High (8)' },
    { value: 7, label: 'Medium-High (7)' },
    { value: 6, label: 'Medium (6)' },
    { value: 5, label: 'Normal (5)' },
    { value: 4, label: 'Medium-Low (4)' },
    { value: 3, label: 'Low (3)' },
    { value: 2, label: 'Very Low (2)' },
    { value: 1, label: 'Minimal (1)' },
  ];
  
  const labelOptions = [
    'Priority', 
    'Low_Priority', 
    'Needs_Scheduling', 
    'Needs_Answer', 
    'Finance'
  ];

  // Update search when any filter changes
  useEffect(() => {
    onSearchChange({
      searchTerm,
      categories: selectedCategories,
      importance: selectedImportance,
      dateRange,
      hasLabel: selectedLabel,
      hasDraft,
      isArchived
    });
  }, [searchTerm, selectedCategories, selectedImportance, dateRange, selectedLabel, hasDraft, isArchived, onSearchChange]);

  // Handle click outside to close filters
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Toggle category selection
  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  // Toggle importance selection
  const toggleImportance = (importance: number) => {
    if (selectedImportance.includes(importance)) {
      setSelectedImportance(selectedImportance.filter(i => i !== importance));
    } else {
      setSelectedImportance([...selectedImportance, importance]);
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedImportance([]);
    setDateRange({ from: null, to: null });
    setSelectedLabel(null);
    setHasDraft(null);
    setIsArchived(null);
  };

  // Count active filters
  const activeFilterCount = 
    selectedCategories.length + 
    selectedImportance.length + 
    (dateRange.from !== null ? 1 : 0) + 
    (dateRange.to !== null ? 1 : 0) + 
    (selectedLabel !== null ? 1 : 0) + 
    (hasDraft !== null ? 1 : 0) + 
    (isArchived !== null ? 1 : 0);

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search emails..."
            className="block w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          {searchTerm && (
            <button
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 px-4 py-2 rounded-lg border ${
              activeFilterCount > 0
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            } hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
          >
            <Filter className="h-5 w-5" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center bg-blue-600 text-white text-xs font-medium rounded-full h-5 min-w-5 px-1">
                {activeFilterCount}
              </span>
            )}
          </button>

          {showFilters && (
            <div 
              ref={filtersRef}
              className="absolute right-0 mt-2 w-80 sm:w-96 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-dark-lg border border-gray-200 dark:border-gray-700 z-30 animate-fade-in transform origin-top-right"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
                <button
                  onClick={resetFilters}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                >
                  Reset all
                </button>
              </div>

              {/* Category filter */}
              <div className="mb-4">
                <h4 className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Tag className="h-4 w-4 mr-1" />
                  Categories
                </h4>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        selectedCategories.includes(category)
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/30'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {category.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Importance filter */}
              <div className="mb-4">
                <h4 className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Star className="h-4 w-4 mr-1" />
                  Importance
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {importanceOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => toggleImportance(option.value)}
                      className={`px-2 py-1 text-xs rounded border transition-colors ${
                        selectedImportance.includes(option.value)
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/30'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date range filter */}
              <div className="mb-4">
                <h4 className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="h-4 w-4 mr-1" />
                  Date Range
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From</label>
                    <input
                      type="date"
                      value={dateRange.from || ''}
                      onChange={(e) => setDateRange({ ...dateRange, from: e.target.value || null })}
                      className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">To</label>
                    <input
                      type="date"
                      value={dateRange.to || ''}
                      onChange={(e) => setDateRange({ ...dateRange, to: e.target.value || null })}
                      className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Label filter */}
              <div className="mb-4">
                <h4 className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Tag className="h-4 w-4 mr-1" />
                  Label
                </h4>
                <div className="flex flex-wrap gap-2">
                  {labelOptions.map((label) => (
                    <button
                      key={label}
                      onClick={() => setSelectedLabel(selectedLabel === label ? null : label)}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        selectedLabel === label
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/30'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {label.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status filters */}
              <div className="grid grid-cols-2 gap-4">
                {/* Has draft filter */}
                <div>
                  <h4 className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Edit className="h-4 w-4 mr-1" />
                    Draft Status
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setHasDraft(hasDraft === true ? null : true)}
                      className={`px-2 py-1 text-xs rounded border transition-colors ${
                        hasDraft === true
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/30'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      Has Draft
                    </button>
                    <button
                      onClick={() => setHasDraft(hasDraft === false ? null : false)}
                      className={`px-2 py-1 text-xs rounded border transition-colors ${
                        hasDraft === false
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/30'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      No Draft
                    </button>
                  </div>
                </div>

                {/* Archive status filter */}
                <div>
                  <h4 className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Archive className="h-4 w-4 mr-1" />
                    Archive Status
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsArchived(isArchived === true ? null : true)}
                      className={`px-2 py-1 text-xs rounded border transition-colors ${
                        isArchived === true
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/30'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      Archived
                    </button>
                    <button
                      onClick={() => setIsArchived(isArchived === false ? null : false)}
                      className={`px-2 py-1 text-xs rounded border transition-colors ${
                        isArchived === false
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/30'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      Not Archived
                    </button>
                  </div>
                </div>
              </div>

              {/* Saved searches (future feature) */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Saved Searches
                  </h4>
                  <button
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                  >
                    Save Current
                  </button>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                  Coming soon
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active filters display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedCategories.map(category => (
            <div key={category} className="flex items-center bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-full px-2 py-1">
              <span>{category.replace(/_/g, ' ')}</span>
              <button
                onClick={() => toggleCategory(category)}
                className="ml-1 text-blue-400 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          
          {selectedImportance.map(importance => (
            <div key={importance} className="flex items-center bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-full px-2 py-1">
              <span>Importance: {importance}</span>
              <button
                onClick={() => toggleImportance(importance)}
                className="ml-1 text-blue-400 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          
          {dateRange.from && (
            <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-full px-2 py-1">
              <span>From: {dateRange.from}</span>
              <button
                onClick={() => setDateRange({ ...dateRange, from: null })}
                className="ml-1 text-blue-400 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          
          {dateRange.to && (
            <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-full px-2 py-1">
              <span>To: {dateRange.to}</span>
              <button
                onClick={() => setDateRange({ ...dateRange, to: null })}
                className="ml-1 text-blue-400 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          
          {selectedLabel && (
            <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-full px-2 py-1">
              <span>Label: {selectedLabel.replace(/_/g, ' ')}</span>
              <button
                onClick={() => setSelectedLabel(null)}
                className="ml-1 text-blue-400 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          
          {hasDraft !== null && (
            <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-full px-2 py-1">
              <span>{hasDraft ? 'Has Draft' : 'No Draft'}</span>
              <button
                onClick={() => setHasDraft(null)}
                className="ml-1 text-blue-400 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          
          {isArchived !== null && (
            <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-full px-2 py-1">
              <span>{isArchived ? 'Archived' : 'Not Archived'}</span>
              <button
                onClick={() => setIsArchived(null)}
                className="ml-1 text-blue-400 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          
          {activeFilterCount > 1 && (
            <button
              onClick={resetFilters}
              className="flex items-center text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAndFilter; 