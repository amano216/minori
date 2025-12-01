class CreateVersions < ActiveRecord::Migration[8.1]
  def change
    create_table :versions do |t|
      # paper_trail標準カラム
      t.string   :item_type, null: false
      t.bigint   :item_id,   null: false
      t.string   :event,     null: false  # create/update/destroy
      t.string   :whodunnit                # ユーザーID
      t.jsonb    :object                   # 変更前データ
      t.jsonb    :object_changes           # 変更差分

      # 3省2ガイドライン準拠の拡張カラム
      t.string   :whodunnit_name           # ユーザー名
      t.string   :whodunnit_role           # 役職
      t.bigint   :organization_id          # 組織ID（マルチテナント対応）
      t.string   :ip_address               # アクセス元IPアドレス
      t.string   :user_agent               # 端末情報

      t.datetime :created_at, null: false
    end

    # インデックス
    add_index :versions, [:item_type, :item_id]
    add_index :versions, :whodunnit
    add_index :versions, :organization_id
    add_index :versions, :created_at
  end
end
