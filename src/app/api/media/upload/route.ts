import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/utils/api';
import { verifyToken } from '@/lib/auth/jwt';
import prisma from '@/lib/db';

export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log('Upload API called');
  console.log('Request headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    // リクエストボディを一度だけ読み取る
    const body = (await request.json()) as HandleUploadBody;
    console.log('Request body type:', body.type);
    
    // まずミドルウェアから設定されたユーザー情報を取得
    let user = getUserFromRequest(request);
    console.log('User from middleware:', user);
    
    // ユーザー情報が取得できない場合、リクエストボディを確認
    if (!user && body.type === 'blob.generate-client-token') {
      console.log('Attempting to verify token from clientPayload');
      try {
        const bodyWithPayload = body as any;
        console.log('bodyWithPayload:', JSON.stringify(bodyWithPayload, null, 2));
        
        // clientPayloadはbody.payload.clientPayloadにある
        const payloadData = bodyWithPayload.payload?.clientPayload || bodyWithPayload.clientPayload;
        
        if (payloadData) {
          console.log('clientPayload found:', payloadData);
          const clientPayload = JSON.parse(payloadData);
          console.log('Parsed clientPayload:', clientPayload);
          
          if (clientPayload.token) {
            console.log('Token found in clientPayload, verifying...');
            const payload = await verifyToken(clientPayload.token);
            console.log('Token verification result:', payload);
            
            if (payload) {
              // トークンが有効な場合、ユーザー情報を設定
              user = {
                id: payload.userId,
                email: payload.email,
                role: payload.role as any,
              };
              console.log('User authenticated from clientPayload:', user);
            } else {
              console.log('Token verification failed - invalid token');
            }
          } else {
            console.log('No token found in clientPayload');
          }
        } else {
          console.log('No clientPayload in body or body.payload');
        }
      } catch (error) {
        console.error('Token verification error:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      }
    }
    
    console.log('Final user state:', user);
    
    if (!user) {
      console.log('Returning 401 - no authenticated user');
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // ユーザー情報をクロージャで保持
    const currentUser = user;
    
    // トークンの存在確認
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken) {
      console.error('BLOB_READ_WRITE_TOKEN is not set in environment variables');
      return NextResponse.json(
        { error: 'Blob storage configuration error' },
        { status: 500 }
      );
    }
    
    console.log('BLOB_READ_WRITE_TOKEN exists:', !!blobToken);
    console.log('Token prefix:', blobToken.substring(0, 20) + '...');
    
    // handleUploadにオリジナルのリクエストを渡す
    const jsonResponse = await handleUpload({
      body,
      request,
      token: blobToken,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // トークン生成前の検証
        console.log('onBeforeGenerateToken called with pathname:', pathname);
        console.log('User authenticated:', currentUser.email);
        
        return {
          // ファイルタイプ制限
          allowedContentTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'text/plain',
            'text/csv',
            'application/octet-stream'
          ],
          // ランダムサフィックスを追加
          addRandomSuffix: true,
          // 最大ファイルサイズ: 100MB
          maximumSizeInBytes: 100 * 1024 * 1024,
          // アップロード完了時に受け取るペイロード
          tokenPayload: JSON.stringify({
            userId: currentUser.id,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // アップロード完了時の処理
        console.log('Blob upload completed:', blob);
        
        try {
          const { userId } = JSON.parse(tokenPayload || '{}');
          console.log(`User ${userId} uploaded file: ${blob.pathname}`);
        } catch (error) {
          console.error('Error in onUploadCompleted:', error);
        }
      },
    });

    console.log('handleUpload response:', jsonResponse);
    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Upload handler error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'アップロード処理に失敗しました' },
      { status: 400 }
    );
  }
} 