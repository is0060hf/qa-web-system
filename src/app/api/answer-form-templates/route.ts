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

// テンプレート作成のスキーマ
const createTemplateSchema = z.object({
  name: z.string().min(1, 'テンプレート名は必須です'),
  description: z.string().optional(),
  fields: z.array(formFieldSchema).min(1, '最低1つのフィールドが必要です'),
});

// テンプレート一覧取得（GET）
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');

    // 自身が作成したテンプレートを取得
    const templates = await prisma.answerFormTemplate.findMany({
      where: {
        creatorId: user.id,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // fieldsJsonをパースして返す
    const templatesWithParsedFields = templates.map(template => ({
      ...template,
      fields: template.fieldsJson,
    }));

    return NextResponse.json(templatesWithParsedFields);
  } catch (error) {
    console.error('テンプレート一覧取得エラー:', error);
    return NextResponse.json(
      { error: 'テンプレート一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// テンプレート作成（POST）
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // リクエストのバリデーション
    const validation = await validateRequest(req, createTemplateSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { name, description, fields } = validation.data;

    // フィールドにorder番号を設定
    const fieldsWithOrder = fields.map((field, index) => ({
      ...field,
      order: field.order !== undefined ? field.order : index,
    }));

    // テンプレートを作成
    const template = await prisma.answerFormTemplate.create({
      data: {
        name,
        description,
        creatorId: user.id,
        fieldsJson: fieldsWithOrder,
      },
    });

    return NextResponse.json(
      {
        ...template,
        fields: template.fieldsJson,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('テンプレート作成エラー:', error);
    return NextResponse.json(
      { error: 'テンプレートの作成に失敗しました' },
      { status: 500 }
    );
  }
} 