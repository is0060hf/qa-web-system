import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/utils/api';
import { validateRequest } from '@/lib/utils/api';
import { z } from 'zod';

// フォームフィールドの型定義
const formFieldSchema = z.object({
  label: z.string().min(1, 'ラベルは必須です'),
  fieldType: z.enum(['TEXT', 'NUMBER', 'RADIO', 'FILE', 'TEXTAREA']),
  options: z.array(z.string()).optional(),
  isRequired: z.boolean().optional().default(false),
  order: z.number().optional(),
});

// テンプレート更新のスキーマ
const updateTemplateSchema = z.object({
  name: z.string().min(1, 'テンプレート名は必須です').optional(),
  description: z.string().optional(),
  fields: z.array(formFieldSchema).min(1, '最低1つのフィールドが必要です').optional(),
});

// テンプレート詳細取得（GET）
export async function GET(
  req: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { templateId } = params;

    // テンプレートを取得
    const template = await prisma.answerFormTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'テンプレートが見つかりません' },
        { status: 404 }
      );
    }

    // 作成者本人かチェック
    if (template.creatorId !== user.id) {
      return NextResponse.json(
        { error: 'このテンプレートへのアクセス権限がありません' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ...template,
      fields: template.fieldsJson,
    });
  } catch (error) {
    console.error('テンプレート詳細取得エラー:', error);
    return NextResponse.json(
      { error: 'テンプレートの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// テンプレート更新（PATCH）
export async function PATCH(
  req: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { templateId } = params;

    // テンプレートの存在確認
    const template = await prisma.answerFormTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'テンプレートが見つかりません' },
        { status: 404 }
      );
    }

    // 作成者本人かチェック
    if (template.creatorId !== user.id) {
      return NextResponse.json(
        { error: 'このテンプレートを更新する権限がありません' },
        { status: 403 }
      );
    }

    // リクエストのバリデーション
    const validation = await validateRequest(req, updateTemplateSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { name, description, fields } = validation.data;

    // 更新データの準備
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (fields !== undefined) {
      // フィールドにorder番号を設定
      const fieldsWithOrder = fields.map((field, index) => ({
        ...field,
        order: field.order !== undefined ? field.order : index,
      }));
      updateData.fieldsJson = fieldsWithOrder;
    }

    // テンプレートを更新
    const updatedTemplate = await prisma.answerFormTemplate.update({
      where: { id: templateId },
      data: updateData,
    });

    return NextResponse.json({
      ...updatedTemplate,
      fields: updatedTemplate.fieldsJson,
    });
  } catch (error) {
    console.error('テンプレート更新エラー:', error);
    return NextResponse.json(
      { error: 'テンプレートの更新に失敗しました' },
      { status: 500 }
    );
  }
}

// テンプレート削除（DELETE）
export async function DELETE(
  req: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { templateId } = params;

    // テンプレートの存在確認
    const template = await prisma.answerFormTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'テンプレートが見つかりません' },
        { status: 404 }
      );
    }

    // 作成者本人かチェック
    if (template.creatorId !== user.id) {
      return NextResponse.json(
        { error: 'このテンプレートを削除する権限がありません' },
        { status: 403 }
      );
    }

    // テンプレートを削除
    await prisma.answerFormTemplate.delete({
      where: { id: templateId },
    });

    return NextResponse.json(null, { status: 204 });
  } catch (error) {
    console.error('テンプレート削除エラー:', error);
    return NextResponse.json(
      { error: 'テンプレートの削除に失敗しました' },
      { status: 500 }
    );
  }
} 