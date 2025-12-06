# frozen_string_literal: true

class PatientTaskRead < ApplicationRecord
  belongs_to :patient_task
  belongs_to :user

  validates :patient_task_id, uniqueness: { scope: :user_id, message: "は既に既読済みです" }
end
