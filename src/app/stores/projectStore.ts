import { create } from 'zustand';

// タグの型定義
export interface Tag {
  id: string;
  name: string;
}

// プロジェクトメンバーの型定義
export interface ProjectMember {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: 'MANAGER' | 'MEMBER';
  joinedAt: string;
}

// プロジェクトの型定義
export interface Project {
  id: string;
  name: string;
  description: string | null;
  creatorId: string;
  creatorName: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

// プロジェクト詳細の型定義（プロジェクト情報 + メンバー + タグ）
export interface ProjectDetails extends Project {
  members: ProjectMember[];
  tags: Tag[];
}

// プロジェクト作成/更新データの型定義
export interface ProjectFormData {
  name: string;
  description?: string;
}

// プロジェクトストアの状態型定義
interface ProjectState {
  projects: Project[];
  selectedProject: ProjectDetails | null;
  totalProjects: number;
  isLoading: boolean;
  error: string | null;
  
  // アクション
  fetchProjects: (page?: number, limit?: number, search?: string) => Promise<void>;
  fetchProjectById: (projectId: string) => Promise<void>;
  createProject: (data: ProjectFormData) => Promise<Project>;
  updateProject: (projectId: string, data: ProjectFormData) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  
  // タグ関連
  fetchProjectTags: (projectId: string) => Promise<Tag[]>;
  createProjectTag: (projectId: string, name: string) => Promise<Tag>;
  updateProjectTag: (projectId: string, tagId: string, name: string) => Promise<Tag>;
  deleteProjectTag: (projectId: string, tagId: string) => Promise<void>;
  
  // メンバー関連
  inviteUserToProject: (projectId: string, userId: string) => Promise<void>;
  inviteUserByEmail: (projectId: string, email: string) => Promise<void>;
  updateMemberRole: (projectId: string, memberId: string, role: 'MANAGER' | 'MEMBER') => Promise<void>;
  removeMember: (projectId: string, memberId: string) => Promise<void>;
}

// プロジェクトストアの作成
export const useProjectStore = create<ProjectState>()((set, get) => ({
  projects: [],
  selectedProject: null,
  totalProjects: 0,
  isLoading: false,
  error: null,
  
  // プロジェクト一覧を取得
  fetchProjects: async (page = 1, limit = 10, search = '') => {
    try {
      set({ isLoading: true, error: null });
      
      const queryParams = new URLSearchParams();
      queryParams.set('page', page.toString());
      queryParams.set('limit', limit.toString());
      if (search) queryParams.set('search', search);
      
      const response = await fetch(`/api/projects?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('プロジェクトの取得に失敗しました');
      }
      
      const data = await response.json();
      
      set({ 
        projects: data.projects,
        totalProjects: data.total,
        isLoading: false
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'プロジェクトの取得に失敗しました',
        isLoading: false
      });
    }
  },
  
  // 特定のプロジェクト詳細を取得
  fetchProjectById: async (projectId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await fetch(`/api/projects/${projectId}`);
      
      if (!response.ok) {
        throw new Error('プロジェクト詳細の取得に失敗しました');
      }
      
      const projectData = await response.json();
      
      set({ selectedProject: projectData, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'プロジェクト詳細の取得に失敗しました',
        isLoading: false,
        selectedProject: null
      });
    }
  },
  
  // プロジェクトを作成
  createProject: async (data: ProjectFormData) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'プロジェクトの作成に失敗しました');
      }
      
      const newProject = await response.json();
      
      // プロジェクト一覧を更新
      set(state => ({
        projects: [newProject, ...state.projects],
        totalProjects: state.totalProjects + 1,
        isLoading: false
      }));
      
      return newProject;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'プロジェクトの作成に失敗しました',
        isLoading: false
      });
      throw error;
    }
  },
  
  // プロジェクトを更新
  updateProject: async (projectId: string, data: ProjectFormData) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'プロジェクトの更新に失敗しました');
      }
      
      const updatedProject = await response.json();
      
      // プロジェクト一覧とselectedProjectを更新
      set(state => ({
        projects: state.projects.map(project => 
          project.id === projectId ? { ...project, ...updatedProject } : project
        ),
        selectedProject: state.selectedProject && state.selectedProject.id === projectId
          ? { ...state.selectedProject, ...updatedProject }
          : state.selectedProject,
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'プロジェクトの更新に失敗しました',
        isLoading: false
      });
      throw error;
    }
  },
  
  // プロジェクトを削除
  deleteProject: async (projectId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('プロジェクトの削除に失敗しました');
      }
      
      // プロジェクト一覧から削除
      set(state => ({
        projects: state.projects.filter(project => project.id !== projectId),
        selectedProject: state.selectedProject?.id === projectId ? null : state.selectedProject,
        totalProjects: state.totalProjects - 1,
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'プロジェクトの削除に失敗しました',
        isLoading: false
      });
      throw error;
    }
  },
  
  // プロジェクトのタグを取得
  fetchProjectTags: async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/tags`);
      
      if (!response.ok) {
        throw new Error('プロジェクトタグの取得に失敗しました');
      }
      
      const tags = await response.json();
      
      // selectedProjectがある場合は更新
      set(state => {
        if (state.selectedProject && state.selectedProject.id === projectId) {
          return {
            selectedProject: {
              ...state.selectedProject,
              tags
            }
          };
        }
        return {};
      });
      
      return tags;
    } catch (error) {
      console.error('プロジェクトタグの取得エラー:', error);
      return [];
    }
  },
  
  // プロジェクトにタグを作成
  createProjectTag: async (projectId: string, name: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'タグの作成に失敗しました');
      }
      
      const newTag = await response.json();
      
      // selectedProjectのタグリストを更新
      set(state => {
        if (state.selectedProject && state.selectedProject.id === projectId) {
          return {
            selectedProject: {
              ...state.selectedProject,
              tags: [...state.selectedProject.tags, newTag]
            }
          };
        }
        return {};
      });
      
      return newTag;
    } catch (error) {
      throw error;
    }
  },
  
