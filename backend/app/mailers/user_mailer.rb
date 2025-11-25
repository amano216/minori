class UserMailer < ApplicationMailer
  default from: "noreply@minori.app"

  def confirmation_email(user)
    @user = user
    @confirmation_url = "#{ENV['FRONTEND_URL']}/confirm-email?token=#{user.confirmation_token}"

    mail(
      to: user.email,
      subject: "メールアドレスの確認 - Minori"
    )
  end

  def reset_password_email(user)
    @user = user
    @reset_url = "#{ENV['FRONTEND_URL']}/reset-password?token=#{user.reset_password_token}"

    mail(
      to: user.email,
      subject: "パスワードリセットのご案内 - Minori"
    )
  end

  def otp_email(user, otp_code)
    @user = user
    @otp_code = otp_code

    mail(
      to: user.email,
      subject: "ログイン認証コード - Minori"
    )
  end
end
