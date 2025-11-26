# Minori UI/UX デザインガイドライン

このドキュメントは、Minoriアプリケーション全体で一貫したUI/UXを実現するための標準ガイドラインです。

## 📐 デザインシステム概要

### レスポンシブブレークポイント

Tailwind CSSのデフォルトブレークポイントを使用：

| プレフィックス | 最小幅 | 用途 |
|---------------|--------|------|
| (なし) | 0px | モバイル（デフォルト） |
| `sm:` | 640px | タブレット縦 |
| `md:` | 768px | タブレット横 |
| `lg:` | 1024px | デスクトップ |
| `xl:` | 1280px | 大画面 |

**原則**: モバイルファースト設計。基本スタイルはモバイル用に記述し、`sm:`以降で上書き。

---

## 📝 タイポグラフィ

### フォントサイズ

| 用途 | モバイル | デスクトップ (sm:以上) | クラス例 |
|------|----------|------------------------|----------|
| ページタイトル | text-xl | text-2xl | `text-xl sm:text-2xl` |
| セクションタイトル | text-lg | text-xl | `text-lg sm:text-xl` |
| カードタイトル | text-base | text-lg | `text-base sm:text-lg` |
| 本文 | text-base | text-sm | `text-base sm:text-sm` |
| ラベル・キャプション | text-xs | text-sm | `text-xs sm:text-sm` |
| 補足テキスト | text-xs | text-xs | `text-xs` |

### フォントウェイト

| 用途 | クラス |
|------|--------|
| タイトル | `font-bold` |
| サブタイトル | `font-semibold` |
| 本文 | `font-normal` |
| 強調テキスト | `font-medium` |

---

## 📏 スペーシング

### ページレイアウト

| 項目 | モバイル | デスクトップ | クラス例 |
|------|----------|--------------|----------|
| ページパディング | p-4 | p-6 | `p-4 sm:p-6` |
| セクション間マージン | mb-4 | mb-6 | `mb-4 sm:mb-6` |
| カード内パディング | p-3 | p-4 | `p-3 sm:p-4` |
| 要素間ギャップ | gap-3 | gap-4 | `gap-3 sm:gap-4` |

### コンポーネント間隔

```tsx
// ページヘッダーとコンテンツの間
<div className="mb-4 sm:mb-6">

// フォームフィールド間
<div className="space-y-3 sm:space-y-4">

// ボタングループ
<div className="flex gap-2 sm:gap-3">
```

---

## 👆 タッチターゲット

モバイルでのタップしやすさを確保するため、最小サイズを設定。

| 要素 | モバイル最小高さ | デスクトップ | クラス例 |
|------|------------------|--------------|----------|
| ボタン | 44px | 40px | `min-h-[44px] sm:min-h-[40px]` |
| 入力フィールド | 44px | 40px | `min-h-[44px] sm:min-h-[40px]` |
| セレクトボックス | 44px | 40px | `min-h-[44px] sm:min-h-[40px]` |
| リストアイテム | 44px | 36px | `min-h-[44px] sm:min-h-[36px]` |

---

## 🎨 カラーパレット

### プライマリカラー

```tsx
// メインアクション
bg-blue-600 hover:bg-blue-700 text-white

// セカンダリアクション
bg-gray-100 hover:bg-gray-200 text-gray-700

// 危険なアクション
bg-red-600 hover:bg-red-700 text-white
```

### ステータスカラー

| ステータス | 背景色 | テキスト色 | ボーダー色 |
|-----------|--------|------------|------------|
| 成功 | `bg-green-50` | `text-green-800` | `border-green-200` |
| 警告 | `bg-yellow-50` | `text-yellow-800` | `border-yellow-200` |
| エラー | `bg-red-50` | `text-red-800` | `border-red-200` |
| 情報 | `bg-blue-50` | `text-blue-800` | `border-blue-200` |

### 背景色

```tsx
// ページ背景
bg-gray-50

// カード背景
bg-white

// ホバー状態
hover:bg-gray-50

// 選択状態
bg-blue-50
```

---

## 🧩 コンポーネント

### Button

```tsx
// プライマリボタン
<Button variant="primary" size="md">
  保存
</Button>

// サイズバリエーション
size="sm"  // 小さい
size="md"  // 標準（デフォルト）
size="lg"  // 大きい
```

### Input

```tsx
import { Input } from '@/components/atoms/Input';

<Input
  label="メールアドレス"
  type="email"
  placeholder="example@email.com"
  error={errors.email}
/>
```

**スタイリング要件**:
- モバイル: `text-base`（ズーム防止）, `min-h-[44px]`
- デスクトップ: `text-sm`, `min-h-[40px]`

### Select

```tsx
import { Select } from '@/components/atoms/Select';

<Select
  label="都道府県"
  options={prefectures}
  value={selectedPref}
  onChange={setSelectedPref}
/>
```

### Textarea

```tsx
import { Textarea } from '@/components/atoms/Textarea';

<Textarea
  label="備考"
  rows={4}
  placeholder="詳細を入力してください"
/>
```

### Card

