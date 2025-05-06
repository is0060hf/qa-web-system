import { NextResponse } from 'next/server';
import { canAccessProject, canManageProject } from '@/lib/utils/auth';
import prisma from '@/lib/db';
import { Role, ProjectRole } from '@prisma/client';

// NextResponse.jsonをモック
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      ...originalModule.NextResponse,
      json: jest.fn((body, init) => ({
        body,
        status: init?.status || 200,
      })),
    },
  };
});

describe('Auth Utilities Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('canAccessProject', () => {
    it('should grant access to admin users for any project', async () => {
      // モックプロジェクト
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        creatorId: 'creator-user',
        members: [],
        creator: {
          id: 'creator-user',
          name: 'Creator User',
          email: 'creator@example.com',
        },
      };

      // プロジェクト取得のモック
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);

      // テスト用管理者ユーザー
      const adminUser = {
        id: 'admin-user',
        email: 'admin@example.com',
        role: Role.ADMIN,
      };

      // 関数実行
      const result = await canAccessProject('project-1', adminUser);

      // プロジェクト検索が行われたことを確認
      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'project-1' },
        include: expect.objectContaining({
          members: expect.any(Object),
          creator: expect.any(Object),
        }),
      });

      // アクセス権が付与されたことを確認
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('project', mockProject);
    });

    it('should grant access to project creator', async () => {
      // プロジェクト作成者と同じIDのユーザー
      const creatorId = 'creator-user';
      
      // モックプロジェクト
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        creatorId,
        members: [],
        creator: {
          id: creatorId,
          name: 'Creator User',
          email: 'creator@example.com',
        },
      };

      // プロジェクト取得のモック
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);

      // テスト用作成者ユーザー
      const creatorUser = {
        id: creatorId,
        email: 'creator@example.com',
        role: Role.USER,
      };

      // 関数実行
      const result = await canAccessProject('project-1', creatorUser);

      // アクセス権が付与されたことを確認
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('project', mockProject);
    });

    it('should grant access to project members', async () => {
      // テスト用メンバーID
      const memberId = 'member-user';
      
      // モックプロジェクト（メンバーがいる）
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        creatorId: 'creator-user',
        members: [
          {
            id: 'membership-1',
            userId: memberId,
            role: ProjectRole.MEMBER,
            user: {
              id: memberId,
              name: 'Member User',
              email: 'member@example.com',
            },
          },
        ],
        creator: {
          id: 'creator-user',
          name: 'Creator User',
          email: 'creator@example.com',
        },
      };

      // プロジェクト取得のモック
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);

      // テスト用メンバーユーザー
      const memberUser = {
        id: memberId,
        email: 'member@example.com',
        role: Role.USER,
      };

      // 関数実行
      const result = await canAccessProject('project-1', memberUser);

      // アクセス権が付与されたことを確認
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('project', mockProject);
      expect(result).toHaveProperty('membership', mockProject.members[0]);
    });

    it('should deny access to non-members', async () => {
      // モックプロジェクト
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        creatorId: 'creator-user',
        members: [
          {
            id: 'membership-1',
            userId: 'member-user',
            role: ProjectRole.MEMBER,
            user: {
              id: 'member-user',
              name: 'Member User',
              email: 'member@example.com',
            },
          },
        ],
        creator: {
          id: 'creator-user',
          name: 'Creator User',
          email: 'creator@example.com',
        },
      };

      // プロジェクト取得のモック
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);

      // プロジェクトに参加していないユーザー
      const nonMemberUser = {
        id: 'non-member-user',
        email: 'nonmember@example.com',
        role: Role.USER,
      };

      // 関数実行
      const result = await canAccessProject('project-1', nonMemberUser);

      // アクセスが拒否されたことを確認
      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) }),
        { status: 403 }
      );
    });

    it('should handle non-existent projects', async () => {
      // プロジェクトが存在しないことをモック
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      // テスト用ユーザー
      const user = {
        id: 'test-user',
        email: 'test@example.com',
        role: Role.USER,
      };

      // 関数実行
      const result = await canAccessProject('non-existent-project', user);

      // プロジェクト検索が行われたことを確認
      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-project' },
        include: expect.any(Object),
      });

      // 404エラーが返されることを確認
      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) }),
        { status: 404 }
      );
    });

    it('should handle database errors gracefully', async () => {
      // データベースエラーをモック
      (prisma.project.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      // コンソールエラーをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // テスト用ユーザー
      const user = {
        id: 'test-user',
        email: 'test@example.com',
        role: Role.USER,
      };

      // 関数実行
      const result = await canAccessProject('project-1', user);

      // エラーログが出力されたことを確認
      expect(consoleSpy).toHaveBeenCalled();

      // エラーレスポンスが返されることを確認
      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) }),
        { status: 500 }
      );

      // スパイをリセット
      consoleSpy.mockRestore();
    });
  });

  describe('canManageProject', () => {
    it('should grant management access to admin users', async () => {
      // モックプロジェクト
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        creatorId: 'creator-user',
        members: [],
        creator: {
          id: 'creator-user',
          name: 'Creator User',
          email: 'creator@example.com',
        },
      };

      // canAccessProjectの結果をモック
      const mockAccessResult = {
        success: true,
        project: mockProject,
        membership: null,
      };
      
      // Mockを使用せず直接関数を上書き
      const originalCanAccessProject = (globalThis as any).canAccessProject;
      (globalThis as any).canAccessProject = jest.fn().mockResolvedValue(mockAccessResult);

      // テスト用管理者ユーザー
      const adminUser = {
        id: 'admin-user',
        email: 'admin@example.com',
        role: Role.ADMIN,
      };

      // 関数実行
      const result = await canManageProject('project-1', adminUser);

      // 管理権限が付与されたことを確認
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('project', mockProject);

      // 元の関数に戻す
      (globalThis as any).canAccessProject = originalCanAccessProject;
    });

    it('should grant management access to project creator', async () => {
      // テスト用作成者ID
      const creatorId = 'creator-user';
      
      // モックプロジェクト
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        creatorId,
        members: [],
        creator: {
          id: creatorId,
          name: 'Creator User',
          email: 'creator@example.com',
        },
      };

      // canAccessProjectの結果をモック
      const mockAccessResult = {
        success: true,
        project: mockProject,
        membership: null,
      };
      
      // Mockを使用してcanAccessProjectをモック
      jest.spyOn(globalThis as any, 'canAccessProject').mockResolvedValue(mockAccessResult);

      // テスト用作成者ユーザー
      const creatorUser = {
        id: creatorId,
        email: 'creator@example.com',
        role: Role.USER,
      };

      // 関数実行
      const result = await canManageProject('project-1', creatorUser);

      // 管理権限が付与されたことを確認
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('project', mockProject);
    });

    it('should grant management access to project managers', async () => {
      // テスト用メンバーID
      const managerId = 'manager-user';
      
      // モックプロジェクト
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        creatorId: 'creator-user',
        members: [],
        creator: {
          id: 'creator-user',
          name: 'Creator User',
          email: 'creator@example.com',
        },
      };

      // モックメンバーシップ（管理者権限）
      const mockMembership = {
        id: 'membership-1',
        userId: managerId,
        role: ProjectRole.MANAGER,
      };

      // canAccessProjectの結果をモック
      const mockAccessResult = {
        success: true,
        project: mockProject,
        membership: mockMembership,
      };
      
      // canAccessProjectをモック
      jest.spyOn(globalThis as any, 'canAccessProject').mockResolvedValue(mockAccessResult);

      // テスト用マネージャユーザー
      const managerUser = {
        id: managerId,
        email: 'manager@example.com',
        role: Role.USER,
      };

      // 関数実行
      const result = await canManageProject('project-1', managerUser);

      // 管理権限が付与されたことを確認
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('project', mockProject);
    });

    it('should deny management access to regular members', async () => {
      // テスト用メンバーID
      const memberId = 'member-user';
      
      // モックプロジェクト
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        creatorId: 'creator-user',
        members: [],
        creator: {
          id: 'creator-user',
          name: 'Creator User',
          email: 'creator@example.com',
        },
      };

      // モックメンバーシップ（一般メンバー権限）
      const mockMembership = {
        id: 'membership-1',
        userId: memberId,
        role: ProjectRole.MEMBER, // 管理者ではない
      };

      // canAccessProjectの結果をモック
      const mockAccessResult = {
        success: true,
        project: mockProject,
        membership: mockMembership,
      };
      
      // canAccessProjectをモック
      jest.spyOn(globalThis as any, 'canAccessProject').mockResolvedValue(mockAccessResult);

      // テスト用一般メンバーユーザー
      const memberUser = {
        id: memberId,
        email: 'member@example.com',
        role: Role.USER,
      };

      // 関数実行
      const result = await canManageProject('project-1', memberUser);

      // 管理権限が拒否されたことを確認
      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) }),
        { status: 403 }
      );
    });

    it('should pass through error from canAccessProject', async () => {
      // エラーレスポンス
      const errorResponse = NextResponse.json(
        { error: 'アクセス権限がありません' },
        { status: 403 }
      );

      // canAccessProjectが失敗することをモック
      const mockAccessResult = {
        success: false,
        error: errorResponse,
      };
      
      // canAccessProjectをモック
      jest.spyOn(globalThis as any, 'canAccessProject').mockResolvedValue(mockAccessResult);

      // テスト用ユーザー
      const user = {
        id: 'test-user',
        email: 'test@example.com',
        role: Role.USER,
      };

      // 関数実行
      const result = await canManageProject('project-1', user);

      // エラーがそのまま渡されることを確認
      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error', errorResponse);
    });
  });
}); 