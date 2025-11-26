# frozen_string_literal: true

require "test_helper"

# NOTE: These tests require fixtures to be set up.
# For now, we test only the error classes to ensure they work correctly.
class ConflictErrorsTest < ActiveSupport::TestCase
  test "StaffDoubleBookingError has correct attributes" do
    error = StaffDoubleBookingError.new(staff_id: 123)
    assert_equal :staff, error.conflict_type
    assert_equal 123, error.resource_id
    assert_includes error.message, "スタッフは既に別の訪問が予定されています"
  end

  test "PatientDoubleBookingError has correct attributes" do
    error = PatientDoubleBookingError.new(patient_id: 456)
    assert_equal :patient, error.conflict_type
    assert_equal 456, error.resource_id
    assert_includes error.message, "患者は既に別の訪問が予定されています"
  end

  test "ConcurrentModificationError has correct message" do
    error = ConcurrentModificationError.new
    assert_includes error.message, "他のユーザーによって更新されました"
  end
end
