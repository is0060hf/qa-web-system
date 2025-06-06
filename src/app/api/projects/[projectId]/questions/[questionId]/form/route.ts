import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/utils/api';
import { validateRequest } from '@/lib/utils/api';
import { createAnswerFormSchema } from '@/lib/validations/question';
import { canAccessProject } from '@/lib/utils/auth';
import { QuestionStatus, Role } from '@prisma/client';

// 回答フォーム取得
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; questionId: string }> }
) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { projectId, questionId } = await params;

    // プロジェクトへのアクセス権をチェック
    const accessCheck = await canAccessProject(projectId, user);
    if (!accessCheck.success) {
      return accessCheck.error;
    }

    // 質問の存在確認
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json(
        { error: '質問が見つかりません' },
        { status: 404 }
      );
    }

    // 質問が指定されたプロジェクトに属しているか確認
    if (question.projectId !== projectId) {
      return NextResponse.json(
        { error: '指定されたプロジェクトの質問ではありません' },
        { status: 400 }
      );
    }

    // 回答フォームの取得
    const answerForm = await prisma.answerForm.findUnique({
      where: { questionId },
      include: {
        fields: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!answerForm) {
      return NextResponse.json(
        { error: 'この質問には回答フォームが設定されていません' },
        { status: 404 }
      );
    }

    return NextResponse.json(answerForm);
  } catch (error) {
    console.error('回答フォーム取得エラー:', error);
    return NextResponse.json(
      { error: '回答フォームの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 回答フォーム作成または更新
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; questionId: string }> }
) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { projectId, questionId } = await params;

    // プロジェクトへのアクセス権をチェック
    const accessCheck = await canAccessProject(projectId, user);
    if (!accessCheck.success) {
      return accessCheck.error;
    }

    // 質問の存在確認
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json(
        { error: '質問が見つかりません' },
        { status: 404 }
      );
    }

    // 質問が指定されたプロジェクトに属しているか確認
    if (question.projectId !== projectId) {
      return NextResponse.json(
        { error: '指定されたプロジェクトの質問ではありません' },
        { status: 400 }
      );
    }

    // 権限チェック（質問作成者、管理者、プロジェクト管理者のみ更新可能）
    const isAdmin = user.role === Role.ADMIN;
    const isProjectManager = accessCheck.project.members.some(
      (m: any) => m.role === 'MANAGER' && m.userId === user.id
    ) || accessCheck.project.creatorId === user.id;

    if (!isAdmin && !isProjectManager && question.creatorId !== user.id) {
      return NextResponse.json(
        { error: 'この質問のフォームを作成・更新する権限がありません' },
        { status: 403 }
      );
    }

    // クローズ済みの質問は更新不可
    if (question.status === QuestionStatus.CLOSED) {
      return NextResponse.json(
        { error: 'クローズされた質問のフォームは更新できません' },
        { status: 400 }
      );
    }

    // リクエストデータのバリデーション
    const validation = await validateRequest(req, createAnswerFormSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { fields } = validation.data;

    // トランザクションでフォームの更新を行う
    const answerForm = await prisma.$transaction(async (tx) => {
      // 既存のフォームがあるか確認
      const existingForm = await tx.answerForm.findUnique({
        where: { questionId },
        include: { fields: true },
      });

      let form;

      if (existingForm) {
        // 既存のフィールドを全て削除
        await tx.answerFormField.deleteMany({
          where: { answerFormId: existingForm.id },
        });

        // フォームを更新
        form = await tx.answerForm.update({
          where: { id: existingForm.id },
          data: {
            updatedAt: new Date(),
          },
        });
      } else {
        // 新規フォーム作成
        form = await tx.answerForm.create({
          data: {
            questionId,
          },
        });
      }

      // フィールドを作成
      const createdFields = await Promise.all(
        fields.map((field, index) =>
          tx.answerFormField.create({
            data: {
              answerFormId: form.id,
              label: field.label,
              fieldType: field.fieldType,
              options: field.options || [],
              isRequired: field.isRequired || false,
              order: field.order !== undefined ? field.order : index,
            },
          })
        )
      );

      return {
        ...form,
        fields: createdFields,
      };
    });

    return NextResponse.json(answerForm, {
      status: 201,
    });
  } catch (error) {
    console.error('回答フォーム作成・更新エラー:', error);
    return NextResponse.json(
      { error: '回答フォームの作成・更新に失敗しました' },
      { status: 500 }
    );
  }
}

// 回答フォーム削除
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; questionId: string }> }
) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { projectId, questionId } = await params;

    // プロジェクトへのアクセス権をチェック
    const accessCheck = await canAccessProject(projectId, user);
    if (!accessCheck.success) {
      return accessCheck.error;
    }

    // 質問の存在確認
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json(
        { error: '質問が見つかりません' },
        { status: 404 }
      );
    }

    // 質問が指定されたプロジェクトに属しているか確認
    if (question.projectId !== projectId) {
      return NextResponse.json(
        { error: '指定されたプロジェクトの質問ではありません' },
        { status: 400 }
      );
    }

    // 権限チェック（質問作成者、管理者、プロジェクト管理者のみ削除可能）
    const isAdmin = user.role === Role.ADMIN;
    const isProjectManager = accessCheck.project.members.some(
      (m: any) => m.role === 'MANAGER' && m.userId === user.id
    ) || accessCheck.project.creatorId === user.id;

    if (!isAdmin && !isProjectManager && question.creatorId !== user.id) {
      return NextResponse.json(
        { error: 'この質問のフォームを削除する権限がありません' },
        { status: 403 }
      );
    }

    // クローズ済みの質問は更新不可
    if (question.status === QuestionStatus.CLOSED) {
      return NextResponse.json(
        { error: 'クローズされた質問のフォームは削除できません' },
        { status: 400 }
      );
    }

    // 回答フォームの存在確認
    const answerForm = await prisma.answerForm.findUnique({
      where: { questionId },
    });

    if (!answerForm) {
      return NextResponse.json(
        { error: 'この質問には回答フォームが設定されていません' },
        { status: 404 }
      );
    }

    // この質問に関連する回答がすでにあるか確認
    const answersCount = await prisma.answer.count({
      where: { questionId },
    });

    if (answersCount > 0) {
      return NextResponse.json(
        {
          error:
            'この質問にはすでに回答があるため、フォームを削除できません',
        },
        { status: 400 }
      );
    }

    // フォームと関連フィールドの削除
    await prisma.$transaction([
      prisma.answerFormField.deleteMany({
        where: { answerFormId: answerForm.id },
      }),
      prisma.answerForm.delete({
        where: { id: answerForm.id },
      }),
    ]);

    return NextResponse.json({
      message: '回答フォームが正常に削除されました',
    });
  } catch (error) {
    console.error('回答フォーム削除エラー:', error);
    return NextResponse.json(
      { error: '回答フォームの削除に失敗しました' },
      { status: 500 }
    );
  }
} 