# frozen_string_literal: true

class PatientDoubleBookingError < DoubleBookingError
  def initialize(patient_id:)
    super(conflict_type: "patient", resource_id: patient_id)
  end

  def message
    "患者は既に別の訪問が予定されています"
  end
end
