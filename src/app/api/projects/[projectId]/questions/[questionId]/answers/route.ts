import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/utils/api';
import { validateRequest } from '@/lib/utils/api';
import { createAnswerSchema } from '@/lib/validations/question';
import { canAccessProject } from '@/lib/utils/auth';
import { QuestionStatus } from '@prisma/client';

// 質問に対する回答作成
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
      include: {
        answerForm: {
          include: {
            fields: true,
          },
        },
      },
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

    // 質問がクローズされている場合は回答不可
    if (question.status === QuestionStatus.CLOSED) {
      return NextResponse.json(
        { error: 'クローズされた質問には回答できません' },
        { status: 400 }
      );
    }

    // 回答権限チェック（割り当てられた回答者のみ回答可能）
    if (question.assigneeId !== user.id) {
      return NextResponse.json(
        { error: 'この質問に回答する権限がありません。割り当てられた回答者のみが回答できます。' },
        { status: 403 }
      );
    }

    // リクエストデータのバリデーション
    const validation = await validateRequest(req, createAnswerSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { content, mediaFileIds, formData } = validation.data;

    // 自由記述形式の場合、contentは必須
    if (!question.answerForm && (!content || content.trim() === '')) {
      return NextResponse.json(
        { error: '回答内容は必須です' },
        { status: 400 }
      );
    }

    // 添付ファイルの存在確認
    if (mediaFileIds && mediaFileIds.length > 0) {
      const files = await prisma.mediaFile.findMany({
        where: {
          id: { in: mediaFileIds },
          uploaderId: user.id, // 本人がアップロードしたファイルのみ使用可能
        },
      });

      if (files.length !== mediaFileIds.length) {
        return NextResponse.json(
          { error: '指定されたファイルの一部が見つからないか、使用権限がありません' },
          { status: 400 }
        );
      }
    }

    // 回答フォームのバリデーション
    if (question.answerForm && formData) {
      // 必須フィールドのチェック
      const requiredFields = question.answerForm.fields.filter(
        (field) => field.isRequired
      );

      for (const field of requiredFields) {
        const fieldData = formData.find(
          (data) => data.formFieldId === field.id
        );

        if (!fieldData) {
          return NextResponse.json(
            {
              error: `必須フィールド「${field.label}」が入力されていません`,
            },
            { status: 400 }
          );
        }

        if (field.fieldType === 'FILE' && !fieldData.mediaFileId) {
          return NextResponse.json(
            {
              error: `必須フィールド「${field.label}」にファイルが添付されていません`,
            },
            { status: 400 }
          );
        } else if (field.fieldType !== 'FILE' && !fieldData.value) {
          return NextResponse.json(
            {
              error: `必須フィールド「${field.label}」に値が入力されていません`,
            },
            { status: 400 }
          );
        }
      }

      // フィールドの存在確認
      for (const data of formData) {
        const fieldExists = question.answerForm.fields.some(
          (field) => field.id === data.formFieldId
        );

        if (!fieldExists) {
          return NextResponse.json(
            {
              error: `指定されたフォームフィールド（ID: ${data.formFieldId}）が存在しません`,
            },
            { status: 400 }
          );
        }
      }
    }

    // トランザクションで回答の作成と関連データの作成を行う
    const answer = await prisma.$transaction(async (tx) => {
      // 回答の作成
      const createdAnswer = await tx.answer.create({
        data: {
          content: content || '',
          questionId,
          creatorId: user.id,
        },
      });

      // 添付ファイルの関連付け
      if (mediaFileIds && mediaFileIds.length > 0) {
        await Promise.all(
          mediaFileIds.map((mediaFileId) =>
            tx.answerMediaFile.create({
              data: {
                answerId: createdAnswer.id,
                mediaFileId,
              },
            })
          )
        );
      }

      // フォームデータの作成
      if (formData && formData.length > 0) {
        await Promise.all(
          formData.map((data) =>
            tx.answerFormData.create({
              data: {
                answerId: createdAnswer.id,
                formFieldId: data.formFieldId,
                value: data.value,
                mediaFileId: data.mediaFileId,
              },
            })
          )
        );
      }

      // 質問ステータスを「回答中」に更新
      if (question.status === QuestionStatus.NEW) {
        await tx.question.update({
          where: { id: questionId },
          data: {
            status: QuestionStatus.IN_PROGRESS,
          },
        });
      }

      // 作成した回答の詳細情報を取得
      return tx.answer.findUnique({
        where: { id: createdAnswer.id },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          mediaFiles: {
            include: {
              mediaFile: true,
            },
          },
          formData: {
            include: {
              formField: true,
              mediaFile: true,
            },
          },
        },
      });
    });

    // 質問作成者に通知
    await prisma.notification.create({
      data: {
        userId: question.creatorId,
        type: 'NEW_ANSWER_POSTED',
        message: `あなたの質問「${question.title}」に新しい回答が投稿されました`,
        relatedId: questionId,
      },
    });

    return NextResponse.json(answer, { status: 201 });
  } catch (error) {
    console.error('回答作成エラー:', error);
    return NextResponse.json(
      { error: '回答の作成に失敗しました' },
      { status: 500 }
    );
  }
} 