  // プロジェクトのタグを更新
  updateProjectTag: async (projectId: string, tagId: string, name: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/tags/${tagId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'タグの更新に失敗しました');
      }
      
      const updatedTag = await response.json();
      
      // selectedProjectのタグリストを更新
      set(state => {
        if (state.selectedProject && state.selectedProject.id === projectId) {
          return {
            selectedProject: {
              ...state.selectedProject,
              tags: state.selectedProject.tags.map(tag => 
                tag.id === tagId ? updatedTag : tag
              )
            }
          };
        }
        return {};
      });
      
      return updatedTag;
    } catch (error) {
      throw error;
    }
  },
  
  // プロジェクトのタグを削除
  deleteProjectTag: async (projectId: string, tagId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/tags/${tagId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('タグの削除に失敗しました');
      }
      
      // selectedProjectのタグリストを更新
      set(state => {
        if (state.selectedProject && state.selectedProject.id === projectId) {
          return {
            selectedProject: {
              ...state.selectedProject,
              tags: state.selectedProject.tags.filter(tag => tag.id !== tagId)
            }
          };
        }
        return {};
      });
    } catch (error) {
      throw error;
    }
  },
  
  // ユーザーをプロジェクトに招待（既存ユーザー）
  inviteUserToProject: async (projectId: string, userId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'ユーザーの招待に失敗しました');
      }
    } catch (error) {
      throw error;
    }
  },
  
  // メールでユーザーをプロジェクトに招待（新規ユーザー）
  inviteUserByEmail: async (projectId: string, email: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'ユーザーの招待に失敗しました');
      }
    } catch (error) {
      throw error;
    }
  },
  
  // プロジェクトメンバーの役割を更新
  updateMemberRole: async (projectId: string, memberId: string, role: 'MANAGER' | 'MEMBER') => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      
      if (!response.ok) {
        throw new Error('メンバーの役割更新に失敗しました');
      }
      
      const updatedMember = await response.json();
      
      // selectedProjectのメンバーリストを更新
      set(state => {
        if (state.selectedProject && state.selectedProject.id === projectId) {
          return {
            selectedProject: {
              ...state.selectedProject,
              members: state.selectedProject.members.map(member => 
                member.id === memberId ? { ...member, role } : member
              )
            }
          };
        }
        return {};
      });
    } catch (error) {
      throw error;
    }
  },
  
  // プロジェクトからメンバーを削除
  removeMember: async (projectId: string, memberId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('メンバーの削除に失敗しました');
      }
      
      // selectedProjectのメンバーリストを更新
      set(state => {
        if (state.selectedProject && state.selectedProject.id === projectId) {
          return {
            selectedProject: {
              ...state.selectedProject,
              members: state.selectedProject.members.filter(member => member.id !== memberId),
              memberCount: state.selectedProject.memberCount - 1
            }
          };
        }
        return {};
      });
    } catch (error) {
      throw error;
    }
  }
})); 