#!/bin/bash

# Claude AIエイリアスとヘルパー関数のセットアップスクリプト
# zsh/bash両対応

# 色付き出力用の定義
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 現在のシェルを検出
CURRENT_SHELL=$(basename "$SHELL")
RC_FILE=""

# シェルに応じたRC設定ファイルを特定
if [ "$CURRENT_SHELL" = "zsh" ]; then
    RC_FILE="$HOME/.zshrc"
elif [ "$CURRENT_SHELL" = "bash" ]; then
    if [ -f "$HOME/.bashrc" ]; then
        RC_FILE="$HOME/.bashrc"
    else
        RC_FILE="$HOME/.bash_profile"
    fi
else
    echo -e "${RED}エラー: サポートされていないシェル: $CURRENT_SHELL${NC}"
    echo "bashまたはzshを使用してください。"
    exit 1
fi

echo -e "${BLUE}Claude AIエイリアスをセットアップします${NC}"
echo -e "対象ファイル: ${GREEN}$RC_FILE${NC}"

# バックアップの作成
BACKUP_FILE="${RC_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
echo -e "${BLUE}バックアップを作成中: $BACKUP_FILE${NC}"
cp "$RC_FILE" "$BACKUP_FILE"

# Claude AIエイリアスの定義
CLAUDE_ALIASES='
# ===== Claude AI Aliases and Functions =====
# Added by setup-claude-aliases.sh

# Claude AIコマンドの存在確認
if command -v claude &> /dev/null; then
    # 基本エイリアス
    alias cl="claude"                                      # 基本のClaude対話
    alias clp="claude --print"                            # 非対話モード（結果を出力して終了）
    
    # コードレビュー関数
    claude-review-file() {
        if [ -z "$1" ]; then
            echo "使用方法: claude-review-file <ファイル名>"
            return 1
        fi
        
        if [ ! -f "$1" ]; then
            echo "エラー: ファイルが見つかりません: $1"
            return 1
        fi
        
        echo "ファイルをレビュー中: $1"
        claude --print "以下のコードをレビューしてください。バグ、改善点、可読性の問題を指摘してください：\n\n$(cat "$1")"
    }
    alias crf="claude-review-file"
    
    # git diffのレビュー関数
    claude-review-diff() {
        local DIFF=""
        
        if [ "$1" = "--staged" ] || [ "$1" = "-s" ]; then
            DIFF=$(git diff --cached)
        else
            DIFF=$(git diff)
        fi
        
        if [ -z "$DIFF" ]; then
            echo "レビューする変更がありません"
            return 1
        fi
        
        echo "変更をレビュー中..."
        claude --print "以下のgit diffをレビューしてください。バグ、既存コンポーネントの再実装、可読性の問題、テスト不足を指摘してください：\n\n$DIFF"
    }
    alias crd="claude-review-diff"
    alias crds="claude-review-diff --staged"
    
    # プロジェクト構造の分析関数
    claude-analyze-project() {
        echo "プロジェクト構造を分析中..."
        local PROJECT_INFO=$(find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | head -20)
        local PACKAGE_JSON=""
        
        if [ -f "package.json" ]; then
            PACKAGE_JSON=$(cat package.json)
        fi
        
        claude --print "以下のプロジェクト構造とpackage.jsonを分析して、アーキテクチャの改善点を提案してください：\n\nファイル構造：\n$PROJECT_INFO\n\npackage.json：\n$PACKAGE_JSON"
    }
    alias cap="claude-analyze-project"
    
    # バグ修正支援関数
    claude-fix-error() {
        if [ -z "$1" ]; then
            echo "使用方法: claude-fix-error \"エラーメッセージ\""
            return 1
        fi
        
        claude --print "以下のエラーを修正する方法を教えてください：\n\n$1"
    }
    alias cfe="claude-fix-error"
    
    # コンポーネント生成関数
    claude-generate-component() {
        if [ -z "$1" ]; then
            echo "使用方法: claude-generate-component \"コンポーネントの説明\""
            return 1
        fi
        
        claude --print "Next.js 15 (App Router)、TypeScript、Material-UIを使用して、以下の要件のReactコンポーネントを生成してください：\n\n$1"
    }
    alias cgc="claude-generate-component"
    
    # テスト生成関数
    claude-generate-test() {
        if [ -z "$1" ]; then
            echo "使用方法: claude-generate-test <ファイル名>"
            return 1
        fi
        
        if [ ! -f "$1" ]; then
            echo "エラー: ファイルが見つかりません: $1"
            return 1
        fi
        
        echo "テストを生成中: $1"
        claude --print "以下のコードに対するJestテストを生成してください：\n\n$(cat "$1")"
    }
    alias cgt="claude-generate-test"
    
