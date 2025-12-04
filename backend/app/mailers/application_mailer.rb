class ApplicationMailer < ActionMailer::Base
  default from: -> { ENV.fetch("SMTP_FROM_ADDRESS", "noreply@minori.app") }
  layout "mailer"
end
