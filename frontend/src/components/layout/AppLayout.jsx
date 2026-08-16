import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Modal } from '../common/Modal';
import { searchApi } from '@/api/search';
import { useProject } from '@/context/ProjectContext';
import { Search, AlertOctagon, FileText, Server, ArrowRight } from 'lucide-react';
import { SeverityBadge } from '../common/SeverityBadge';

export const AppLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const { activeProject } = useProject();
  const navigate = useNavigate();

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchChange = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const resp = await searchApi.search({
        query: query.trim(),
        project_id: activeProject?.id,
        page_size: 10,
      });
      setSearchResults(resp.items || []);
    } catch (err) {
      console.error('Global search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex">
      {/* Collapsible Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <Topbar onSearchClick={() => setIsSearchOpen(true)} />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          <Outlet />
        </main>
      </div>

      {/* Global Command/Search Palette Modal */}
      <Modal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        title="Search ObserveAI"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Search incidents, logs, services, or knowledge..."
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2">
            {isSearching ? (
              <p className="text-xs text-center text-slate-400 py-6">Searching telemetry indexes...</p>
            ) : searchResults.length > 0 ? (
              searchResults.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setIsSearchOpen(false);
                    if (item.entity_type === 'incident') {
                      navigate(`/incidents/${item.id}`);
                    } else if (item.entity_type === 'service') {
                      navigate(`/services`);
                    } else if (item.entity_type === 'log') {
                      navigate(`/logs`);
                    }
                  }}
                  className="w-full text-left p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    {item.entity_type === 'incident' ? (
                      <AlertOctagon className="w-4 h-4 text-rose-500" />
                    ) : item.entity_type === 'service' ? (
                      <Server className="w-4 h-4 text-brand-500" />
                    ) : (
                      <FileText className="w-4 h-4 text-teal-500" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500 transition-colors" />
                </button>
              ))
            ) : searchQuery.trim() ? (
              <p className="text-xs text-center text-slate-400 py-6">No search results found.</p>
            ) : (
              <div className="py-4 text-center">
                <p className="text-xs text-slate-400">Quick Navigation</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <button
                    onClick={() => {
                      setIsSearchOpen(false);
                      navigate('/incidents');
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-500 hover:text-white transition-colors"
                  >
                    View Incidents
                  </button>
                  <button
                    onClick={() => {
                      setIsSearchOpen(false);
                      navigate('/logs');
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-500 hover:text-white transition-colors"
                  >
                    Explore Logs
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
