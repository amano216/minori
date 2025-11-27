# 患者データインポート

CSVファイルから患者データをインポートする機能です。

## 前提条件

- Organizationが作成されていること
- CSVファイルが準備されていること

## 使用方法

### 1. 組織IDを確認

```bash
cd backend
bin/rails console
```

Railsコンソールで：
```ruby
Organization.all
# => 組織のリストが表示されます。IDを確認してください。
```

### 2. CSVファイルをインポート

```bash
CSV_PATH=/path/to/your/file.csv ORGANIZATION_ID=1 bin/rails patients:import
```

例（添付のCSVファイルをインポートする場合）：
```bash
CSV_PATH="/Users/emma/Downloads/流山 (1).csv" ORGANIZATION_ID=1 bin/rails patients:import
```

### 3. インポートされた患者を確認

全患者を確認：
```bash
bin/rails patients:list
```

特定の組織の患者のみ確認：
```bash
ORGANIZATION_ID=1 bin/rails patients:list
```

### 4. （オプション）患者データをクリア

特定の組織の患者を削除：
```bash
ORGANIZATION_ID=1 bin/rails patients:clear
```

全患者を削除：
```bash
bin/rails patients:clear
```

## CSVファイル形式

以下の列名が必要です：

- `利用者ｺｰﾄﾞ` - 患者コード
- `氏名` - 患者名（必須）
- `電話番号` - 電話番号
- `郵便番号` - 郵便番号
- `住所1` - 住所（都道府県・市区町村）
- `住所2` - 住所（番地以降）
- `基本情報 利用受付日` - 利用開始日
- `基本情報 本体･ｻﾃﾗｲﾄ` - 拠点情報

## インポート処理の詳細

- 同じ名前と住所の患者が既に存在する場合はスキップされます
- 和暦（T, S, H, R）を西暦に自動変換します
  - T (大正): 1912-1926
  - S (昭和): 1926-1989
  - H (平成): 1989-2019
  - R (令和): 2019-
- エラーが発生した行は詳細が表示され、処理は継続されます
- インポート完了後、成功・スキップ・エラーの統計が表示されます

### 西暦変換の例

- `H29.08.01` → `2017-08-01` (平成29年8月1日)
- `R01.09.19` → `2019-09-19` (令和元年9月19日)
- `R07.03.05` → `2025-03-05` (令和7年3月5日)

ノートには西暦と和暦の両方が記録されます。

## トラブルシューティング

### エラー: "Organization with ID X not found"

指定した組織IDが存在しません。`Organization.all`で有効なIDを確認してください。

### エラー: "File not found"

CSVファイルのパスが間違っています。絶対パスで指定してください。

### 文字化けする場合

CSVファイルがUTF-8でエンコードされていることを確認してください。
