import { create } from 'zustand';
import { fetchData } from '@/lib/utils/fetchData';

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
      
      const data = await fetchData<{projects: Project[], total: number}>('projects', {
        params: {
          page: page.toString(),
          limit: limit.toString(),
          ...(search && { search })
        }
      });
      
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
      
      const projectData = await fetchData<ProjectDetails>(`projects/${projectId}`, {});
      
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
      
      const newProject = await fetchData<Project>('projects', {
        method: 'POST',
        body: data
      });
      
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
      
      const updatedProject = await fetchData<Project>(`projects/${projectId}`, {
        method: 'PATCH',
        body: data
      });
      
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
      
      await fetchData<{ success: boolean }>(`projects/${projectId}`, {
        method: 'DELETE'
      });
      
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
      const tags = await fetchData<Tag[]>(`projects/${projectId}/tags`, {});
      
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
      const newTag = await fetchData<Tag>(`projects/${projectId}/tags`, {
        method: 'POST',
        body: { name }
      });
      
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
      const updatedTag = await fetchData<Tag>(`projects/${projectId}/tags/${tagId}`, {
        method: 'PATCH',
        body: { name }
      });
      
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
      await fetchData<{ success: boolean }>(`projects/${projectId}/tags/${tagId}`, {
        method: 'DELETE'
      });
      
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
      await fetchData<{ success: boolean }>(`projects/${projectId}/invitations`, {
        method: 'POST',
        body: { 
          type: 'userId',
          userId 
        }
      });
    } catch (error) {
      throw error;
    }
  },
  
  // メールでユーザーをプロジェクトに招待（新規ユーザー）
  inviteUserByEmail: async (projectId: string, email: string) => {
    try {
      await fetchData<{ success: boolean }>(`projects/${projectId}/invitations`, {
        method: 'POST',
        body: { 
          type: 'email',
          email 
        }
      });
    } catch (error) {
      throw error;
    }
  },
  
  // プロジェクトメンバーの役割を更新
  updateMemberRole: async (projectId: string, memberId: string, role: 'MANAGER' | 'MEMBER') => {
    try {
      await fetchData<ProjectMember>(`projects/${projectId}/members/${memberId}`, {
        method: 'PATCH',
        body: { role }
      });
      
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
      await fetchData<{ success: boolean }>(`projects/${projectId}/members/${memberId}`, {
        method: 'DELETE'
      });
      
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