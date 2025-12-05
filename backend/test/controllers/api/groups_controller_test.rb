require "test_helper"

class Api::GroupsControllerTest < ActionDispatch::IntegrationTest
  def setup
    @organization = organizations(:default)
    @user = users(:admin)
    @staff = users(:staff)
    @group1 = groups(:nagareyama)
    @group2 = groups(:shinmatsudo)
    @group3 = groups(:kashiwa)
  end

  # === Index Action ===

  test "should get index" do
    get api_groups_url, headers: auth_headers(@user)
    assert_response :success

    json = JSON.parse(response.body)
    assert_kind_of Array, json
    assert json.any? { |g| g["name"] == "流山" }
  end

  test "should return groups ordered by position" do
    get api_groups_url, headers: auth_headers(@user)
    assert_response :success

    json = JSON.parse(response.body)
    positions = json.map { |g| g["position"] }.compact
    assert_equal positions, positions.sort, "Groups should be sorted by position"
  end

  test "should include position in response" do
    get api_groups_url, headers: auth_headers(@user)
    assert_response :success

    json = JSON.parse(response.body)
    group = json.find { |g| g["name"] == "流山" }
    assert_not_nil group["position"]
  end

  test "staff can get index" do
    get api_groups_url, headers: auth_headers(@staff)
    assert_response :success
  end

  test "should require authentication for index" do
    get api_groups_url
    assert_response :unauthorized
  end

  # === Reorder Action ===

  test "should reorder groups" do
    # Original order: nagareyama (1), shinmatsudo (2), kashiwa (3)
    # New order: kashiwa, shinmatsudo, nagareyama
    new_order = [ @group3.id, @group2.id, @group1.id ]

    patch reorder_api_groups_url,
      params: { group_ids: new_order },
      headers: auth_headers(@user),
      as: :json

    assert_response :success
    json = JSON.parse(response.body)
    assert json["success"]

    # Verify the new positions
    @group1.reload
    @group2.reload
    @group3.reload

    assert_equal 3, @group1.position
    assert_equal 2, @group2.position
    assert_equal 1, @group3.position
  end

  test "staff can reorder groups" do
    new_order = [ @group3.id, @group1.id, @group2.id ]

    patch reorder_api_groups_url,
      params: { group_ids: new_order },
      headers: auth_headers(@staff),
      as: :json

    assert_response :success
  end

  test "should return error for empty group_ids" do
    patch reorder_api_groups_url,
      params: { group_ids: [] },
      headers: auth_headers(@user),
      as: :json

    assert_response :bad_request
    json = JSON.parse(response.body)
    assert_includes json["error"], "group_ids"
  end

  test "should return error for missing group_ids" do
    patch reorder_api_groups_url,
      params: {},
      headers: auth_headers(@user),
      as: :json

    assert_response :bad_request
  end

  test "should return error for non-array group_ids" do
    patch reorder_api_groups_url,
      params: { group_ids: "not_an_array" },
      headers: auth_headers(@user),
      as: :json

    assert_response :bad_request
  end

  test "should ignore group_ids from other organizations" do
    # Create a group in another organization
    other_org = Organization.create!(name: "Other Org", subdomain: "other-org")
    other_group = Group.create!(name: "Other Group", organization: other_org, status: "active")

    original_position = @group1.position

    # Try to include the other org's group in the reorder
    patch reorder_api_groups_url,
      params: { group_ids: [ other_group.id, @group1.id, @group2.id ] },
      headers: auth_headers(@user),
      as: :json

    assert_response :success

    # Verify only own org's groups were affected
    other_group.reload
    assert_nil other_group.position, "Other org's group should not be affected"

    @group1.reload
    @group2.reload
    assert_equal 2, @group1.position
    assert_equal 3, @group2.position
  end

  test "should require authentication for reorder" do
    patch reorder_api_groups_url, params: { group_ids: [ @group1.id ] }
    assert_response :unauthorized
  end

  private

  def auth_headers(user)
    token = JwtService.encode(user_id: user.id)
    { "Authorization" => "Bearer #{token}" }
  end
end
