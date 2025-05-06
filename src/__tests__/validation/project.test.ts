import { z } from 'zod';
import {
  createProjectSchema,
  updateProjectSchema,
  addProjectMemberSchema,
  updateProjectMemberRoleSchema,
  createProjectTagSchema,
  inviteToProjectSchema
} from '@/lib/validations/project';
import { ProjectRole } from '@prisma/client';

describe('Project Validation Schemas Tests', () => {
  describe('createProjectSchema', () => {
    it('should validate valid project creation data', () => {
      // 有効なデータ
      const validData = {
        name: 'テストプロジェクト',
        description: 'これはテスト用プロジェクトの説明です。'
      };

      // バリデーション実行
      const result = createProjectSchema.safeParse(validData);

      // 検証
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should validate project without description', () => {
      // 説明なしの最小限データ
      const minimalData = {
        name: 'テストプロジェクト'
      };

      // バリデーション実行
      const result = createProjectSchema.safeParse(minimalData);

      // 検証
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(minimalData);
      }
    });

    it('should reject empty project name', () => {
      // 名前が空のデータ
      const invalidData = {
        name: '',
        description: '説明あり'
      };

      // バリデーション実行
      const result = createProjectSchema.safeParse(invalidData);

      // 検証
      expect(result.success).toBe(false);
    });

    it('should reject too long project name', () => {
      // 長すぎる名前のデータ
      const invalidData = {
        name: 'a'.repeat(101), // 100文字超過
        description: '説明'
      };

      // バリデーション実行
      const result = createProjectSchema.safeParse(invalidData);

      // 検証
      expect(result.success).toBe(false);
    });

    it('should reject too long description', () => {
      // 長すぎる説明のデータ
      const invalidData = {
        name: 'テストプロジェクト',
        description: 'a'.repeat(1001) // 1000文字超過
      };

      // バリデーション実行
      const result = createProjectSchema.safeParse(invalidData);

      // 検証
      expect(result.success).toBe(false);
    });
  });

  describe('updateProjectSchema', () => {
    it('should validate partial project updates', () => {
      // 名前のみの更新
      const nameUpdate = {
        name: '更新後プロジェクト名'
      };

      // 説明のみの更新
      const descriptionUpdate = {
        description: '更新後の説明文'
      };

      // 両方の更新
      const fullUpdate = {
        name: '新プロジェクト名',
        description: '新しい説明文'
      };

      // バリデーション実行と検証
      expect(updateProjectSchema.safeParse(nameUpdate).success).toBe(true);
      expect(updateProjectSchema.safeParse(descriptionUpdate).success).toBe(true);
      expect(updateProjectSchema.safeParse(fullUpdate).success).toBe(true);
    });

    it('should validate removing description', () => {
      // 説明を空文字列に更新
      const emptyDescriptionUpdate = {
        description: ''
      };

      // バリデーション実行
      const result = updateProjectSchema.safeParse(emptyDescriptionUpdate);

      // 検証
      expect(result.success).toBe(true);
    });

    it('should reject invalid updates', () => {
      // 無効な名前の更新
      const invalidNameUpdate = {
        name: '' // 空の名前
      };

      // 長すぎる説明の更新
      const invalidDescriptionUpdate = {
        description: 'a'.repeat(1001) // 1000文字超過
      };

      // バリデーション実行と検証
      expect(updateProjectSchema.safeParse(invalidNameUpdate).success).toBe(false);
      expect(updateProjectSchema.safeParse(invalidDescriptionUpdate).success).toBe(false);
    });
  });

  describe('addProjectMemberSchema', () => {
    it('should validate adding a member with valid role', () => {
      // 管理者として追加
      const managerData = {
        userId: 'user-123',
        role: ProjectRole.MANAGER
      };

      // メンバーとして追加
      const memberData = {
        userId: 'user-456',
        role: ProjectRole.MEMBER
      };

      // バリデーション実行と検証
      expect(addProjectMemberSchema.safeParse(managerData).success).toBe(true);
      expect(addProjectMemberSchema.safeParse(memberData).success).toBe(true);
    });

    it('should reject invalid user ID or role', () => {
      // 空のユーザーID
      const emptyUserIdData = {
        userId: '',
        role: ProjectRole.MEMBER
      };

      // 無効なロール
      const invalidRoleData = {
        userId: 'user-123',
        role: 'INVALID_ROLE' // 存在しないロール
      };

      // バリデーション実行と検証
      expect(addProjectMemberSchema.safeParse(emptyUserIdData).success).toBe(false);
      expect(addProjectMemberSchema.safeParse(invalidRoleData).success).toBe(false);
    });
  });

  describe('updateProjectMemberRoleSchema', () => {
    it('should validate role updates', () => {
      // 管理者ロールへの更新
      const toManagerRole = {
        role: ProjectRole.MANAGER
      };

      // メンバーロールへの更新
      const toMemberRole = {
        role: ProjectRole.MEMBER
      };

      // バリデーション実行と検証
      expect(updateProjectMemberRoleSchema.safeParse(toManagerRole).success).toBe(true);
      expect(updateProjectMemberRoleSchema.safeParse(toMemberRole).success).toBe(true);
    });

    it('should reject invalid roles', () => {
      // 無効なロール値
      const invalidRole = {
        role: 'INVALID_ROLE'
      };

      // バリデーション実行と検証
      expect(updateProjectMemberRoleSchema.safeParse(invalidRole).success).toBe(false);
    });
  });

  describe('createProjectTagSchema', () => {
    it('should validate valid tag names', () => {
      // 有効なタグ名
      const validTag = {
        name: 'テストタグ'
      };

      // バリデーション実行
      const result = createProjectTagSchema.safeParse(validTag);

      // 検証
      expect(result.success).toBe(true);
    });

    it('should reject empty tag names', () => {
      // 空のタグ名
      const emptyTag = {
        name: ''
      };

      // バリデーション実行
      const result = createProjectTagSchema.safeParse(emptyTag);

      // 検証
      expect(result.success).toBe(false);
    });

    it('should reject too long tag names', () => {
      // 長すぎるタグ名
      const longTag = {
        name: 'a'.repeat(51) // 50文字超過
      };

      // バリデーション実行
      const result = createProjectTagSchema.safeParse(longTag);

      // 検証
      expect(result.success).toBe(false);
    });
  });

  describe('inviteToProjectSchema', () => {
    it('should validate valid email addresses', () => {
      // 有効なメールアドレス
      const validEmails = [
        { email: 'test@example.com' },
        { email: 'user.name+tag@example.co.jp' },
        { email: 'admin@sub.domain.org' }
      ];

      // 各メールアドレスのバリデーション実行と検証
      validEmails.forEach(data => {
        expect(inviteToProjectSchema.safeParse(data).success).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      // 無効なメールアドレス
      const invalidEmails = [
        { email: 'not-an-email' },
        { email: 'missing@domain' },
        { email: '@missing-username.com' },
        { email: 'space in@email.com' },
        { email: '' }
      ];

      // 各メールアドレスのバリデーション実行と検証
      invalidEmails.forEach(data => {
        expect(inviteToProjectSchema.safeParse(data).success).toBe(false);
      });
    });
  });
}); 