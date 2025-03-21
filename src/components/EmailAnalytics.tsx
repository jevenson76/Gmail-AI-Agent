import React, { useState, useEffect } from 'react';
import { BarChart3, PieChart, LineChart, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { format, subDays, parseISO, isSameDay, differenceInDays } from 'date-fns';

interface EmailAnalyticsProps {
  emails: any[];
  loading?: boolean;
  className?: string;
}

type TimeRangeType = '7d' | '30d' | '90d' | 'all';

const EmailAnalytics: React.FC<EmailAnalyticsProps> = ({ 
  emails, 
  loading = false,
  className = '' 
}) => {
  const [activeTab, setActiveTab] = useState<'volume' | 'categories' | 'importance'>('volume');
  const [timeRange, setTimeRange] = useState<TimeRangeType>('30d');
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Filtered emails based on time range
  const filteredEmails = React.useMemo(() => {
    if (timeRange === 'all') return emails;
    
    const cutoffDate = subDays(new Date(), 
      timeRange === '7d' ? 7 : 
      timeRange === '30d' ? 30 : 
      90
    );
    
    return emails.filter(email => {
      const emailDate = parseISO(email.received_at);
      return emailDate >= cutoffDate;
    });
  }, [emails, timeRange]);

  // Volume chart data
  const volumeData = React.useMemo(() => {
    if (!filteredEmails.length) return [];
    
    const days = timeRange === '7d' ? 7 : 
                 timeRange === '30d' ? 30 : 
                 timeRange === '90d' ? 90 : 
                 Math.max(differenceInDays(
                   new Date(), 
                   parseISO(emails[emails.length - 1].received_at)
                 ), 30);
    
    // Create array of dates
    const dateLabels = Array.from({ length: days }).map((_, i) => {
      const date = subDays(new Date(), i);
      return format(date, 'yyyy-MM-dd');
    }).reverse();
    
    // Count emails per date
    const counts = dateLabels.map(dateLabel => {
      const count = filteredEmails.filter(email => {
        const emailDate = parseISO(email.received_at);
        return isSameDay(emailDate, parseISO(dateLabel));
      }).length;
      
      return {
        date: dateLabel,
        count,
        label: format(parseISO(dateLabel), 'MMM d')
      };
    });
    
    return counts;
  }, [filteredEmails, timeRange, emails]);

  // Categories chart data
  const categoriesData = React.useMemo(() => {
    if (!filteredEmails.length) return [];
    
    const categories: Record<string, number> = {};
    
    filteredEmails.forEach(email => {
      const category = email.category || 'Uncategorized';
      categories[category] = (categories[category] || 0) + 1;
    });
    
    return Object.entries(categories)
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / filteredEmails.length) * 100)
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredEmails]);

  // Importance chart data
  const importanceData = React.useMemo(() => {
    if (!filteredEmails.length) return [];
    
    const importanceCounts: Record<number, number> = {};
    
    filteredEmails.forEach(email => {
      const importance = email.importance_score || 0;
      importanceCounts[importance] = (importanceCounts[importance] || 0) + 1;
    });
    
    return Array.from({ length: 10 }, (_, i) => i + 1).map(importance => ({
      importance,
      count: importanceCounts[importance] || 0,
      percentage: Math.round(((importanceCounts[importance] || 0) / filteredEmails.length) * 100)
    }));
  }, [filteredEmails]);

  // Calculate averages and totals
  const stats = React.useMemo(() => {
    if (!filteredEmails.length) {
      return {
        totalEmails: 0,
        avgImportanceScore: 0,
        highPriorityPercentage: 0,
        lowPriorityPercentage: 0,
        topCategory: 'None',
        topCategoryPercentage: 0
      };
    }
    
    const totalEmails = filteredEmails.length;
    const totalImportance = filteredEmails.reduce((sum, email) => 
      sum + (email.importance_score || 0), 0);
    const avgImportanceScore = totalImportance / totalEmails;
    
    const highPriority = filteredEmails.filter(email => 
      (email.importance_score || 0) >= 8).length;
    const lowPriority = filteredEmails.filter(email => 
      (email.importance_score || 0) <= 3).length;
    
    const highPriorityPercentage = (highPriority / totalEmails) * 100;
    const lowPriorityPercentage = (lowPriority / totalEmails) * 100;
    
    const topCategory = categoriesData.length > 0 ? categoriesData[0].category : 'None';
    const topCategoryPercentage = categoriesData.length > 0 ? categoriesData[0].percentage : 0;
    
    return {
      totalEmails,
      avgImportanceScore: Math.round(avgImportanceScore * 10) / 10,
      highPriorityPercentage: Math.round(highPriorityPercentage),
      lowPriorityPercentage: Math.round(lowPriorityPercentage),
      topCategory,
      topCategoryPercentage
    };
  }, [filteredEmails, categoriesData]);

  // Get colors for charts
  const getImportanceColor = (score: number) => {
    if (score >= 8) return 'bg-red-500';
    if (score >= 5) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Get random colors for category chart
  const getCategoryColor = (index: number) => {
    const colors = [
      'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500'
    ];
    return colors[index % colors.length];
  };

  if (!isExpanded) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-dark-sm p-4 transition-all duration-300 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Email Analytics</h2>
          <button
            onClick={() => setIsExpanded(true)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-dark-sm p-4 transition-all duration-300 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Email Analytics</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRangeType)}
              className="appearance-none bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md py-1 pl-3 pr-8 text-sm text-gray-700 dark:text-gray-300"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
          <button 
            onClick={() => setIsExpanded(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalEmails}</div>
          <div className="text-sm text-blue-700 dark:text-blue-300">Total Emails</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.avgImportanceScore}</div>
          <div className="text-sm text-yellow-700 dark:text-yellow-300">Avg Importance</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.topCategoryPercentage}%</div>
          <div className="text-sm text-green-700 dark:text-green-300">{stats.topCategory.replace(/_/g, ' ')}</div>
        </div>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
        <button
          className={`py-2 px-4 font-medium text-sm flex items-center ${
            activeTab === 'volume'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('volume')}
        >
          <LineChart className="w-4 h-4 mr-1" />
          Volume
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm flex items-center ${
            activeTab === 'categories'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('categories')}
        >
          <PieChart className="w-4 h-4 mr-1" />
          Categories
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm flex items-center ${
            activeTab === 'importance'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('importance')}
        >
          <BarChart3 className="w-4 h-4 mr-1" />
          Importance
        </button>
      </div>

      {loading ? (
        <div className="h-60 flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-gray-400 dark:text-gray-600 animate-spin" />
        </div>
      ) : (
        <>
          {activeTab === 'volume' && (
            <div className="h-60 overflow-hidden">
              {volumeData.length > 0 ? (
                <div className="flex flex-col h-full">
                  <div className="flex-1 flex items-end">
                    {volumeData.map((item, index) => {
                      const height = item.count > 0 
                        ? Math.max(10, (item.count / Math.max(...volumeData.map(d => d.count))) * 100) 
                        : 0;
                      
                      return (
                        <div 
                          key={index} 
                          className="flex-1 flex flex-col items-center justify-end group"
                        >
                          <div className="relative w-full px-1">
                            <div 
                              className="bg-blue-500 dark:bg-blue-600 rounded-t transition-all"
                              style={{ height: `${height}%` }}
                            ></div>
                            <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded px-2 py-1 mb-1 whitespace-nowrap transition-opacity">
                              {item.count} emails on {item.label}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex">
                    {volumeData.map((item, index) => (
                      <div key={index} className="flex-1 text-center">
                        {index % Math.max(1, Math.floor(volumeData.length / 5)) === 0 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">{item.label}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No data available for the selected time range</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="h-60 overflow-auto">
              {categoriesData.length > 0 ? (
                <div className="space-y-3">
                  {categoriesData.map((item, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-28 text-sm text-gray-700 dark:text-gray-300 truncate pr-2">
                        {item.category.replace(/_/g, ' ')}
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                          <div
                            className={`${getCategoryColor(index)} h-4 rounded-full`}
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="w-12 text-right text-sm text-gray-700 dark:text-gray-300">
                        {item.percentage}%
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No data available for the selected time range</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'importance' && (
            <div className="h-60 overflow-auto">
              {importanceData.some(item => item.count > 0) ? (
                <div className="flex items-end h-full">
                  {importanceData.map((item) => {
                    const height = item.count > 0 
                      ? Math.max(10, (item.count / Math.max(...importanceData.map(d => d.count))) * 100) 
                      : 0;
                    
                    return (
                      <div key={item.importance} className="flex-1 flex flex-col items-center group">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {item.count > 0 ? item.count : ''}
                        </div>
                        <div className="relative w-full px-1">
                          <div 
                            className={`${getImportanceColor(item.importance)} rounded-t transition-all`}
                            style={{ height: `${height}%`, maxHeight: '80%' }}
                          ></div>
                          <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded px-2 py-1 mb-1 whitespace-nowrap transition-opacity">
                            {item.count} emails with importance {item.importance}
                          </div>
                        </div>
                        <div className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                          {item.importance}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No data available for the selected time range</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmailAnalytics; 