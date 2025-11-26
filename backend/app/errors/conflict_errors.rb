# frozen_string_literal: true

# 同時アクセス時の競合エラー用の専用エラークラス

# ダブルブッキングエラー（スタッフまたは患者の重複予約）
class DoubleBookingError < StandardError
  attr_reader :conflict_type, :resource_id

  def initialize(message, conflict_type: nil, resource_id: nil)
    @conflict_type = conflict_type # :staff or :patient
    @resource_id = resource_id
    super(message)
  end
end

# スタッフの重複予約エラー
class StaffDoubleBookingError < DoubleBookingError
  def initialize(staff_id: nil)
    super(
      "スタッフは既に別の訪問が予定されています",
      conflict_type: :staff,
      resource_id: staff_id
    )
  end
end

# 患者の重複予約エラー
class PatientDoubleBookingError < DoubleBookingError
  def initialize(patient_id: nil)
    super(
      "患者は既に別の訪問が予定されています",
      conflict_type: :patient,
      resource_id: patient_id
    )
  end
end

# 楽観的ロックによる競合エラー（他のユーザーが先に更新した場合）
class ConcurrentModificationError < StandardError
  def initialize
    super("この訪問予定は他のユーザーによって更新されました。ページを再読み込みしてください。")
  end
end
