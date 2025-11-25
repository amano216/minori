# Minori Backend

訪問看護スケジュール管理システムのバックエンドAPI

## Ruby version
- Ruby 3.4.1
- Rails 8.1.1

## System dependencies
- PostgreSQL 16
- Docker & Docker Compose (推奨)

## Development Setup

### Docker環境（推奨）
```bash
docker-compose up -d
docker-compose exec backend bin/rails db:create db:migrate
```

### ローカル環境
```bash
bundle install
bin/rails db:create db:migrate
bin/rails server
```

## Email Configuration

### 開発環境
デフォルトでは`AUTO_CONFIRM_EMAIL=true`により、メール確認と2FAをスキップします。

実際のメール送信をテストする場合：
1. `.env.example`をコピーして`.env`を作成
2. SMTP設定を記入（Gmailの例）：
```env
SMTP_ADDRESS=smtp.gmail.com
SMTP_PORT=587
SMTP_DOMAIN=gmail.com
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
AUTO_CONFIRM_EMAIL=false
```

**Gmail App Passwordの取得方法：**
1. Googleアカウントで2段階認証を有効化
2. https://myaccount.google.com/apppasswords にアクセス
3. アプリパスワードを生成（アプリ: メール）
4. 生成されたパスワードを`SMTP_PASSWORD`に設定

### 本番環境
環境変数で設定：
```env
FRONTEND_URL=https://your-domain.com
SMTP_ADDRESS=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## Authentication Features

### 1. メール確認
- サインアップ時に確認メールを送信
- メール内のリンクでアカウントを有効化

### 2. パスワードリセット
- `/forgot-password`からリセット申請
- メールでリセットリンクを送信（24時間有効）

### 3. 2要素認証（2FA）
- ログイン時に6桁のOTPをメール送信
- 認証成功後24時間は再認証不要

## API Endpoints

### Authentication
- `POST /api/auth/signup` - 新規登録
- `POST /api/auth/login` - ログイン
- `POST /api/auth/logout` - ログアウト
- `GET /api/auth/me` - 現在のユーザー情報
- `POST /api/auth/confirm-email` - メール確認
- `POST /api/auth/resend-confirmation` - 確認メール再送信
- `POST /api/auth/forgot-password` - パスワードリセット申請
- `POST /api/auth/reset-password` - パスワードリセット実行
- `POST /api/auth/verify-otp` - OTP認証
- `POST /api/auth/toggle-2fa` - 2FA有効/無効切り替え

### Resources
- `/api/staffs` - スタッフ管理
- `/api/patients` - 患者管理
- `/api/visits` - 訪問予定管理
- `/api/schedules` - スケジュール照会
- `/api/organization` - 組織情報
- `/api/admin/*` - 管理者機能

## Deployment

Google Cloud Runへのデプロイ：
```bash
./scripts/deploy.sh
```
