# frozen_string_literal: true

# PaperTrail設定
# 3省2ガイドライン（厚生労働省「医療情報システムの安全管理に関するガイドライン第6.0版」）
# 準拠の監査ログ設定

PaperTrail.config.enabled = true

# 拡張カラムの設定（3省2ガイドライン準拠）
# - whodunnit_name: 操作者名
# - whodunnit_role: 操作者の役職
# - organization_id: 組織ID
# - ip_address: アクセス元IP
# - user_agent: 端末情報
