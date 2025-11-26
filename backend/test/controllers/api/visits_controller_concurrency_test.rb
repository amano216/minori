# frozen_string_literal: true

require "test_helper"

class Api::VisitsControllerConcurrencyTest < ActionDispatch::IntegrationTest
  setup do
    @organization = organizations(:default)
    @admin = users(:admin)
    @patient = patients(:tanaka)
    @staff = users(:staff)
    @token = generate_token_for(@admin)
  end

  test "should return 409 when updating with stale lock_version" do
    visit = Visit.create!(
      organization: @organization,
      patient: @patient,
      user: @staff,
      scheduled_at: 1.day.from_now,
      duration: 60,
      status: "scheduled"
    )

    original_version = visit.lock_version

    visit.update!(notes: "Updated by another user")
    assert_equal original_version + 1, visit.reload.lock_version

    put api_visit_url(visit),
        params: {
          visit: {
            notes: "My update",
            lock_version: original_version
          }
        },
        headers: auth_headers(@token),
        as: :json

    assert_response :conflict
    json = JSON.parse(response.body)
    assert_equal "stale_object", json["error_type"]
    assert_includes json["errors"].first, "他のユーザーによって更新されました"
  end

  test "should return 409 when staff double booking occurs" do
    scheduled_time = 1.day.from_now.change(hour: 10, min: 0)

    Visit.create!(
      organization: @organization,
      patient: @patient,
      user: @staff,
      scheduled_at: scheduled_time,
      duration: 60,
      status: "scheduled"
    )

    post api_visits_url,
         params: {
           visit: {
             patient_id: @patient.id,
             staff_id: @staff.id,
             scheduled_at: scheduled_time + 30.minutes,
             duration: 60
           }
         },
         headers: auth_headers(@token),
         as: :json

    assert_response :conflict
    json = JSON.parse(response.body)
    assert_equal "double_booking", json["error_type"]
    assert_equal "staff", json["conflict_type"]
    assert_includes json["errors"].first, "スタッフは既に別の訪問が予定されています"
  end

  test "should allow non-overlapping visits for same staff" do
    scheduled_time = 1.day.from_now.change(hour: 10, min: 0)

    Visit.create!(
      organization: @organization,
      patient: @patient,
      user: @staff,
      scheduled_at: scheduled_time,
      duration: 60,
      status: "scheduled"
    )

    post api_visits_url,
         params: {
           visit: {
             patient_id: @patient.id,
             staff_id: @staff.id,
             scheduled_at: scheduled_time + 90.minutes,
             duration: 60
           }
         },
         headers: auth_headers(@token),
         as: :json

    assert_response :created
  end

  private

  def auth_headers(token)
    { "Authorization" => "Bearer #{token}" }
  end

  def generate_token_for(user)
    JwtService.encode(user_id: user.id)
  end
end
