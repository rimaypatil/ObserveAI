import React, { createContext, useContext, useEffect, useState } from 'react';
import { Project } from '@/types/api';
import { CreateProjectPayload, projectsApi } from '@/api/projects';
import { useAuth } from './AuthContext';

interface ProjectContextType {
  projects: Project[];
  activeProject: Project | null;
  isLoading: boolean;
  selectProject: (projectId: string) => void;
  refreshProjects: () => Promise<void>;
  createProject: (payload: CreateProjectPayload) => Promise<Project>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProjects = async () => {
    if (!isAuthenticated) {
      setProjects([]);
      setActiveProject(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const list = await projectsApi.listProjects();
      setProjects(list);

      const savedProjectId = localStorage.getItem('observeai_active_project_id');
      if (savedProjectId && list.some(p => p.id === savedProjectId)) {
        const found = list.find(p => p.id === savedProjectId)!;
        setActiveProject(found);
      } else if (list.length > 0) {
        setActiveProject(list[0]);
        localStorage.setItem('observeai_active_project_id', list[0].id);
      } else {
        setActiveProject(null);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [isAuthenticated]);

  const selectProject = (projectId: string) => {
    const found = projects.find(p => p.id === projectId);
    if (found) {
      setActiveProject(found);
      localStorage.setItem('observeai_active_project_id', found.id);
    }
  };

  const createProject = async (payload: CreateProjectPayload): Promise<Project> => {
    const created = await projectsApi.createProject(payload);
    setProjects(prev => [created, ...prev]);
    setActiveProject(created);
    localStorage.setItem('observeai_active_project_id', created.id);
    return created;
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        isLoading,
        selectProject,
        refreshProjects: fetchProjects,
        createProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