```tsx
import { Card } from '@/components/molecules/Card';

<Card>
  <Card.Header>
    <Card.Title>タイトル</Card.Title>
  </Card.Header>
  <Card.Body>
    コンテンツ
  </Card.Body>
</Card>
```

**パディング**: `p-3 sm:p-4` または `p-4 sm:p-6`（大きいカード）

### Modal

```tsx
import { Modal } from '@/components/molecules/Modal';

<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="確認"
>
  モーダルの内容
</Modal>
```

**モバイル対応**:
- モバイル: ボトムシート形式（下から上へスライド）
- デスクトップ: 中央配置

### Alert

```tsx
import { Alert } from '@/components/atoms/Alert';

<Alert variant="error">
  エラーが発生しました
</Alert>

<Alert variant="success">
  保存しました
</Alert>

// バリエーション: error, warning, success, info
```

### DataTable

```tsx
import { DataTable } from '@/components/molecules/DataTable';

<DataTable
  columns={columns}
  data={data}
  onRowClick={handleRowClick}
/>
```

**モバイル対応**:
- 横スクロール可能: `overflow-x-auto`
- 最小幅設定: `min-w-[600px]` など

---

## 📱 モーダル/パネル

### モバイル表示

```tsx
// ボトムシートスタイル
<div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2">
  {/* ドラッグハンドル（モバイルのみ） */}
  <div className="sm:hidden w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />
  
  {/* コンテンツ */}
</div>
```

### デスクトップ表示

- 中央配置
- 最大幅: `max-w-md` または `max-w-lg`
- 角丸: `rounded-lg`

---

## 📋 テーブル

### 基本構造

```tsx
<div className="overflow-x-auto">
  <table className="min-w-full">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          カラム名
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-3 text-sm text-gray-900">
          データ
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### モバイル対応

1. **横スクロール**: `overflow-x-auto` でラップ
2. **最小幅**: テーブルに `min-w-[600px]` など設定
3. **代替表示**: 複雑なテーブルはカード形式に変換

```tsx
{/* モバイル: カード形式 */}
<div className="sm:hidden space-y-4">
  {data.map(item => (
    <Card key={item.id}>
      <div className="text-sm font-medium">{item.name}</div>
      <div className="text-xs text-gray-500">{item.date}</div>
    </Card>
  ))}
</div>

{/* デスクトップ: テーブル形式 */}
<div className="hidden sm:block">
  <DataTable columns={columns} data={data} />
</div>
```

---

## 🔘 ボタン配置

### フォーム下部

```tsx
<div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 mt-4">
  <Button variant="secondary" onClick={onCancel}>
    キャンセル
  </Button>
  <Button variant="primary" type="submit">
    保存
  </Button>
</div>
```

### ページヘッダー

```tsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
  <h1 className="text-xl sm:text-2xl font-bold">ページタイトル</h1>
  <Button variant="primary">
    新規作成
  </Button>
</div>
```

---

## 📂 ページレイアウト

### ListLayout テンプレート

```tsx
import { ListLayout } from '@/components/templates/ListLayout';

<ListLayout
  title="ユーザー一覧"
  description="システムに登録されているユーザーを管理します"
  action={
    <Button onClick={handleCreate}>新規作成</Button>
  }
>
  {/* コンテンツ */}
</ListLayout>
```

### 標準ページ構造

```tsx
<div className="p-4 sm:p-6">
  {/* ヘッダー */}
  <div className="mb-4 sm:mb-6">
    <h1 className="text-xl sm:text-2xl font-bold">タイトル</h1>
    <p className="text-xs sm:text-sm text-gray-500 mt-1">説明文</p>
  </div>
  
  {/* メインコンテンツ */}
  <div className="space-y-4 sm:space-y-6">
    {/* セクション */}
  </div>
</div>
```

---

## ✅ チェックリスト

新しいコンポーネントやページを作成する際の確認事項：

### モバイル対応
- [ ] タッチターゲットは44px以上か
- [ ] フォントサイズは読みやすいか（モバイルで16px以上推奨）
- [ ] 横スクロールが必要な場合は適切に設定されているか
- [ ] モーダルはボトムシート形式になっているか

### 一貫性
- [ ] 共通コンポーネント（Input, Select, Button等）を使用しているか
- [ ] スペーシングはガイドラインに従っているか
- [ ] カラーパレットに沿った色を使用しているか

### アクセシビリティ
- [ ] フォーム要素にラベルがあるか
- [ ] エラーメッセージは明確か
- [ ] コントラスト比は十分か

---

## 📁 コンポーネントファイル構成

```
frontend/src/components/
├── atoms/           # 最小単位のコンポーネント
│   ├── Alert.tsx
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   └── Textarea.tsx
├── molecules/       # 複数のatomsで構成
│   ├── Card.tsx
│   ├── DataTable.tsx
│   └── Modal.tsx
├── organisms/       # 複雑な機能を持つコンポーネント
│   └── ...
└── templates/       # ページレイアウト
    └── ListLayout.tsx
```

---

## 🔄 更新履歴

| 日付 | 変更内容 |
|------|----------|
| 2024-11-26 | 初版作成 |

---

## 📚 参考リソース

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design Guidelines](https://material.io/design)
