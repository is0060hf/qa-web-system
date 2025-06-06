# Claude AI統合セットアッププロンプト

## 概要
このドキュメントは、プロジェクトにClaude AIをpre-commitフックとして統合し、コミット時に自動的にコードレビューを実行する設定を行うためのプロンプトです。

## セットアッププロンプト

```
# Claude AI Pre-commitフック統合

プロジェクトにClaude AIを統合して、コミット時に自動的にコードレビューを実行する設定を行ってください。

## 要件
1. **pre-commitフックの実装**
   - Git commitの際にClaude AIが自動的にコードをレビュー
   - TypeScript/JavaScriptファイル（.ts, .tsx, .js, .jsx）の変更を検出
   - 以下の観点でレビュー：
     - バグの有無
     - 既存コンポーネントの再利用（車輪の再発明の防止）
     - コードの可読性
     - ユニットテストの必要性
   - レビューで問題が見つかった場合は指摘事項を表示し、コミットを続行するか確認

2. **シェルエイリアスの設定**
   - コードレビュー、プロジェクト分析、テスト生成などの便利なエイリアスを追加
   - zsh/bash両対応のセットアップスクリプト

3. **VSCode統合**
   - VSCodeタスクでClaude AIを実行できるように設定
   - 現在のファイル、git diff、ステージング変更のレビュータスク

4. **診断ツール**
   - Claude AI設定の問題を自動診断・修正するスクリプト

## 重要な注意事項
- 使用するツールは `@anthropic-ai/claude-code` パッケージです（コマンド名は `claude`）
- `claude-code` というコマンドは存在しません
- Claude CLIは対話型AIアシスタントで、`--print` オプションで非対話モードで実行可能
- pre-commitフックは実行権限（chmod +x）が必要

## 実装手順
1. Claude CLIのインストール：`npm install -g @anthropic-ai/claude-code`
2. pre-commitフック（.git/hooks/pre-commit）の作成と権限設定
3. シェルエイリアスセットアップスクリプト（setup-claude-aliases.sh）の作成
4. VSCodeタスク設定（.vscode/tasks.json）の作成
5. 診断スクリプト（debug-claude-setup.sh）の作成
6. READMEへのドキュメント追加
7. .gitignoreの更新（*.claude-tmp, claude-debug.log）

## プロジェクト情報を含める
pre-commitフックのプロンプトには、プロジェクト固有の情報を含めてください：
- 使用しているフレームワーク（例：Next.js, React, Vue）
- 既存コンポーネントの場所（例：src/components/）
- ユーティリティの場所（例：src/lib/utils/）
- その他のプロジェクト特有の規約

## エラーハンドリング
- claudeコマンドが見つからない場合のインストール手順表示
- レビューが失敗してもコミットを続行できるオプション
- TypeScript/JavaScript以外のファイルはスキップ
```

## 実装例

### 1. Pre-commitフック (.git/hooks/pre-commit)