else
    echo "警告: claudeコマンドが見つかりません"
    echo "インストール方法: npm install -g @anthropic-ai/claude-code"
fi

# ===== End of Claude AI Aliases =====
'

# 既存のClaude関連エイリアスをチェック
if grep -q "Claude.*Aliases" "$RC_FILE"; then
    echo -e "${YELLOW}警告: Claude関連のエイリアスは既に設定されています${NC}"
    echo "既存の設定を更新しますか？ (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        # 既存のセクションを削除
        sed -i.tmp '/# ===== Claude.*Aliases/,/# ===== End of Claude.*Aliases/d' "$RC_FILE"
        rm -f "${RC_FILE}.tmp"
    else
        echo "セットアップを中止しました"
        exit 0
    fi
fi

# エイリアスの競合チェック
check_alias_conflict() {
    local alias_name=$1
    if alias "$alias_name" &>/dev/null 2>&1; then
        echo -e "${YELLOW}警告: エイリアス '$alias_name' は既に存在します${NC}"
        return 1
    fi
    return 0
}

# 主要なエイリアスの競合をチェック
ALIASES_TO_CHECK=("cl" "clp" "crf" "crd" "crds" "cap" "cfe" "cgc" "cgt")
CONFLICTS=0

for alias_name in "${ALIASES_TO_CHECK[@]}"; do
    if ! check_alias_conflict "$alias_name"; then
        CONFLICTS=$((CONFLICTS + 1))
    fi
done

if [ $CONFLICTS -gt 0 ]; then
    echo -e "${YELLOW}$CONFLICTS 個のエイリアスが競合しています${NC}"
    echo "続行しますか？ (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "セットアップを中止しました"
        exit 0
    fi
fi

# エイリアスを追加
echo -e "${BLUE}エイリアスを追加中...${NC}"
echo "$CLAUDE_ALIASES" >> "$RC_FILE"

# アンインストール関数を作成
cat > uninstall-claude-aliases.sh << 'EOF'
#!/bin/bash

# Claude AIエイリアスのアンインストールスクリプト

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# 現在のシェルを検出
CURRENT_SHELL=$(basename "$SHELL")
RC_FILE=""

if [ "$CURRENT_SHELL" = "zsh" ]; then
    RC_FILE="$HOME/.zshrc"
elif [ "$CURRENT_SHELL" = "bash" ]; then
    if [ -f "$HOME/.bashrc" ]; then
        RC_FILE="$HOME/.bashrc"
    else
        RC_FILE="$HOME/.bash_profile"
    fi
fi

echo -e "${BLUE}Claude AIエイリアスを削除します${NC}"

if grep -q "Claude.*Aliases" "$RC_FILE"; then
    # バックアップを作成
    cp "$RC_FILE" "${RC_FILE}.backup.before_uninstall"
    
    # Claudeセクションを削除
    sed -i.tmp '/# ===== Claude.*Aliases/,/# ===== End of Claude.*Aliases/d' "$RC_FILE"
    rm -f "${RC_FILE}.tmp"
    
    echo -e "${GREEN}Claude AIエイリアスが削除されました${NC}"
    echo "変更を反映するには、以下のコマンドを実行してください:"
    echo "  source $RC_FILE"
else
    echo -e "${RED}Claude AIエイリアスが見つかりません${NC}"
fi
EOF

chmod +x uninstall-claude-aliases.sh

echo -e "${GREEN}セットアップが完了しました！${NC}"
echo ""
echo "使用可能なエイリアス:"
echo "  cl   - Claude対話モード"
echo "  clp  - Claude非対話モード（--print）"
echo "  crf  - ファイルをレビュー"
echo "  crd  - git diffをレビュー"
echo "  crds - ステージング済みの変更をレビュー"
echo "  cap  - プロジェクト構造を分析"
echo "  cfe  - エラー修正支援"
echo "  cgc  - コンポーネント生成"
echo "  cgt  - テスト生成"
echo ""
echo "変更を反映するには、以下のコマンドを実行してください:"
echo -e "  ${GREEN}source $RC_FILE${NC}"
echo ""
echo "アンインストールする場合:"
echo -e "  ${GREEN}./uninstall-claude-aliases.sh${NC}" 