# Deployment Guide

## 概要

このドキュメントは、MinoriアプリケーションをGoogle Cloud Platform (GCP)にデプロイする手順を説明します。

## 前提条件

- Google Cloud SDK (`gcloud`) がインストール済み
- プロジェクト: `minori-477714`
- リージョン: `asia-northeast1`
- Cloud SQL インスタンス: `minori-prod-db`

## 必要なシークレット

以下のシークレットをSecret Managerに作成する必要があります：

### 1. RAILS_MASTER_KEY
Railsのマスターキー（`config/master.key`の内容）

```bash
gcloud secrets create RAILS_MASTER_KEY \
  --data-file=backend/config/master.key \
  --project=minori-477714
```

### 2. DB_PASSWORD
データベースユーザー `rails-app` のパスワード

```bash
echo -n "YOUR_DB_PASSWORD" | gcloud secrets create DB_PASSWORD \
  --data-file=- \
  --project=minori-477714
```

### 3. SECRET_KEY_BASE
Railsのシークレットキーベース

```bash
# Generate new key
SECRET_KEY=$(openssl rand -hex 64)
echo -n "$SECRET_KEY" | gcloud secrets create SECRET_KEY_BASE \
  --data-file=- \
  --project=minori-477714
```

## 環境変数

### Backend (Rails)

`backend/config/database.yml` で使用される環境変数：

| 環境変数名 | 説明 | 値 |
|-----------|------|-----|
| `RAILS_ENV` | Rails環境 | `production` |
| `DB_HOST` | データベースホスト | `/cloudsql/minori-477714:asia-northeast1:minori-prod-db` |
| `DB_NAME` | データベース名 | `minori_production` |
| `DB_USER` | データベースユーザー | `rails-app` |
| `DB_PASSWORD` | データベースパスワード | (Secret Manager) |
| `RAILS_MASTER_KEY` | Railsマスターキー | (Secret Manager) |
| `SECRET_KEY_BASE` | シークレットキーベース | (Secret Manager) |

### Frontend (React)

| 環境変数名 | 説明 | 値 |
|-----------|------|-----|
| `VITE_API_URL` | バックエンドAPIのURL | `https://minori-backend-336192862447.asia-northeast1.run.app` |

## データベースセットアップ

### 1. データベースユーザーの作成

```bash
# rails-app ユーザーを作成
gcloud sql users create rails-app \
  --instance=minori-prod-db \
  --password="YOUR_SECURE_PASSWORD" \
  --project=minori-477714
```

### 2. データベースの作成

```bash
# postgres ユーザーのパスワードを設定
gcloud sql users set-password postgres \
  --instance=minori-prod-db \
  --password="POSTGRES_PASSWORD" \
  --project=minori-477714

# データベースを作成
psql "host=PUBLIC_IP port=5432 dbname=postgres user=postgres sslmode=require" << EOF
CREATE DATABASE minori_production;
\c minori_production
EOF
```

### 3. 権限付与

```bash
# rails-app に権限を付与
psql "host=PUBLIC_IP port=5432 dbname=minori_production user=postgres sslmode=require" << EOF
GRANT ALL PRIVILEGES ON DATABASE minori_production TO "rails-app";
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "rails-app";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "rails-app";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "rails-app";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "rails-app";
EOF
```

## デプロイ方法

### 自動デプロイ（推奨）

```bash
# すべてをデプロイ
./scripts/deploy.sh all

# フロントエンドのみ
./scripts/deploy.sh frontend

# バックエンドのみ
./scripts/deploy.sh backend
```

### 手動デプロイ

#### Backend

```bash
gcloud builds submit ./backend \
  --config=./backend/cloudbuild.yaml \
  --project=minori-477714
```

#### Frontend

```bash
gcloud builds submit ./frontend \
  --config=./frontend/cloudbuild.yaml \
  --project=minori-477714 \
  --substitutions=_VITE_API_URL="https://minori-backend-336192862447.asia-northeast1.run.app"
```

## デプロイ済みURL

- **Frontend**: https://minori-frontend-336192862447.asia-northeast1.run.app
- **Backend**: https://minori-backend-336192862447.asia-northeast1.run.app

## トラブルシューティング

### 1. "Container failed to start"

**原因**: データベース接続エラーまたは環境変数の設定ミス

**解決方法**:
- ログを確認: `gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=minori-backend" --project=minori-477714 --limit=50`
- 環境変数名が `database.yml` と一致しているか確認
- シークレットが正しく設定されているか確認

### 2. "Password authentication failed"

**原因**: データベースユーザーのパスワードが間違っているか、権限が不足している

**解決方法**:
- パスワードを再設定: `gcloud sql users set-password rails-app ...`
- 権限を再付与（上記「権限付与」セクション参照）

### 3. "Permission denied for table"

**原因**: `rails-app` ユーザーがテーブルへのアクセス権限を持っていない

**解決方法**:
- 権限を付与（上記「権限付与」セクション参照）

### 4. 環境変数名の不一致

`database.yml` では以下の変数名を使用しています：
- `DB_NAME` (NOT `DATABASE_NAME`)
- `DB_USER` (NOT `DATABASE_USERNAME`)
- `DB_HOST` (NOT `DATABASE_HOST`)
- `DB_PASSWORD`

Cloud Runデプロイ時は必ずこれらの名前を使用してください。

## メンテナンス

### ログの確認

```bash
# Backend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=minori-backend" \
  --project=minori-477714 \
  --limit=50

# Frontend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=minori-frontend" \
  --project=minori-477714 \
  --limit=50
```

### データベースマイグレーション

マイグレーションは `bin/docker-entrypoint` で自動的に実行されます（`db:prepare`）。

手動で実行する場合:

```bash
# Cloud Runコンテナ内で実行
gcloud run jobs create db-migrate \
  --image=asia-northeast1-docker.pkg.dev/minori-477714/minori/backend:latest \
  --region=asia-northeast1 \
  --command="./bin/rails" \
  --args="db:migrate" \
  --add-cloudsql-instances=minori-477714:asia-northeast1:minori-prod-db \
  --set-env-vars="RAILS_ENV=production,DB_HOST=/cloudsql/minori-477714:asia-northeast1:minori-prod-db,DB_NAME=minori_production,DB_USER=rails-app" \
  --set-secrets="RAILS_MASTER_KEY=RAILS_MASTER_KEY:latest,DB_PASSWORD=DB_PASSWORD:latest,SECRET_KEY_BASE=SECRET_KEY_BASE:latest" \
  --project=minori-477714

gcloud run jobs execute db-migrate --region=asia-northeast1 --project=minori-477714
```

## セキュリティ

- シークレットは必ずSecret Managerで管理し、コードにコミットしない
- Cloud SQLへのアクセスはCloud SQL ProxyまたはプライベートIP経由のみ
- 本番環境のパスワードは強固なものを使用（最低16文字、英数字記号混在）