```bash
#!/bin/bash

# Claude AI pre-commit hook
# このスクリプトはステージングされたファイルをClaude AIでレビューします

# 色付き出力用の定義
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Claude AIレビューを実行しています...${NC}"

# claudeコマンドの存在確認
if ! command -v claude &> /dev/null; then
    echo -e "${RED}エラー: claudeコマンドが見つかりません。${NC}"
    echo -e "${YELLOW}インストール手順:${NC}"
    echo "1. Node.js 18以上がインストールされていることを確認してください"
    echo "2. 以下のコマンドでClaude CLIをインストールしてください:"
    echo "   npm install -g @anthropic-ai/claude-code"
    exit 1
fi

# ステージングされたファイルを取得
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

# ステージングされたファイルがない場合は終了
if [ -z "$STAGED_FILES" ]; then
    echo -e "${GREEN}レビュー対象のファイルがありません。${NC}"
    exit 0
fi

# TypeScript/JavaScriptファイルのみフィルタリング
TS_JS_FILES=$(echo "$STAGED_FILES" | grep -E '\.(ts|tsx|js|jsx)$' || true)

if [ -z "$TS_JS_FILES" ]; then
    echo -e "${GREEN}レビュー対象のTypeScript/JavaScriptファイルがありません。${NC}"
    exit 0
fi

# 変更内容を一時ファイルに保存
DIFF_FILE=$(mktemp /tmp/claude-diff-XXXXXX.diff)
git diff --cached > "$DIFF_FILE"

# レビュー結果を保存する一時ファイル
REVIEW_RESULT=$(mktemp /tmp/claude-review-XXXXXX.txt)

# レビュー対象ファイルを表示
echo -e "${BLUE}レビュー対象ファイル:${NC}"
echo "$TS_JS_FILES" | while read -r file; do
    echo "  - $file"
done

# Claudeにレビューを依頼
echo -e "${BLUE}Claudeにコードレビューを依頼中...${NC}"

# プロンプトを作成（プロジェクト固有の情報を含める）
PROMPT="以下のgit diffを確認して、次の観点でレビューしてください：

1. **バグの有無**: 明らかなバグやエラーがないかチェック
2. **既存コンポーネントの活用**: 既存のコンポーネントやユーティリティが使えるのに再実装していないか
3. **可読性**: コードの可読性が悪くなっていないか、複雑すぎる実装がないか
4. **テストの必要性**: 新しい機能や重要な変更にユニットテストが必要か

問題が見つかった場合は、具体的な改善案を提示してください。
問題がない場合は「問題なし」と回答してください。

プロジェクト情報：
- [プロジェクト固有の技術スタックをここに記載]
- 既存のコンポーネントは src/components/ にあります
- ユーティリティは src/lib/utils/ にあります

git diff:
$(cat "$DIFF_FILE")"

# Claudeを実行（非対話モード）
if claude --print "$PROMPT" > "$REVIEW_RESULT" 2>&1; then
    echo -e "${GREEN}レビューが完了しました。${NC}"
    echo ""
    echo -e "${BLUE}=== レビュー結果 ===${NC}"
    cat "$REVIEW_RESULT"
    echo ""
    
    # レビュー結果に「問題なし」が含まれているかチェック
    if grep -q "問題なし" "$REVIEW_RESULT"; then
        echo -e "${GREEN}✓ レビューで問題は見つかりませんでした。${NC}"
        rm -f "$DIFF_FILE" "$REVIEW_RESULT"
        exit 0
    else
        echo -e "${YELLOW}レビューで指摘事項があります。${NC}"
        echo -e "${YELLOW}コミットを続行しますか？ (y/N)${NC}"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            echo -e "${GREEN}コミットを続行します。${NC}"
            rm -f "$DIFF_FILE" "$REVIEW_RESULT"
            exit 0
        else
            echo -e "${YELLOW}コミットが中止されました。指摘事項を確認して修正してください。${NC}"
            rm -f "$DIFF_FILE" "$REVIEW_RESULT"
            exit 1
        fi
    fi
else
    echo -e "${RED}エラー: Claudeレビューの実行に失敗しました。${NC}"
    echo -e "${YELLOW}エラー内容:${NC}"
    cat "$REVIEW_RESULT"
    rm -f "$DIFF_FILE" "$REVIEW_RESULT"
    
    # レビューが失敗してもコミットは許可する（オプション）
    echo -e "${YELLOW}レビューは失敗しましたが、コミットを続行しますか？ (y/N)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        exit 0
    else
        exit 1
    fi
fi
```

### 2. 便利なエイリアス例

```bash
# Claude対話モード
alias cl="claude"

# ファイルをレビュー
alias crf="claude --print 'このコードをレビューしてください: \$(cat \$1)'"

# git diffをレビュー
alias crd="claude --print '以下の変更をレビューしてください: \$(git diff)'"

# ステージング済みの変更をレビュー
alias crds="claude --print '以下の変更をレビューしてください: \$(git diff --cached)'"

# コンポーネント生成
alias cgc="claude --print 'React/TypeScriptコンポーネントを生成してください: \$1'"

# テスト生成
alias cgt="claude --print 'このコードのJestテストを生成してください: \$(cat \$1)'"
```

### 3. VSCodeタスク例

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Claude: 現在のファイルをレビュー",
      "type": "shell",
      "command": "claude",
      "args": [
        "--print",
        "以下のファイルをレビューしてください：${file}の内容:\n$(cat '${file}')"
      ],
      "group": "build",
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    }
  ]
}
```

## トラブルシューティング

### よくある問題と解決方法

1. **「claudeコマンドが見つかりません」**
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

2. **「pre-commitフックが実行されない」**
   ```bash
   chmod +x .git/hooks/pre-commit
   ```

3. **「APIエラーが発生する」**
   - 環境変数 `ANTHROPIC_API_KEY` が設定されているか確認
   - ネットワーク接続を確認

4. **「レビューをスキップしたい」**
   ```bash
   git commit --no-verify -m "コミットメッセージ"
   ```

## 注意事項

- Claude CLIはAnthropic APIを使用するため、利用料金が発生する可能性があります
- 大きなdiffの場合、トークン制限に注意してください
- センシティブな情報（APIキー、パスワードなど）を含むコードは慎重に扱ってください

## 参考リンク

- [Anthropic Claude Code ドキュメント](https://docs.anthropic.com/en/docs/claude-code/overview)
- [Claude Code ベストプラクティス](https://www.anthropic.com/engineering/claude-code-best-practices)
