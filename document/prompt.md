現在6つの仕様書と1つのデータベーススキーマの定義書が存在しております。詳細は下記のとおりです。
この文書をもとに、

して欲しいです。


質問管理Webシステム 仕様書 (specification.md)
目的: このドキュメントは、開発するWebシステム全体の概要、目的、機能要件、非機能要件を定義するものです。プロジェクトの全体像を把握し、開発の方向性を定めるための基盤となります。
内容: システムが提供する機能（ユーザー認証、プロジェクト管理、質問管理、回答管理、通知、検索など）の詳細な仕様、使用する技術スタック、性能やセキュリティに関する要件、UI/UXの指針、テスト方針などが記述されています。また、システム内で使用される主要な用語の定義も含まれます。
役割: 開発者、プロジェクトマネージャー、そして将来の運用担当者や利用者が、システムの全体像と詳細な仕様を理解するための共通言語として機能します。開発のスコープを明確にし、手戻りを防ぐための重要なドキュメントです。

データベーススキーマ (schema.prisma)
目的: システムで扱うデータの構造を定義するファイルです。Prisma ORMを使用して、データベース（Neon PostgreSQL）のテーブル、カラム、データ型、リレーションシップ（テーブル間の関連）をコードとして表現します。
内容: ユーザー、プロジェクト、質問、回答、タグ、通知、招待など、システムに必要な各データモデル（テーブルに相当）が定義されています。各モデルには、ID、名称、日付、関連する他のモデルへの参照などが含まれ、データ間の整合性を保つための制約（ユニーク制約など）も記述されています。
役割: バックエンド開発において、データベース操作の基盤となります。Prismaはこのスキーマ定義をもとに、型安全なデータベースクライアントを自動生成し、開発効率とコードの信頼性を高めます。データベースの構造を明確にすることで、開発者間の認識齟齬を防ぎます。

APIエンドポイント設計 (api_design.md)
目的: フロントエンド（Next.js）とバックエンド（Next.js API Routes + Prisma）間の通信インターフェースを定義するドキュメントです。どのような操作（データの取得、作成、更新、削除）が可能で、そのためにどのようなURLパスとHTTPメソッドを使用するかを定めます。
内容: 認証、ユーザー管理、プロジェクト管理、質問管理、回答管理、招待、通知など、機能ごとに必要なAPIエンドポイントがリストアップされています。各エンドポイントについて、HTTPメソッド（GET, POST, PATCH, DELETE）、パス、必要な認証・認可レベル、リクエストの形式（パラメータ、ボディ）、成功時・エラー時のレスポンス形式などが詳細に記述されています。
役割: フロントエンド開発者とバックエンド開発者の間の契約書（インターフェース仕様）として機能します。これにより、両者は並行して開発を進めることが可能になります。また、APIのテストケースを作成する際の基礎情報ともなります。

UIワイヤーフレーム設計 (ui_wireframes.md)
目的: システムの各画面のレイアウト、主要なUIコンポーネントの配置、画面遷移の流れを視覚的に示す設計図です。ユーザーがどのようにシステムを操作するか、基本的な骨格を定義します。
内容: ログイン画面、ダッシュボード、プロジェクト詳細、質問詳細、質問作成/編集、通知一覧など、主要な画面ごとに、ヘッダー、サイドナビゲーション、メインコンテンツエリアの構成要素が記述されています。Material UIのどのコンポーネント（DataGrid, TextField, Buttonなど）を使用するかの指針も含まれています。レスポンシブデザイン（PC/モバイル対応）の考慮事項も記載されています。
役割: UIデザイナーやフロントエンド開発者が、具体的な画面デザインや実装を進める上でのブループリント（青写真）となります。ユーザー体験（UX）の初期段階での検討材料となり、開発者と関係者間での画面イメージの共有を助けます。

認証システム設計 (authentication_design.md)
目的: ユーザーの本人確認（認証）と、認証されたユーザーがどの操作を行えるか（認可）の仕組みを詳細に設計するドキュメントです。
内容: ユーザー登録、ログイン、ログアウト、パスワードリセットといった認証フローがステップごとに記述されています。JWT（JSON Web Token）を用いた認証方式の採用、ロール（Admin, User, Project Manager, Member）に基づいたアクセス制御の具体的な実装方法（APIレベル、UIレベル）、パスワードハッシングやJWTのセキュリティ対策などが定義されています。
役割: セキュアなシステムを構築するための重要な設計書です。認証・認可ロジックの実装を担当する開発者が参照し、セキュリティ要件を満たす実装を行うための指針となります。

通知システム設計 (notification_system_design.md)
目的: システム内で発生するイベントをユーザーに知らせる通知機能の仕組みを設計するドキュメントです。
内容: 通知が発生する具体的なタイミング（例: 新規質問割り当て、回答期限超過）、通知データの構造（Notificationモデル）、通知を生成するバックエンドのプロセス、通知を取得・表示・既読管理するためのAPIエンドポイント、フロントエンドでの通知アイコン・ドロップダウン・一覧画面の実装方法、リアルタイム更新の考慮事項などが定義されています。
役割: ユーザーに必要な情報を適切なタイミングで届け、タスクの見逃しを防ぐための機能を実現するための設計書です。バックエンド開発者（通知生成ロジック）とフロントエンド開発者（通知表示UI）が連携して実装を進める際の指針となります。

インフラストラクチャ設計書 (infrastructure.md)
目的: システムのインフラストラクチャ、技術構成、デプロイメント戦略、セキュリティ対策などを詳細に定義するドキュメントです。
内容: 全体アーキテクチャ、使用技術（Next.js, Prisma, Neon PostgreSQL等）、環境構成（本番/開発/テスト）、データベース設計、デプロイメント戦略、セキュリティ対策、監視・ロギング、バックアップ・リカバリ計画、スケーラビリティ設計、コスト最適化、実装計画・スケジュールなどが詳細に記述されています。
役割: 開発チームがシステムの技術基盤を理解し、安定したインフラストラクチャ上でアプリケーションを構築・運用するための指針となります。また、運用担当者が本番環境の管理やトラブルシューティングを行う際の参考資料としても機能します。