class Api::AuthController < ApplicationController
  skip_before_action :authenticate_request, only: [ :login, :signup ]

  def signup
    ActiveRecord::Base.transaction do
      # Create organization
      organization = Organization.create!(
        name: params[:organization_name],
        subdomain: params[:subdomain]
      )

      # Create admin user
      user = User.create!(
        email: params[:email]&.downcase,
        password: params[:password],
        password_confirmation: params[:password_confirmation],
        role: "admin",
        organization: organization
      )

      # Create organization membership
      OrganizationMembership.create!(
        user: user,
        organization: organization
      )

      # Create admin role for the user
      admin_role = Role.find_or_create_by!(
        name: Role::ORGANIZATION_ADMIN,
        organization: organization
      ) do |role|
        role.description = "Organization Administrator"
      end

      UserRole.create!(
        user: user,
        role: admin_role,
        organization: organization
      )

      # Generate JWT token
      token = JwtService.encode(user_id: user.id)

      render json: {
        token: token,
        user: user_response(user),
        organization: {
          id: organization.id,
          name: organization.name,
          subdomain: organization.subdomain
        }
      }, status: :created
    end
  rescue ActiveRecord::RecordInvalid => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def login
    user = User.find_by(email: params[:email]&.downcase)

    if user&.authenticate(params[:password])
      token = JwtService.encode(user_id: user.id)
      render json: {
        token: token,
        user: user_response(user)
      }
    else
      render json: { error: "Invalid email or password" }, status: :unauthorized
    end
  end

  def me
    render json: { user: user_response(current_user) }
  end

  def logout
    head :no_content
  end

  private

  def user_response(user)
    {
      id: user.id,
      email: user.email,
      role: user.role
    }
  end
end
