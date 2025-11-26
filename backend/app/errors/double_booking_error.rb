# frozen_string_literal: true

class DoubleBookingError < StandardError
  attr_reader :conflict_type, :resource_id

  def initialize(conflict_type:, resource_id:)
    @conflict_type = conflict_type
    @resource_id = resource_id
    super("Double booking detected for #{conflict_type}")
  end
end

class StaffDoubleBookingError < DoubleBookingError
  def initialize(staff_id:)
    super(conflict_type: "staff", resource_id: staff_id)
  end

  def message
    "スタッフは既に別の訪問が予定されています"
  end
end

class PatientDoubleBookingError < DoubleBookingError
  def initialize(patient_id:)
    super(conflict_type: "patient", resource_id: patient_id)
  end

  def message
    "患者は既に別の訪問が予定されています"
  end
end
