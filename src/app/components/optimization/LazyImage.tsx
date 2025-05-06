'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Box, Skeleton } from '@mui/material';

interface LazyImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  quality?: number;
  className?: string;
  style?: React.CSSProperties;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

/**
 * 画像の遅延読み込みコンポーネント
 * - インターセクションオブザーバーを使用して画面に表示される時に画像を読み込む
 * - 読み込み中はスケルトンを表示
 * - Next.jsのImageコンポーネントを内部で使用して最適化
 */
export default function LazyImage({
  src,
  alt,
  width,
  height,
  priority = false,
  quality = 75,
  className,
  style,
  objectFit = 'cover',
}: LazyImageProps) {
  const [isLoading, setIsLoading] = useState(!priority);
  const [isVisible, setIsVisible] = useState(priority);
  const [imgRef, setImgRef] = useState<HTMLDivElement | null>(null);

  // 画像読み込み完了時の処理
  const handleLoad = () => {
    setIsLoading(false);
  };

  // インターセクションオブザーバーによる表示判定
  useEffect(() => {
    if (!imgRef || priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px', // 画面の200px手前で読み込みを開始
        threshold: 0.01,
      }
    );

    observer.observe(imgRef);

    return () => {
      observer.disconnect();
    };
  }, [imgRef, priority]);

  // スタイル設定
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    ...style,
  };

  return (
    <Box
      ref={setImgRef}
      className={className}
      sx={{
        position: 'relative',
        width,
        height,
        ...style,
      }}
    >
      {/* 読み込み中のスケルトン表示 */}
      {isLoading && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          animation="wave"
        />
      )}

      {/* 可視範囲に入った場合または優先度が高い場合に画像を表示 */}
      {isVisible && (
        <Image
          src={src}
          alt={alt}
          fill={true}
          style={{ objectFit }}
          quality={quality}
          priority={priority}
          onLoad={handleLoad}
          sizes={`(max-width: 768px) 100vw, ${width}px`}
          className={isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}
        />
      )}
    </Box>
  );
} 