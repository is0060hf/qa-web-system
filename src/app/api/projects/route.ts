import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/utils/api';
import { validateRequest } from '@/lib/utils/api';
import { createProjectSchema } from '@/lib/validations/project';
import { Role } from '@prisma/client';
import { withLogging, logAuditEvent, logError } from '@/lib/utils/logger';

// プロジェクト一覧を取得
const _GET = async (req: NextRequest) => {
  try {
    const user = getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // Adminの場合は全てのプロジェクトを取得
    if (user.role === Role.ADMIN) {
      const projects = await prisma.project.findMany({
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              questions: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return NextResponse.json(projects);
    }

    // それ以外のユーザーは自分が参加しているプロジェクトのみ取得
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { creatorId: user.id }, // 作成者として
          { members: { some: { userId: user.id } } }, // メンバーとして
        ],
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    logError(error, { operation: 'GET_PROJECTS', userId: getUserFromRequest(req)?.id });
    return NextResponse.json(
      { error: 'プロジェクト一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
};

export const GET = withLogging(_GET);

// 新規プロジェクト作成
const _POST = async (req: NextRequest) => {
  try {
    const user = getUserFromRequest(req);
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const validation = await validateRequest(req, createProjectSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { name, description } = validation.data;

    // トランザクションを使用してプロジェクト作成とメンバー追加を一緒に行う
    const project = await prisma.$transaction(async (tx) => {
      // プロジェクト作成
      const newProject = await tx.project.create({
        data: {
          name,
          description,
          creatorId: user.id,
        },
      });

      // 作成者をプロジェクト管理者として追加
      await tx.projectMember.create({
        data: {
          projectId: newProject.id,
          userId: user.id,
          role: 'MANAGER', // ProjectRole.MANAGER
        },
      });

      // プロジェクト情報を関連データと一緒に取得して返す
      return await tx.project.findUnique({
        where: { id: newProject.id },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });
    });

    // 監査ログ: プロジェクト作成成功
    if (project) {
      logAuditEvent('CREATE_PROJECT', user.id, 'Project', project.id, {
        projectName: project.name,
        description: project.description,
      });
    }

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    logError(error, { operation: 'CREATE_PROJECT', userId: getUserFromRequest(req)?.id });
    return NextResponse.json(
      { error: 'プロジェクトの作成に失敗しました' },
      { status: 500 }
    );
  }
};

export const POST = withLogging(_POST); 