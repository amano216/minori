# 本番環境での患者データインポート手順

## 前提条件

- コードが本番環境（Cloud Run）にデプロイ済みであること
- GCP CLIでログイン済みであること
- CSVファイルが準備されていること

## 手順

### 1. 本番環境の組織IDを確認

```bash
# Cloud Run Jobsを使用して組織一覧を取得
gcloud run jobs create check-organizations \
  --image=asia-northeast1-docker.pkg.dev/minori-477714/minori/backend:latest \
  --region=asia-northeast1 \
  --set-cloudsql-instances=minori-477714:asia-northeast1:minori-prod-db \
  --set-env-vars=RAILS_ENV=production,DB_HOST=/cloudsql/minori-477714:asia-northeast1:minori-prod-db \
  --set-secrets=DB_PASSWORD=DB_PASSWORD:latest,SECRET_KEY_BASE=SECRET_KEY_BASE:latest,RAILS_MASTER_KEY=RAILS_MASTER_KEY:latest \
  --max-retries=0 \
  --task-timeout=300s \
  --args='bin/rails','runner','puts "Organizations:"; Organization.all.each { |o| puts "ID: #{o.id}, Name: #{o.name}, Subdomain: #{o.subdomain}" }'

# Jobを実行
gcloud run jobs execute check-organizations --region=asia-northeast1 --wait

# ログを確認
gcloud logging read "resource.type=cloud_run_job AND resource.labels.job_name=check-organizations" \
  --limit=50 --format="value(textPayload)" --project=minori-477714
```

### 2. CSVファイルをCloud Storageにアップロード

```bash
# バケットを作成（初回のみ）
gsutil mb -p minori-477714 -l asia-northeast1 gs://minori-patient-imports/

# CSVファイルをアップロード
gsutil cp "/path/to/流山 (1).csv" gs://minori-patient-imports/nagareyama.csv
```

### 3. インポートJobを作成して実行

```bash
# インポートJobを作成
gcloud run jobs create import-nagareyama-patients \
  --image=asia-northeast1-docker.pkg.dev/minori-477714/minori/backend:latest \
  --region=asia-northeast1 \
  --set-cloudsql-instances=minori-477714:asia-northeast1:minori-prod-db \
  --set-env-vars=RAILS_ENV=production,DB_HOST=/cloudsql/minori-477714:asia-northeast1:minori-prod-db,ORGANIZATION_ID=<AGO組織ID> \
  --set-secrets=DB_PASSWORD=DB_PASSWORD:latest,SECRET_KEY_BASE=SECRET_KEY_BASE:latest,RAILS_MASTER_KEY=RAILS_MASTER_KEY:latest,DB_USER=db-user:latest,DB_NAME=db-name:latest \
  --max-retries=0 \
  --task-timeout=600s \
  --memory=1Gi \
  --cpu=1 \
  --args='sh','-c','gsutil cp gs://minori-patient-imports/nagareyama.csv /tmp/patients.csv && CSV_PATH=/tmp/patients.csv bin/rails patients:import'

# Jobを実行
gcloud run jobs execute import-nagareyama-patients --region=asia-northeast1 --wait
```

### 4. インポート結果を確認

```bash
# ログを確認
gcloud logging read "resource.type=cloud_run_job AND resource.labels.job_name=import-nagareyama-patients" \
  --limit=200 --format="value(textPayload)" --project=minori-477714 | grep -E "(Imported|Skipped|Errors|Total)"

# 患者数を確認
gcloud run jobs create check-patient-count \
  --image=asia-northeast1-docker.pkg.dev/minori-477714/minori/backend:latest \
  --region=asia-northeast1 \
  --set-cloudsql-instances=minori-477714:asia-northeast1:minori-prod-db \
  --set-env-vars=RAILS_ENV=production,DB_HOST=/cloudsql/minori-477714:asia-northeast1:minori-prod-db,ORGANIZATION_ID=<AGO組織ID> \
  --set-secrets=DB_PASSWORD=DB_PASSWORD:latest,SECRET_KEY_BASE=SECRET_KEY_BASE:latest,RAILS_MASTER_KEY=RAILS_MASTER_KEY:latest \
  --max-retries=0 \
  --task-timeout=300s \
  --args='bin/rails','runner','org = Organization.find(ENV["ORGANIZATION_ID"]); puts "Total patients: #{org.patients.count}"'

gcloud run jobs execute check-patient-count --region=asia-northeast1 --wait
```

## 簡易版（Cloud Shellを使用）

Cloud ShellでCloud SQL Proxyを使用する方法：

```bash
# Cloud Shellにログイン
# https://console.cloud.google.com/

# リポジトリをクローン
git clone https://github.com/amano216/minori.git
cd minori/backend

# 依存関係をインストール
bundle install

# Cloud SQL Proxyを起動（バックグラウンド）
cloud-sql-proxy minori-477714:asia-northeast1:minori-prod-db --port=5432 &

# 環境変数を設定
export RAILS_ENV=production
export DB_HOST=127.0.0.1
export SECRET_KEY_BASE=$(gcloud secrets versions access latest --secret="SECRET_KEY_BASE")
export DB_PASSWORD=$(gcloud secrets versions access latest --secret="DB_PASSWORD")
export DB_USER=$(gcloud secrets versions access latest --secret="db-user")
export DB_NAME=$(gcloud secrets versions access latest --secret="db-name")

# CSVファイルをアップロード（ローカルからCloud Shellへ）
# Cloud Shellのメニューから「ファイルをアップロード」

# インポート実行
CSV_PATH=/home/$USER/nagareyama.csv ORGANIZATION_ID=<AGO組織ID> bin/rails patients:import
```

## トラブルシューティング

### タイムアウトが発生する場合

```bash
# タイムアウト時間を延長
--task-timeout=900s
```

### メモリ不足の場合

```bash
# メモリを増やす
--memory=2Gi
```

### Jobの削除

```bash
gcloud run jobs delete <job-name> --region=asia-northeast1
```

## セキュリティ注意事項

- CSVファイルには個人情報が含まれるため、Cloud Storageバケットは適切なアクセス制限を設定してください
- インポート完了後、CSVファイルは削除することを推奨します
- Jobの実行ログにも患者情報が含まれる可能性があるため、適切に管理してください
