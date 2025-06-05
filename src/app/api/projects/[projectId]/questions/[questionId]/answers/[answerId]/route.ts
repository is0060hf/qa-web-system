import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/utils/api';
import { validateRequest } from '@/lib/utils/api';
import { updateAnswerSchema } from '@/lib/validations/question';
import { canAccessProject } from '@/lib/utils/auth';
import { QuestionStatus, Role } from '@prisma/client';

// 回答取得
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; questionId: string; answerId: string }> }
) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { projectId, questionId, answerId } = await params;

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

    // 回答の存在確認
    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
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

    if (!answer) {
      return NextResponse.json(
        { error: '回答が見つかりません' },
        { status: 404 }
      );
    }

    // 回答が指定された質問に属しているか確認
    if (answer.questionId !== questionId) {
      return NextResponse.json(
        { error: '指定された質問の回答ではありません' },
        { status: 400 }
      );
    }

    return NextResponse.json(answer);
  } catch (error) {
    console.error('回答取得エラー:', error);
    return NextResponse.json(
      { error: '回答の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 回答更新
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; questionId: string; answerId: string }> }
) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { projectId, questionId, answerId } = await params;

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

    // 回答の存在確認
    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      include: {
        mediaFiles: {
          include: {
            mediaFile: true,
          },
        },
        formData: true,
      },
    });

    if (!answer) {
      return NextResponse.json(
        { error: '回答が見つかりません' },
        { status: 404 }
      );
    }

    // 回答が指定された質問に属しているか確認
    if (answer.questionId !== questionId) {
      return NextResponse.json(
        { error: '指定された質問の回答ではありません' },
        { status: 400 }
      );
    }

    // 更新権限チェック（回答作成者か管理者のみ）
    const isAdmin = user.role === Role.ADMIN;
    const isProjectManager = accessCheck.project.members.some(
      (m: any) => m.role === 'MANAGER' && m.userId === user.id
    ) || accessCheck.project.creatorId === user.id;

    if (!isAdmin && !isProjectManager && answer.creatorId !== user.id) {
      return NextResponse.json(
        { error: 'この回答を更新する権限がありません' },
        { status: 403 }
      );
    }

    // クローズ済みの質問は更新不可
    if (question.status === QuestionStatus.CLOSED) {
      return NextResponse.json(
        { error: 'クローズされた質問の回答は更新できません' },
        { status: 400 }
      );
    }

    // リクエストデータのバリデーション
    const validation = await validateRequest(req, updateAnswerSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { content, mediaFileIds, formData } = validation.data;

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

    // トランザクションで回答の更新と関連データの更新を行う
    const updatedAnswer = await prisma.$transaction(async (tx) => {
      // 回答の更新
      const updated = await tx.answer.update({
        where: { id: answerId },
        data: {
          content,
          updatedAt: new Date(),
        },
      });

      // 添付ファイルの更新
      if (mediaFileIds) {
        // 既存の添付ファイル関連を全て削除
        await tx.answerMediaFile.deleteMany({
          where: { answerId },
        });

        // 新しい添付ファイル関連を追加
        if (mediaFileIds.length > 0) {
          await Promise.all(
            mediaFileIds.map((mediaFileId) =>
              tx.answerMediaFile.create({
                data: {
                  answerId,
                  mediaFileId,
                },
              })
            )
          );
        }
      }

      // フォームデータの更新
      if (formData) {
        // 既存のフォームデータを全て削除
        await tx.answerFormData.deleteMany({
          where: { answerId },
        });

        // 新しいフォームデータを追加
        if (formData.length > 0) {
          await Promise.all(
            formData.map((data) =>
              tx.answerFormData.create({
                data: {
                  answerId,
                  formFieldId: data.formFieldId,
                  value: data.value,
                  mediaFileId: data.mediaFileId,
                },
              })
            )
          );
        }
      }

      // 更新した回答の詳細情報を取得
      return tx.answer.findUnique({
        where: { id: answerId },
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

    return NextResponse.json(updatedAnswer);
  } catch (error) {
    console.error('回答更新エラー:', error);
    return NextResponse.json(
      { error: '回答の更新に失敗しました' },
      { status: 500 }
    );
  }
}

// 回答削除
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; questionId: string; answerId: string }> }
) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { projectId, questionId, answerId } = await params;

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

    // クローズ済みの質問は更新不可
    if (question.status === QuestionStatus.CLOSED) {
      return NextResponse.json(
        { error: 'クローズされた質問の回答は削除できません' },
        { status: 400 }
      );
    }

    // 回答の存在確認
    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
    });

    if (!answer) {
      return NextResponse.json(
        { error: '回答が見つかりません' },
        { status: 404 }
      );
    }

    // 回答が指定された質問に属しているか確認
    if (answer.questionId !== questionId) {
      return NextResponse.json(
        { error: '指定された質問の回答ではありません' },
        { status: 400 }
      );
    }

    // 削除権限チェック（回答作成者か管理者のみ）
    const isAdmin = user.role === Role.ADMIN;
    const isProjectManager = accessCheck.project.members.some(
      (m: any) => m.role === 'MANAGER' && m.userId === user.id
    ) || accessCheck.project.creatorId === user.id;

    if (!isAdmin && !isProjectManager && answer.creatorId !== user.id) {
      return NextResponse.json(
        { error: 'この回答を削除する権限がありません' },
        { status: 403 }
      );
    }

    // トランザクションで回答と関連データを削除
    await prisma.$transaction([
      // 回答フォームデータの削除
      prisma.answerFormData.deleteMany({
        where: { answerId },
      }),
      // 回答メディアファイル関連の削除
      prisma.answerMediaFile.deleteMany({
        where: { answerId },
      }),
      // 回答の削除
      prisma.answer.delete({
        where: { id: answerId },
      }),
    ]);

    // 質問のステータス確認と更新
    const answersCount = await prisma.answer.count({
      where: { questionId },
    });

    // 回答が0件になったら、かつステータスが「回答中」だった場合は「新規」に戻す
    if (answersCount === 0 && question.status === QuestionStatus.IN_PROGRESS) {
      await prisma.question.update({
        where: { id: questionId },
        data: {
          status: QuestionStatus.NEW,
        },
      });
    }

    return NextResponse.json({
      message: '回答が正常に削除されました',
    });
  } catch (error) {
    console.error('回答削除エラー:', error);
    return NextResponse.json(
      { error: '回答の削除に失敗しました' },
      { status: 500 }
    );
  }
} 