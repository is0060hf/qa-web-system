import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/utils/api';

// 質問詳細取得
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { questionId } = await params;

    // 質問を取得
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        project: {
          include: {
            members: {
              where: {
                userId: user.id,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        answerForm: {
          include: {
            fields: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
        answers: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            formData: {
              include: {
                formField: true,
              },
            },
            mediaFiles: {
              include: {
                mediaFile: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!question) {
      return NextResponse.json({ error: '質問が見つかりません' }, { status: 404 });
    }

    // アクセス権限のチェック
    // Admin、質問作成者、担当者、プロジェクトメンバーのみアクセス可能
    const isAdmin = user.role === 'ADMIN';
    const isCreator = question.creatorId === user.id;
    const isAssignee = question.assigneeId === user.id;
    const isProjectMember = question.project.members.length > 0;

    if (!isAdmin && !isCreator && !isAssignee && !isProjectMember) {
      return NextResponse.json(
        { error: 'この質問を閲覧する権限がありません' },
        { status: 403 }
      );
    }

    // レスポンス形式を整形
    const formattedQuestion = {
      id: question.id,
      title: question.title,
      content: question.content,
      status: question.status,
      priority: question.priority,
      deadline: question.deadline,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
      project: {
        id: question.project.id,
        name: question.project.name,
        description: question.project.description,
      },
      creator: {
        id: question.creator.id,
        name: question.creator.name || question.creator.email,
        email: question.creator.email,
      },
      assignee: {
        id: question.assignee.id,
        name: question.assignee.name || question.assignee.email,
        email: question.assignee.email,
      },
      tags: question.tags.map(qt => ({
        id: qt.tag.id,
        name: qt.tag.name,
      })),
      answerForm: question.answerForm ? {
        id: question.answerForm.id,
        fields: question.answerForm.fields.map(field => ({
          id: field.id,
          label: field.label,
          fieldType: field.fieldType,
          options: field.options,
          isRequired: field.isRequired,
          order: field.order,
        })),
      } : null,
      answers: question.answers.map(answer => ({
        id: answer.id,
        content: answer.content,
        createdAt: answer.createdAt,
        updatedAt: answer.updatedAt,
        user: {
          id: answer.creator.id,
          name: answer.creator.name || answer.creator.email,
          email: answer.creator.email,
        },
        formResponses: answer.formData.map(response => ({
          id: response.id,
          formFieldId: response.formFieldId,
          formFieldLabel: response.formField.label,
          value: response.value,
          mediaFileId: response.mediaFileId,
        })),
        attachments: answer.mediaFiles.map(attachment => ({
          id: attachment.mediaFile.id,
          fileName: attachment.mediaFile.fileName,
          fileSize: attachment.mediaFile.fileSize,
          fileType: attachment.mediaFile.fileType,
          storageUrl: attachment.mediaFile.storageUrl,
          createdAt: attachment.mediaFile.createdAt,
        })),
      })),
    };

    return NextResponse.json(formattedQuestion);
  } catch (error) {
    console.error('質問詳細取得エラー:', error);
    return NextResponse.json(
      { error: '質問詳細の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 質問更新
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { questionId } = await params;
    const body = await req.json();

    // 既存の質問を確認
    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        project: {
          include: {
            members: {
              where: {
                userId: user.id,
                role: 'MANAGER',
              },
            },
          },
        },
      },
    });

    if (!existingQuestion) {
      return NextResponse.json({ error: '質問が見つかりません' }, { status: 404 });
    }

    // 権限チェック：質問作成者、プロジェクト管理者、またはAdminのみ更新可能
    const isAdmin = user.role === 'ADMIN';
    const isCreator = existingQuestion.creatorId === user.id;
    const isProjectManager = existingQuestion.project.members.length > 0;

    if (!isAdmin && !isCreator && !isProjectManager) {
      return NextResponse.json(
        { error: 'この質問を更新する権限がありません' },
        { status: 403 }
      );
    }

    // ステータスがCLOSEDの質問は更新不可
    if (existingQuestion.status === 'CLOSED') {
      return NextResponse.json(
        { error: 'クローズされた質問は更新できません' },
        { status: 400 }
      );
    }

    // 更新データの準備
    const updateData: any = {};

    if (body.title) updateData.title = body.title;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.assigneeId) {
      // 担当者の存在確認
      const assignee = await prisma.user.findUnique({
        where: { id: body.assigneeId },
      });
      if (!assignee) {
        return NextResponse.json(
          { error: '指定された担当者が存在しません' },
          { status: 400 }
        );
      }
      updateData.assigneeId = body.assigneeId;
    }
    if (body.deadline !== undefined) updateData.deadline = body.deadline ? new Date(body.deadline) : null;
    if (body.priority) updateData.priority = body.priority;

    // タグの更新
    if (body.tagIds !== undefined) {
      // 既存のタグ関連を削除
      await prisma.questionTag.deleteMany({
        where: { questionId },
      });

      // 新しいタグ関連を作成
      if (body.tagIds.length > 0) {
        await prisma.questionTag.createMany({
          data: body.tagIds.map((tagId: string) => ({
            questionId,
            tagId,
          })),
        });
      }
    }

    // 質問を更新
    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: updateData,
      include: {
        project: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // 担当者が変更された場合、通知を作成
    if (body.assigneeId && body.assigneeId !== existingQuestion.assigneeId) {
      await prisma.notification.create({
        data: {
          userId: body.assigneeId,
          type: 'NEW_QUESTION_ASSIGNED',
          message: `新しい質問「${updatedQuestion.title}」が割り当てられました`,
          relatedId: updatedQuestion.id,
        },
      });
    }

    return NextResponse.json({
      id: updatedQuestion.id,
      title: updatedQuestion.title,
      content: updatedQuestion.content,
      status: updatedQuestion.status,
      priority: updatedQuestion.priority,
      deadline: updatedQuestion.deadline,
      projectId: updatedQuestion.projectId,
      projectName: updatedQuestion.project.name,
      creator: {
        id: updatedQuestion.creator.id,
        name: updatedQuestion.creator.name || updatedQuestion.creator.email,
      },
      assignee: {
        id: updatedQuestion.assignee.id,
        name: updatedQuestion.assignee.name || updatedQuestion.assignee.email,
      },
      tags: updatedQuestion.tags.map(qt => ({
        id: qt.tag.id,
        name: qt.tag.name,
      })),
      createdAt: updatedQuestion.createdAt,
      updatedAt: updatedQuestion.updatedAt,
    });
  } catch (error) {
    console.error('質問更新エラー:', error);
    return NextResponse.json(
      { error: '質問の更新に失敗しました' },
      { status: 500 }
    );
  }
}

// 質問削除
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { questionId } = await params;

    // 既存の質問を確認
    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        project: {
          include: {
            members: {
              where: {
                userId: user.id,
                role: 'MANAGER',
              },
            },
          },
        },
      },
    });

    if (!existingQuestion) {
      return NextResponse.json({ error: '質問が見つかりません' }, { status: 404 });
    }

    // 権限チェック：質問作成者、プロジェクト管理者、またはAdminのみ削除可能
    const isAdmin = user.role === 'ADMIN';
    const isCreator = existingQuestion.creatorId === user.id;
    const isProjectManager = existingQuestion.project.members.length > 0;

    if (!isAdmin && !isCreator && !isProjectManager) {
      return NextResponse.json(
        { error: 'この質問を削除する権限がありません' },
        { status: 403 }
      );
    }

    // 質問を削除（関連するデータも自動的に削除される）
    await prisma.question.delete({
      where: { id: questionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('質問削除エラー:', error);
    return NextResponse.json(
      { error: '質問の削除に失敗しました' },
      { status: 500 }
    );
  }
} 