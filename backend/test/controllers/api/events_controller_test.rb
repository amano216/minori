require "test_helper"

class Api::EventsControllerTest < ActionDispatch::IntegrationTest
  def setup
    @organization = organizations(:one)
    @user = users(:admin)
    @event = events(:team_meeting)
  end

  test "should get index" do
    get api_events_url, headers: auth_headers(@user)
    assert_response :success

    json = JSON.parse(response.body)
    assert_kind_of Array, json
  end

  test "should get index with date filter" do
    get api_events_url, params: { date: @event.scheduled_at.to_date.to_s }, headers: auth_headers(@user)
    assert_response :success

    json = JSON.parse(response.body)
    assert_kind_of Array, json
  end

  test "should get index with date range filter" do
    get api_events_url,
      params: {
        start_date: @event.scheduled_at.to_date.to_s,
        end_date: (@event.scheduled_at.to_date + 1.day).to_s
      },
      headers: auth_headers(@user)
    assert_response :success

    json = JSON.parse(response.body)
    assert_kind_of Array, json
  end

  test "should show event" do
    get api_event_url(@event), headers: auth_headers(@user)
    assert_response :success

    json = JSON.parse(response.body)
    assert_equal @event.id, json["id"]
    assert_equal @event.title, json["title"]
    assert_includes json.keys, "participants"
  end

  test "should create event" do
    assert_difference("Event.count") do
      post api_events_url,
        params: {
          event: {
            title: "New Test Event",
            event_type: "meeting",
            scheduled_at: 1.day.from_now,
            duration: 60
          }
        },
        headers: auth_headers(@user)
    end
    assert_response :created

    json = JSON.parse(response.body)
    assert_equal "New Test Event", json["title"]
  end

  test "should create event with participants" do
    staff1 = users(:staff)
    staff2 = users(:staff2)

    post api_events_url,
      params: {
        event: {
          title: "Team Meeting with Participants",
          event_type: "meeting",
          scheduled_at: 1.day.from_now,
          duration: 60,
          participant_ids: [ staff1.id, staff2.id ]
        }
      },
      headers: auth_headers(@user)
    assert_response :created

    json = JSON.parse(response.body)
    assert_equal 2, json["participants"].count
  end

  test "should update event" do
    patch api_event_url(@event),
      params: { event: { title: "Updated Title" } },
      headers: auth_headers(@user)
    assert_response :success

    @event.reload
    assert_equal "Updated Title", @event.title
  end

  test "should destroy event" do
    assert_difference("Event.count", -1) do
      delete api_event_url(@event), headers: auth_headers(@user)
    end
    assert_response :no_content
  end

  test "should require authentication" do
    get api_events_url
    assert_response :unauthorized
  end

  private

  def auth_headers(user)
    token = JsonWebToken.encode(user_id: user.id)
    { "Authorization" => "Bearer #{token}" }
  end
end
