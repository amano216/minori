class Api::AuthController < ApplicationController
  skip_before_action :authenticate_request, only: [ :login ]

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
