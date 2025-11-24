
# CLAUDE.md

このファイルはClaudeに関する情報を記載するためのものです。

- 作成日: 2025-11-23
- 更新日: 2025-11-24
- 作成者: amano216

## 概要
このプロジェクトの開発においてClaudeが従うべき設計方針と実装ルールを記載しています。

## プロジェクト概要
訪問看護スケジュール管理アプリ（ZEST参考）

### 開発フェーズ
- **MVP開発**: 完了 ✅
- **リファクタリングフェーズ**: 進行中 🚧

### MVP完了機能
- スタッフ管理
- 患者/利用者管理
- 訪問予定管理
- スケジュール表示・作成（ガントチャート形式）
- 認証機能（ログイン/ログアウト）

### リファクタリングスコープ
- アトミックデザイン導入によるコンポーネント再設計
- Tailwind CSSによるUI刷新（SmartHR風）
- レスポンシブ対応（モバイルファースト）
- UX改善（タッチフレンドリー、情報密度最適化）

### 将来的なスコープ（未実装）
- ルート最適化（移動時間の自動計算）
- レセプト・請求機能
- 多職種連携機能

## 設計方針

### バックエンド設計
MITの「Concepts & Synchronizations」パターンに従ってコードを設計してください。

#### 概念(Concepts)の定義
以下の機能を独立した概念として実装してください:

- **Auth**: 認証機能（ログイン/ログアウト、セッション管理）
- **Staff**: 訪問スタッフ管理（名前、資格、勤務可能時間）
- **Patient**: 患者/利用者管理（名前、住所、必要なケア内容）
- **Visit**: 訪問予定管理（日時、担当者、患者、ステータス）
- **Schedule**: 日/週単位のスケジュール表示・作成

各概念は:
- 他の概念に直接依存しない自己完結型
- 独自の状態とアクションを持つ
- 単一責任の原則に従う

#### 同期(Synchronizations)の定義
概念間の相互作用を以下のルールで記述してください:

```
WHEN User がログインしたとき
WHERE 認証情報が正しい
THEN Session を作成する

WHEN Visit が作成されたとき
WHERE Staff の該当時間が空いている
THEN Staff のスケジュールに Visit を追加する

WHEN Visit がキャンセルされたとき
THEN Staff のスケジュールから Visit を削除する

WHEN Staff が削除されたとき
THEN 該当 Staff の未完了 Visit を未割当状態にする

WHEN Patient が削除されたとき
THEN 該当 Patient の未完了 Visit をキャンセルする
```

### フロントエンド設計
**アトミックデザイン（Atomic Design）** に基づいてコンポーネントを設計してください。

#### コンポーネント階層
- **Atoms**: Button, Input, Label, Badge, Icon, Spinner
- **Molecules**: FormField, Card, Modal, Dropdown, DatePicker, Toast
- **Organisms**: Header, Sidebar, DataTable, Calendar, GanttChart
- **Templates**: DashboardLayout, FormLayout, ListLayout
- **Pages**: 各画面コンポーネント

#### UI/UXガイドライン
- **SmartHR風**: 清潔感、余白を活かした読みやすさ
- **業務アプリ**: 情報の視認性、操作効率
- **レスポンシブ**: 訪問看護師が移動中にスマホで操作することを想定
- **タッチフレンドリー**: ボタンは指で押しやすいサイズ（44px以上）
- **情報密度**: Google Calendarを参考にバランスを取る

## 技術スタック

### フロントエンド
- React
- TypeScript
- Vite
- Tailwind CSS
- @dnd-kit/core（ドラッグ&ドロップ）

### バックエンド
- Ruby on Rails
- PostgreSQL

### インフラ
- Google Cloud Platform (GCP)
- Cloud Run
- Cloud SQL

## 実装要件
- SOLID原則に従う
- マイクロサービスアーキテクチャの設計思想に従う
- RESTful API設計
- 認証にはJWT認証を使用
- TypeScriptの型安全性を維持
