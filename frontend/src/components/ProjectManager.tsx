import React, { useState, useEffect } from 'react';
import { Save, FolderOpen, Trash2, Download, Upload, Clock, Star, Search } from 'lucide-react';
import { useGenerationStore } from '../stores/generationStore';
import { useToast } from '../stores/toastStore';

interface ProjectManagerProps {
  className?: string;
}

interface SavedProject {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  createdAt: Date;
  updatedAt: Date;
  size: number;
  starred: boolean;
  tags: string[];
  generatedCode: any;
  plan: any;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({ className = '' }) => {
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [filterStarred, setFilterStarred] = useState(false);
  
  const { generatedCode, currentPlan, loadProject } = useGenerationStore();
  const { success, error } = useToast();

  // Load saved projects from localStorage on mount
  useEffect(() => {
    loadSavedProjects();
  }, []);

  const loadSavedProjects = () => {
    try {
      const saved = localStorage.getItem('ai-prototype-projects');
      if (saved) {
        const projects = JSON.parse(saved).map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt)
        }));
        setSavedProjects(projects);
      }
    } catch (err) {
      console.error('Failed to load saved projects:', err);
    }
  };

  const saveProjectsToStorage = (projects: SavedProject[]) => {
    try {
      localStorage.setItem('ai-prototype-projects', JSON.stringify(projects));
    } catch (err) {
      console.error('Failed to save projects:', err);
      error('Failed to save projects to storage');
    }
  };

  const handleSaveProject = () => {
    if (!generatedCode?.completeHTML) {
      error('No code to save');
      return;
    }

    if (!projectName.trim()) {
      error('Please enter a project name');
      return;
    }

    const newProject: SavedProject = {
      id: `project-${Date.now()}`,
      name: projectName.trim(),
      description: projectDescription.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
      size: generatedCode.completeHTML.length,
      starred: false,
      tags: [],
      generatedCode,
      plan: currentPlan
    };

    const updatedProjects = [...savedProjects, newProject];
    setSavedProjects(updatedProjects);
    saveProjectsToStorage(updatedProjects);

    setProjectName('');
    setProjectDescription('');
    setShowSaveModal(false);
    success(`Project "${newProject.name}" saved successfully`);
  };

  const handleLoadProject = (project: SavedProject) => {
    try {
      loadProject(project.generatedCode, project.plan);
      setShowLoadModal(false);
      success(`Project "${project.name}" loaded successfully`);
    } catch (err) {
      error('Failed to load project');
    }
  };

  const handleDeleteProject = (projectId: string) => {
    const project = savedProjects.find(p => p.id === projectId);
    if (!project) return;

    if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
      const updatedProjects = savedProjects.filter(p => p.id !== projectId);
      setSavedProjects(updatedProjects);
      saveProjectsToStorage(updatedProjects);
      success(`Project "${project.name}" deleted`);
    }
  };

  const handleToggleStar = (projectId: string) => {
    const updatedProjects = savedProjects.map(p =>
      p.id === projectId ? { ...p, starred: !p.starred } : p
    );
    setSavedProjects(updatedProjects);
    saveProjectsToStorage(updatedProjects);
  };

  const handleExportProject = (project: SavedProject) => {
    const dataStr = JSON.stringify(project, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    success(`Project "${project.name}" exported`);
  };

  const handleImportProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const projectData = JSON.parse(e.target?.result as string);
        const importedProject: SavedProject = {
          ...projectData,
          id: `project-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const updatedProjects = [...savedProjects, importedProject];
        setSavedProjects(updatedProjects);
        saveProjectsToStorage(updatedProjects);
        success(`Project "${importedProject.name}" imported successfully`);
      } catch (err) {
        error('Failed to import project - invalid file format');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const filteredProjects = savedProjects
    .filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          project.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStarred = !filterStarred || project.starred;
      return matchesSearch && matchesStarred;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'size':
          return b.size - a.size;
        case 'date':
        default:
          return b.updatedAt.getTime() - a.updatedAt.getTime();
      }
    });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center">
          <FolderOpen className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Project Manager</h3>
          <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
            {savedProjects.length} projects
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors cursor-pointer">
            <Upload className="h-4 w-4 mr-2" />
            Import
            <input
              type="file"
              accept=".json"
              onChange={handleImportProject}
              className="hidden"
            />
          </label>
          
          <button
            onClick={() => setShowLoadModal(true)}
            className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Load
          </button>
          
          <button
            onClick={() => setShowSaveModal(true)}
            disabled={!generatedCode?.completeHTML}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </button>
        </div>
      </div>

      {/* Project List */}
      <div className="p-6">
        {savedProjects.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">No saved projects</p>
            <p className="text-sm mt-1">Save your first project to get started</p>
          </div>
        ) : (
          <>
            {/* Filters and Search */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search projects..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date">Sort by Date</option>
                  <option value="name">Sort by Name</option>
                  <option value="size">Sort by Size</option>
                </select>
                
                <button
                  onClick={() => setFilterStarred(!filterStarred)}
                  className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                    filterStarred
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Starred Only
                </button>
              </div>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => (
                <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{project.name}</h4>
                      {project.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{project.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleToggleStar(project.id)}
                      className={`ml-2 p-1 rounded ${
                        project.starred ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
                      }`}
                    >
                      <Star className={`h-4 w-4 ${project.starred ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500 mb-3">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{formatDate(project.updatedAt)}</span>
                    <span className="mx-2">•</span>
                    <span>{formatFileSize(project.size)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleLoadProject(project)}
                      className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200 transition-colors"
                    >
                      <FolderOpen className="h-3 w-3 mr-1" />
                      Load
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleExportProject(project)}
                        className="p-1 text-gray-500 hover:text-gray-700 rounded"
                        title="Export"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="p-1 text-red-500 hover:text-red-700 rounded"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900">Save Project</h4>
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProject}
                  disabled={!projectName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900">Load Project</h4>
              <button
                onClick={() => setShowLoadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-96">
              {savedProjects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No saved projects found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedProjects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <h5 className="font-medium text-gray-900">{project.name}</h5>
                          {project.starred && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current ml-2" />
                          )}
                        </div>
                        {project.description && (
                          <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                        )}
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <span>{formatDate(project.updatedAt)}</span>
                          <span className="mx-2">•</span>
                          <span>{formatFileSize(project.size)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleLoadProject(project)}
                        className="ml-4 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        Load
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};