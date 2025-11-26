class Api::AuthController < ApplicationController
  skip_before_action :authenticate_request, only: [
    :login, :signup, :confirm_email, :resend_confirmation,
    :forgot_password, :reset_password, :verify_otp
  ]

  def signup
    ActiveRecord::Base.transaction do
      # Create organization
      # If subdomain is blank, set it to nil to avoid uniqueness constraint issues
      subdomain = params[:subdomain].presence

      # If subdomain is provided and already exists, make it unique
      if subdomain && Organization.exists?(subdomain: subdomain)
        base_subdomain = subdomain
        counter = 1
        while Organization.exists?(subdomain: subdomain)
          subdomain = "#{base_subdomain}-#{counter}"
          counter += 1
        end
      end

      organization = Organization.create!(
        name: params[:organization_name],
        subdomain: subdomain
      )

      # Create admin user
      user = User.create!(
        email: params[:email]&.downcase,
        password: params[:password],
        password_confirmation: params[:password_confirmation],
        role: User::ORGANIZATION_ADMIN,
        organization: organization
      )

      # Create organization membership
      OrganizationMembership.create!(
        user: user,
        organization: organization
      )

      # Create admin role for the user
      admin_role = Role.find_or_create_by!(name: Role::ORGANIZATION_ADMIN) do |role|
        role.description = "Organization Administrator"
      end

      UserRole.create!(
        user: user,
        role: admin_role,
        organization: organization
      )

      # Send confirmation email
      UserMailer.confirmation_email(user).deliver_later

      # For development: auto-confirm and return token
      if Rails.env.development? && ENV["AUTO_CONFIRM_EMAIL"] == "true"
        user.confirm_email!
        token = JwtService.encode(user_id: user.id)
        render json: {
          token: token,
          user: user_response(user),
          organization: {
            id: organization.id,
            name: organization.name,
            subdomain: organization.subdomain
          },
          message: "アカウントを作成しました（開発モード: メール確認をスキップ）"
        }, status: :created
      else
        render json: {
          message: "アカウントを作成しました。メールアドレスに確認メールを送信しました。",
          email: user.email,
          requires_confirmation: true
        }, status: :created
      end
    end
  rescue ActiveRecord::RecordInvalid => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def login
    user = User.find_by(email: params[:email]&.downcase)

    unless user&.authenticate(params[:password])
      render json: { error: "Invalid email or password" }, status: :unauthorized
      return
    end

    # Check email confirmation
    unless user.email_confirmed?
      render json: {
        error: "メールアドレスが未確認です",
        requires_confirmation: true,
        email: user.email
      }, status: :forbidden
      return
    end

    # Check if OTP is required (1日1回)
    # Skip 2FA in development if AUTO_CONFIRM_EMAIL is enabled
    skip_2fa = Rails.env.development? && ENV["AUTO_CONFIRM_EMAIL"] == "true"

    if !skip_2fa && user.otp_required?
      # Generate and send OTP
      otp_code = user.generate_otp
      user.save_otp(otp_code)
      UserMailer.otp_email(user, otp_code).deliver_later

      render json: {
        requires_otp: true,
        message: "認証コードをメールで送信しました",
        email: user.email
      }
    else
      # OTP not required, login directly
      token = JwtService.encode(user_id: user.id)
      render json: {
        token: token,
        user: user_response(user)
      }
    end
  end

  def me
    render json: { user: user_response(current_user) }
  end

  def logout
    head :no_content
  end

  # Email confirmation
  def confirm_email
    user = User.find_by(confirmation_token: params[:token])

    if user&.confirm_email!
      token = JwtService.encode(user_id: user.id)
      render json: {
        token: token,
        user: user_response(user),
        message: "メールアドレスを確認しました"
      }
    else
      render json: { error: "無効な確認トークンです" }, status: :unprocessable_entity
    end
  end

  def resend_confirmation
    user = User.find_by(email: params[:email]&.downcase)

    if user && !user.email_confirmed?
      user.generate_confirmation_token!
      UserMailer.confirmation_email(user).deliver_later
      render json: { message: "確認メールを再送信しました" }
    else
      render json: { error: "ユーザーが見つからないか、既に確認済みです" }, status: :unprocessable_entity
    end
  end

  # Password reset
  def forgot_password
    user = User.find_by(email: params[:email]&.downcase)

    if user
      user.generate_reset_password_token!
      UserMailer.reset_password_email(user).deliver_later
    end

    # Always return success to prevent email enumeration
    render json: { message: "パスワードリセットの案内をメールで送信しました" }
  end

  def reset_password
    user = User.find_by(reset_password_token: params[:token])

    if user && user.reset_password_token_valid?
      if user.reset_password!(params[:password])
        render json: { message: "パスワードをリセットしました" }
      else
        render json: { error: user.errors.full_messages }, status: :unprocessable_entity
      end
    else
      render json: { error: "無効または期限切れのトークンです" }, status: :unprocessable_entity
    end
  end

  # OTP verification
  def verify_otp
    user = User.find_by(email: params[:email]&.downcase)

    if user && user.verify_otp(params[:otp_code])
      user.mark_otp_verified!
      token = JwtService.encode(user_id: user.id)
      render json: {
        token: token,
        user: user_response(user)
      }
    else
      render json: { error: "認証コードが無効です" }, status: :unauthorized
    end
  end

  # Enable/Disable 2FA
  def toggle_2fa
    current_user.update(otp_enabled: !current_user.otp_enabled)
    render json: {
      otp_enabled: current_user.otp_enabled,
      message: current_user.otp_enabled ? "2要素認証を有効にしました" : "2要素認証を無効にしました"
    }
  end

  private

  def user_response(user)
    {
      id: user.id,
      email: user.email,
      role: user.role,
      email_confirmed: user.email_confirmed?,
      otp_enabled: user.otp_enabled
    }
  end
end
