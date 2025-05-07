import { useMediaQuery, useTheme } from '@mui/material';

/**
 * 現在の画面サイズに基づいたブレークポイントを取得するフック
 * @returns モバイル、タブレット、デスクトップなどのブレークポイント情報
 */
export function useBreakpoints() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  return {
    isMobile,
    isTablet,
    isDesktop,
  };
}

/**
 * 現在の画面サイズに基づいて値を返すユーティリティ関数
 * @param options 画面サイズごとの値のオブジェクト
 * @returns 現在の画面サイズに対応する値
 */
export function responsive<T>(options: {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  default: T;
}) {
  const theme = useTheme();
  const keys = Object.keys(options).filter(key => key !== 'default') as Array<
    'xs' | 'sm' | 'md' | 'lg' | 'xl'
  >;

  // ブレークポイントの大きい順にチェック
  for (const key of ['xl', 'lg', 'md', 'sm', 'xs'] as const) {
    if (
      options[key] !== undefined &&
      useMediaQuery(theme.breakpoints.up(key))
    ) {
      return options[key] as T;
    }
  }

  return options.default;
} 