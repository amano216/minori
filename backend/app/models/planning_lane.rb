class PlanningLane < ApplicationRecord
  # 3省2ガイドライン準拠の監査ログ（Phase 3）
  has_paper_trail

  belongs_to :organization
  has_many :visits, dependent: :nullify
end
