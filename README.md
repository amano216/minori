# Minori - 訪問看護スケジュール管理アプリ

訪問看護事業所向けのスケジュール管理アプリケーションです。

## 技術スタック

- **Frontend**: React + Vite + TypeScript
- **Backend**: Ruby on Rails (API mode)
- **Database**: PostgreSQL
- **Infrastructure**: Google Cloud Platform (GCP)

## 開発環境のセットアップ

### 必要条件

- Docker & Docker Compose
- Node.js 22+
- Ruby 3.4+

### Docker を使用した起動

```bash
# コンテナをビルドして起動
docker-compose up --build

# バックグラウンドで起動
docker-compose up -d
```

起動後:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Health Check: http://localhost:3000/api/health

### ローカルで起動（Docker なし）

#### Backend

```bash
cd backend

# 依存関係のインストール
bundle install

# データベースのセットアップ
rails db:create db:migrate

# サーバー起動
rails server
```

#### Frontend

```bash
cd frontend

# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev
```

## プロジェクト構成

```
minori/
├── backend/          # Rails API
│   ├── app/
│   │   ├── controllers/
│   │   └── models/
│   └── config/
├── frontend/         # React + Vite
│   ├── src/
│   │   ├── api/
│   │   └── components/
│   └── public/
├── docker-compose.yml
└── CLAUDE.md         # AI開発ガイドライン
```

## API エンドポイント

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | ヘルスチェック |

## 開発ガイドライン

設計方針については [CLAUDE.md](./CLAUDE.md) を参照してください。

- MIT の「Concepts & Synchronizations」パターンに従う
- SOLID 原則に従う
- マイクロサービスアーキテクチャの設計思想に従う
