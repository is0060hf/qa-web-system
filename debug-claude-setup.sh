#!/bin/bash

# Claude AI設定の診断・修正スクリプト

# 色付き出力用の定義
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ログファイル
LOG_FILE="claude-debug.log"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# ログ関数
log() {
    echo "$TIMESTAMP - $1" >> "$LOG_FILE"
}

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Claude AI 診断ツール${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

log "診断開始"

# 診断結果を格納する配列
declare -a ERRORS
declare -a WARNINGS
declare -a FIXED

# 1. claudeコマンドの存在確認
echo -e "${BLUE}[1/5] claudeコマンドをチェック中...${NC}"
if ! command -v claude &> /dev/null; then
    ERRORS+=("claudeコマンドが見つかりません")
    echo -e "${RED}✗ claudeコマンドが見つかりません${NC}"
    echo -e "${YELLOW}  修正方法:${NC}"
    echo "    npm install -g @anthropic-ai/claude-code"
    
    # 自動修正の提案
    echo -e "${YELLOW}  自動インストールを実行しますか？ (y/N)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        if command -v npm &> /dev/null; then
            echo "インストール中..."
            if npm install -g @anthropic-ai/claude-code; then
                FIXED+=("claudeをインストールしました")
                echo -e "${GREEN}✓ インストール完了${NC}"
            else
                echo -e "${RED}インストールに失敗しました${NC}"
            fi
        else
            echo -e "${RED}npmが見つかりません。Node.jsをインストールしてください${NC}"
        fi
    fi
else
    CLAUDE_PATH=$(which claude)
    echo -e "${GREEN}✓ claudeが見つかりました: $CLAUDE_PATH${NC}"
    log "claude found at: $CLAUDE_PATH"
fi

# 2. Node.jsバージョンの確認
echo -e "\n${BLUE}[2/5] Node.jsバージョンをチェック中...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d'.' -f1 | cut -d'v' -f2)
    
    if [ "$NODE_MAJOR" -lt 18 ]; then
        ERRORS+=("Node.js 18以上が必要です (現在: $NODE_VERSION)")
        echo -e "${RED}✗ Node.js 18以上が必要です (現在: $NODE_VERSION)${NC}"
        echo -e "${YELLOW}  修正方法:${NC}"
        echo "    1. Node.js公式サイトから最新版をダウンロード"
        echo "    2. または nvm を使用: nvm install 18"
    else
        echo -e "${GREEN}✓ Node.js $NODE_VERSION${NC}"
    fi
else
    ERRORS+=("Node.jsがインストールされていません")
    echo -e "${RED}✗ Node.jsがインストールされていません${NC}"
fi

# 3. Git hooksの権限確認
echo -e "\n${BLUE}[3/5] Git hooksをチェック中...${NC}"
if [ -f ".git/hooks/pre-commit" ]; then
    if [ -x ".git/hooks/pre-commit" ]; then
        echo -e "${GREEN}✓ pre-commitフックが設定済み${NC}"
        
        # pre-commitフックがclaudeコマンドを使用しているか確認
        if grep -q "claude" ".git/hooks/pre-commit"; then
            echo -e "${GREEN}✓ pre-commitフックでclaudeコマンドが使用されています${NC}"
        else
            WARNINGS+=("pre-commitフックでclaudeコマンドが使用されていません")
            echo -e "${YELLOW}! pre-commitフックでclaudeコマンドが使用されていません${NC}"
        fi
    else
        WARNINGS+=("pre-commitフックに実行権限がありません")
        echo -e "${YELLOW}! pre-commitフックに実行権限がありません${NC}"
        echo -e "${YELLOW}  自動修正しますか？ (y/N)${NC}"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            chmod +x .git/hooks/pre-commit
            FIXED+=("pre-commitフックの権限を修正しました")
            echo -e "${GREEN}✓ 権限を修正しました${NC}"
        fi
    fi
else
    WARNINGS+=("pre-commitフックが設定されていません")
    echo -e "${YELLOW}! pre-commitフックが設定されていません${NC}"
fi

# 4. 環境変数の確認
echo -e "\n${BLUE}[4/5] 環境変数をチェック中...${NC}"
if [ -n "$ANTHROPIC_API_KEY" ]; then
    echo -e "${GREEN}✓ ANTHROPIC_API_KEY が設定されています${NC}"
else
    WARNINGS+=("ANTHROPIC_API_KEY が設定されていません")
    echo -e "${YELLOW}! ANTHROPIC_API_KEY が設定されていません${NC}"
    echo -e "${YELLOW}  Claudeを使用するにはAPIキーが必要な場合があります${NC}"
fi

# 5. プロジェクト設定の確認
echo -e "\n${BLUE}[5/5] プロジェクト設定をチェック中...${NC}"

# package.jsonの存在確認
if [ -f "package.json" ]; then
    echo -e "${GREEN}✓ package.json が存在します${NC}"
    
    # TypeScriptプロジェクトか確認
    if grep -q "typescript" package.json; then
        echo -e "${GREEN}✓ TypeScriptプロジェクトです${NC}"
    fi
    
    # Next.jsプロジェクトか確認
    if grep -q "next" package.json; then
        echo -e "${GREEN}✓ Next.jsプロジェクトです${NC}"
    fi
else
    WARNINGS+=("package.json が見つかりません")
    echo -e "${YELLOW}! package.json が見つかりません${NC}"
fi

# 診断結果のサマリー
echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  診断結果サマリー${NC}"
echo -e "${CYAN}========================================${NC}"

# エラーの表示
if [ ${#ERRORS[@]} -gt 0 ]; then
    echo -e "\n${RED}エラー (${#ERRORS[@]}件):${NC}"
    for error in "${ERRORS[@]}"; do
        echo -e "${RED}  ✗ $error${NC}"
        log "ERROR: $error"
    done
fi

# 警告の表示
if [ ${#WARNINGS[@]} -gt 0 ]; then
    echo -e "\n${YELLOW}警告 (${#WARNINGS[@]}件):${NC}"
    for warning in "${WARNINGS[@]}"; do
        echo -e "${YELLOW}  ! $warning${NC}"
        log "WARNING: $warning"
    done
fi

# 修正項目の表示
if [ ${#FIXED[@]} -gt 0 ]; then
    echo -e "\n${GREEN}自動修正済み (${#FIXED[@]}件):${NC}"
    for fix in "${FIXED[@]}"; do
        echo -e "${GREEN}  ✓ $fix${NC}"
        log "FIXED: $fix"
    done
fi

# 最終ステータス
echo ""
if [ ${#ERRORS[@]} -eq 0 ]; then
    if [ ${#WARNINGS[@]} -eq 0 ]; then
        echo -e "${GREEN}✓ すべてのチェックに合格しました！${NC}"
        EXIT_CODE=0
    else
        echo -e "${YELLOW}⚠ 警告がありますが、基本的な設定は完了しています${NC}"
        EXIT_CODE=0
    fi
else
    echo -e "${RED}✗ エラーを修正してください${NC}"
    EXIT_CODE=1
fi

# 追加の推奨事項
echo ""
echo -e "${BLUE}推奨される次のステップ:${NC}"
if [ ${#ERRORS[@]} -gt 0 ]; then
    echo "1. 上記のエラーを修正してください"
fi
if ! command -v claude &> /dev/null; then
    echo "2. claudeをインストール: npm install -g @anthropic-ai/claude-code"
fi
if [ ! -f ".git/hooks/pre-commit" ]; then
    echo "3. pre-commitフックが未設定です"
fi

# Claudeの使用方法を表示
if command -v claude &> /dev/null; then
    echo ""
    echo -e "${BLUE}Claudeの使用方法:${NC}"
    echo "  claude              # 対話モードでClaude AIを起動"
    echo "  claude --print \"質問\"  # 非対話モードで質問して結果を出力"
    echo ""
    echo "エイリアスをセットアップするには:"
    echo "  ./setup-claude-aliases.sh"
fi

echo ""
echo -e "詳細なログは ${CYAN}$LOG_FILE${NC} に保存されました"

log "診断完了 - エラー: ${#ERRORS[@]}, 警告: ${#WARNINGS[@]}, 修正: ${#FIXED[@]}"

exit $EXIT_CODE 