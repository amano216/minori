class PlanningLane < ApplicationRecord
  # 3省2ガイドライン準拠の監査ログ（Phase 3）
  has_paper_trail

  belongs_to :organization
  belongs_to :group, optional: true
  has_many :visits, dependent: :nullify
end
