import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/utils/api';
import { validateRequest } from '@/lib/utils/api';
import { createQuestionSchema } from '@/lib/validations/question';
import { canAccessProject } from '@/lib/utils/auth';
import { Role } from '@prisma/client';

// プロジェクト内の質問一覧取得
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { projectId } = await params;

    // プロジェクトへのアクセス権をチェック
    const accessCheck = await canAccessProject(projectId, user);
    if (!accessCheck.success) {
      return accessCheck.error;
    }

    // クエリパラメータの取得
    const { searchParams } = req.nextUrl;
    const status = searchParams.get('status');
    const assigneeId = searchParams.get('assigneeId');
    const creatorId = searchParams.get('creatorId');
    const priority = searchParams.get('priority');
    const tag = searchParams.get('tag');
    const overdue = searchParams.get('overdue');
    const search = searchParams.get('search'); // キーワード検索

    // フィルタリング条件の構築
    const where: any = {
      projectId,
    };

    // ステータスでフィルタリング
    if (status) {
      where.status = status;
    }

    // 回答者でフィルタリング
    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    // 質問者でフィルタリング
    if (creatorId) {
      where.creatorId = creatorId;
    }

    // 優先度でフィルタリング
    if (priority) {
      where.priority = priority;
    }

    // タグでフィルタリング
    if (tag) {
      where.tags = {
        some: {
          tag: {
            name: tag,
          },
        },
      };
    }

    // 期限切れでフィルタリング
    if (overdue === 'true') {
      where.deadline = {
        lt: new Date(),
      };
      where.status = {
        not: 'CLOSED',
      };
    }

    // キーワード検索
    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive', // 大文字・小文字を区別しない
          },
        },
        {
          content: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          answers: {
            some: {
              content: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
      ];
    }

    // 通常のユーザーは自分に関連する質問のみ表示（AdminとプロジェクトManager以外）
    const isAdmin = user.role === Role.ADMIN;
    const isProjectManager = accessCheck.project.members.some(
      (m: any) => m.role === 'MANAGER' && m.userId === user.id
    ) || accessCheck.project.creatorId === user.id;

    if (!isAdmin && !isProjectManager) {
      where.OR = [
        { creatorId: user.id }, // 自分が作成した質問
        { assigneeId: user.id }, // 自分に割り当てられた質問
      ];
    }

    // 質問一覧取得
    const questions = await prisma.question.findMany({
      where,
      include: {
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
        _count: {
          select: {
            answers: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' }, // 優先度の高い順
        { updatedAt: 'desc' }, // 最終更新日の新しい順
      ],
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error('質問一覧取得エラー:', error);
    return NextResponse.json(
      { error: '質問一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 質問作成
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  console.log('=== 質問作成API開始 ===');
  
  try {
    const user = getUserFromRequest(req);
    console.log('ユーザー情報:', user ? { id: user.id, email: user.email, role: user.role } : 'なし');

    if (!user) {
      console.log('認証エラー: ユーザーが見つかりません');
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { projectId } = await params;
    console.log('プロジェクトID:', projectId);

    // プロジェクトへのアクセス権をチェック
    console.log('アクセス権チェック開始...');
    const accessCheck = await canAccessProject(projectId, user);
    if (!accessCheck.success) {
      console.log('アクセス権エラー:', accessCheck.error);
      return accessCheck.error;
    }
    console.log('アクセス権チェック完了');

    // リクエストボディを取得してログ出力
    console.log('リクエストボディ取得開始...');
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('リクエストボディ:', JSON.stringify(requestBody, null, 2));
    } catch (bodyError) {
      console.error('リクエストボディ解析エラー:', bodyError);
      return NextResponse.json({ error: 'リクエストボディの解析に失敗しました' }, { status: 400 });
    }

    // リクエストデータのバリデーション
    console.log('バリデーション開始...');
    
    // createQuestionSchemaの内容を確認
    console.log('バリデーションスキーマ確認中...');
    
    try {
      // 手動でバリデーションを実行してみる
      console.log('手動バリデーション実行...');
      const validationResult = createQuestionSchema.safeParse(requestBody);
      
      if (!validationResult.success) {
        console.log('バリデーションエラー詳細:', JSON.stringify(validationResult.error, null, 2));
        console.log('バリデーションエラー issues:', validationResult.error.issues);
        return NextResponse.json({ 
          error: 'バリデーションエラー', 
          details: validationResult.error.issues 
        }, { status: 400 });
      }
      
      console.log('バリデーション成功:', JSON.stringify(validationResult.data, null, 2));
      
      const validatedData = validationResult.data;
      
      const { 
        title, 
        content, 
        assigneeId, 
        deadline, 
        priority, 
        tagIds,
        answerForm,
        answerFormTemplateId,
        saveAsTemplate,
        templateName
      } = validatedData;

      console.log('バリデーション済みデータ抽出完了');

      // 回答者がプロジェクトメンバーであることを確認
      console.log('回答者メンバーシップ確認開始...', assigneeId);
      const assigneeMembership = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: assigneeId,
          },
        },
      });

      if (!assigneeMembership) {
        console.log('回答者メンバーシップエラー: 指定された回答者はプロジェクトメンバーではありません');
        return NextResponse.json(
          { error: '指定された回答者はプロジェクトメンバーではありません' },
          { status: 400 }
        );
      }
      console.log('回答者メンバーシップ確認完了');

      // タグの存在確認
      if (tagIds && tagIds.length > 0) {
        console.log('タグ存在確認開始...', tagIds);
        const existingTags = await prisma.projectTag.findMany({
          where: {
            id: { in: tagIds },
            projectId,
          },
        });

        if (existingTags.length !== tagIds.length) {
          console.log('タグ存在確認エラー: 一部のタグが存在しない');
          return NextResponse.json(
            { error: '一部の指定されたタグが存在しないか、このプロジェクトに属していません' },
            { status: 400 }
          );
        }
        console.log('タグ存在確認完了');
      }

      // テンプレート使用時の検証
      let templateFields = null;
      if (answerFormTemplateId) {
        console.log('テンプレート確認開始...', answerFormTemplateId);
        const template = await prisma.answerFormTemplate.findUnique({
          where: { id: answerFormTemplateId },
        });

        if (!template) {
          console.log('テンプレートエラー: 指定されたテンプレートが存在しません');
          return NextResponse.json(
            { error: '指定されたテンプレートが存在しません' },
            { status: 400 }
          );
        }

        templateFields = template.fieldsJson as any[];
        console.log('テンプレート確認完了', templateFields);
      }

      // トランザクションで質問と回答フォームを作成
      console.log('トランザクション開始...');
      const transactionResult = await prisma.$transaction(async (tx) => {
        console.log('質問作成開始...');
        // 質問作成
        const question = await tx.question.create({
          data: {
            title,
            content,
            projectId,
            creatorId: user.id,
            assigneeId,
            priority: priority || 'MEDIUM',
            deadline: deadline ? new Date(deadline) : null,
            // タグがある場合は接続
            ...(tagIds && tagIds.length > 0
              ? {
                  tags: {
                    create: tagIds.map((tagId) => ({
                      tag: { connect: { id: tagId } },
                    })),
                  },
                }
              : {}),
          },
          include: {
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
        console.log('質問作成完了:', question.id);

        // 回答フォームの作成（テンプレートまたはカスタムフォーム）
        let answerFormData = null;
        const fieldsToCreate = templateFields || answerForm?.fields;

        if (fieldsToCreate && fieldsToCreate.length > 0) {
          console.log('回答フォーム作成開始...', fieldsToCreate.length, 'フィールド');
          const createdAnswerForm = await tx.answerForm.create({
            data: {
              questionId: question.id,
              fields: {
                create: fieldsToCreate.map((field: any, index: number) => ({
                  label: field.label,
                  fieldType: field.fieldType,
                  options: field.options || [],
                  isRequired: field.isRequired || false,
                  order: field.order || index + 1,
                })),
              },
            },
            include: {
              fields: {
                orderBy: { order: 'asc' },
              },
            },
          });
          answerFormData = createdAnswerForm;
          console.log('回答フォーム作成完了:', createdAnswerForm.id);
        }

        // テンプレートとして保存
        if (saveAsTemplate && templateName && answerForm?.fields) {
          console.log('テンプレート保存開始...', templateName);
          await tx.answerFormTemplate.create({
            data: {
              name: templateName,
              description: `質問「${title}」から作成されたテンプレート`,
              creatorId: user.id,
              fieldsJson: answerForm.fields,
            },
          });
          console.log('テンプレート保存完了');
        }

        return { question, answerForm: answerFormData };
      });
      console.log('トランザクション完了');

      // 通知作成（回答者へ新規質問の通知）
      console.log('通知作成開始...');
      await prisma.notification.create({
        data: {
          userId: assigneeId,
          type: 'NEW_QUESTION_ASSIGNED',
          message: `新しい質問「${title}」があなたに割り当てられました`,
          relatedId: transactionResult.question.id,
        },
      });
      console.log('通知作成完了');

      console.log('=== 質問作成API成功 ===');
      return NextResponse.json(
        {
          ...transactionResult.question,
          answerForm: transactionResult.answerForm,
        },
        { status: 201 }
      );
      
    } catch (validationError) {
      console.error('手動バリデーションエラー:', validationError);
      return NextResponse.json({ 
        error: 'バリデーション処理でエラーが発生しました',
        details: validationError
      }, { status: 400 });
    }

  } catch (error) {
    console.error('=== 質問作成API エラー ===');
    console.error('エラー詳細:', error);
    console.error('エラースタック:', error instanceof Error ? error.stack : 'スタック情報なし');
    return NextResponse.json(
      { 
        error: '質問の作成に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 