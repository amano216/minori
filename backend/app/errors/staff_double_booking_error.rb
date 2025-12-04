# frozen_string_literal: true

class StaffDoubleBookingError < DoubleBookingError
  def initialize(staff_id:)
    super(conflict_type: "staff", resource_id: staff_id)
  end

  def message
    "スタッフは既に別の訪問が予定されています"
  end
end
