import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useProject } from '@/context/ProjectContext';
import { Bell, LogOut, Search, User, ShieldCheck } from 'lucide-react';

export const Topbar = ({ onSearchClick }) => {
  const { user, logout } = useAuth();
  const { activeProject } = useProject();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Active Project & Search */}
      <div className="flex items-center gap-4">
        {activeProject ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {activeProject.name}
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {activeProject.environment}
            </span>
          </div>
        ) : (
          <span className="text-sm font-medium text-slate-500">No project selected</span>
        )}

        <button
          onClick={onSearchClick}
          className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs transition-colors w-64"
        >
          <Search className="w-4 h-4 text-slate-400" />
          <span>Search incidents, logs, services...</span>
          <kbd className="ml-auto font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 font-semibold">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Actions & User Menu */}
      <div className="flex items-center gap-3 relative">
        <button
          onClick={() => navigate('/settings')}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
          title="Notifications & Alerts"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-white dark:ring-slate-900" />
        </button>

        {/* User Profile Button */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-500/40 text-brand-600 dark:text-brand-400 font-bold text-xs flex items-center justify-center">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate leading-tight">
                {user?.full_name || 'User'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate leading-tight font-mono font-semibold uppercase">
                {user?.role ? user.role.toUpperCase() : 'MEMBER'}
              </p>
            </div>
          </button>

          {/* User Menu Dropdown */}
          {isUserMenuOpen && (
            <div className="absolute right-0 top-12 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 space-y-1 z-50 animate-fade-in">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {user?.full_name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {user?.email}
                </p>
              </div>

              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  navigate('/settings/profile');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <User className="w-4 h-4 text-slate-400" />
                Profile Settings
              </button>

              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
