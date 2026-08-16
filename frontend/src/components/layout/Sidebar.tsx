import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useProject } from '@/context/ProjectContext';
import {
  Activity,
  AlertOctagon,
  BookOpen,
  Bot,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cpu,
  FileText,
  FolderPlus,
  LayoutDashboard,
  Moon,
  Plus,
  Server,
  Settings,
  Sun,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { clsx } from 'clsx';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  isDarkMode,
  toggleDarkMode,
}) => {
  const { user } = useAuth();
  const { projects, activeProject, selectProject, createProject } = useProject();
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectEnv, setNewProjectEnv] = useState('production');
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Incidents', path: '/incidents', icon: AlertOctagon },
    { label: 'Services', path: '/services', icon: Server },
    { label: 'AI Investigations', path: '/ai-investigations', icon: Bot },
    { label: 'Logs', path: '/logs', icon: FileText },
    { label: 'Metrics', path: '/metrics', icon: Cpu },
    { label: 'Knowledge Base', path: '/knowledge', icon: BookOpen },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setIsSubmittingProject(true);
    try {
      await createProject({
        name: newProjectName.trim(),
        environment: newProjectEnv,
      });
      setIsNewProjectModalOpen(false);
      setNewProjectName('');
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setIsSubmittingProject(false);
    }
  };

  return (
    <>
      <aside
        className={clsx(
          'fixed top-0 left-0 bottom-0 z-40 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 flex-shrink-0">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            {!isCollapsed && (
              <span className="font-bold text-lg text-white tracking-tight">
                Observe<span className="text-brand-400">AI</span>
              </span>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Project Selector */}
        <div className="p-3 border-b border-slate-800 relative">
          <button
            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
            className={clsx(
              'w-full flex items-center justify-between p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-200 transition-colors border border-slate-700/50',
              isCollapsed && 'justify-center'
            )}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                {activeProject ? activeProject.name.charAt(0).toUpperCase() : 'P'}
              </div>
              {!isCollapsed && (
                <div className="text-left overflow-hidden">
                  <p className="text-xs font-semibold text-white truncate">
                    {activeProject ? activeProject.name : 'Select Project'}
                  </p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                    {activeProject ? activeProject.environment : '—'}
                  </p>
                </div>
              )}
            </div>
            {!isCollapsed && <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Project Dropdown Menu */}
          {isProjectDropdownOpen && (
            <div className="absolute left-3 right-3 top-16 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 space-y-1">
              <p className="text-[10px] font-semibold uppercase text-slate-400 px-2 py-1 tracking-wider font-mono">
                Projects
              </p>
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    selectProject(p.id);
                    setIsProjectDropdownOpen(false);
                  }}
                  className={clsx(
                    'w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left',
                    activeProject?.id === p.id
                      ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40'
                      : 'text-slate-300 hover:bg-slate-800'
                  )}
                >
                  <span className="truncate">{p.name}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {p.environment}
                  </span>
                </button>
              ))}

              {user?.role?.toUpperCase() === 'OWNER' && (
                <button
                  onClick={() => {
                    setIsProjectDropdownOpen(false);
                    setIsNewProjectModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-brand-400 hover:bg-slate-800 transition-colors border-t border-slate-800 mt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create New Project
                </button>
              )}
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                    isActive
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20 font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80',
                    isCollapsed && 'justify-center px-0'
                  )
                }
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Theme & Collapse Footer */}
        <div className="p-3 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={toggleDarkMode}
            className={clsx(
              'flex items-center gap-2 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors w-full',
              isCollapsed && 'justify-center'
            )}
            title="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            {!isCollapsed && <span className="text-xs font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
        </div>
      </aside>

      {/* New Project Modal */}
      <Modal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        title="Create New Project"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Project Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Payment Infrastructure"
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Target Environment
            </label>
            <select
              value={newProjectEnv}
              onChange={e => setNewProjectEnv(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsNewProjectModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingProject}
              className="px-4 py-2 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmittingProject ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};
