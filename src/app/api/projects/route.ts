import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/utils/api';
import { validateRequest } from '@/lib/utils/api';
import { createProjectSchema } from '@/lib/validations/project';
import { Role } from '@prisma/client';

// プロジェクト一覧を取得
export async function GET(req: NextRequest) {
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
    console.error('プロジェクト一覧取得エラー:', error);
    return NextResponse.json(
      { error: 'プロジェクト一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 新規プロジェクト作成
export async function POST(req: NextRequest) {
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

    // プロジェクト作成
    const project = await prisma.project.create({
      data: {
        name,
        description,
        creatorId: user.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('プロジェクト作成エラー:', error);
    return NextResponse.json(
      { error: 'プロジェクトの作成に失敗しました' },
      { status: 500 }
    );
  }
} 