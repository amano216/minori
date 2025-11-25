namespace :email do
  desc "Test email sending configuration"
  task test: :environment do
    email = ENV["TEST_EMAIL"] || "test@example.com"
    
    puts "Testing email configuration..."
    puts "Delivery method: #{ActionMailer::Base.delivery_method}"
    
    if ActionMailer::Base.delivery_method == :smtp
      settings = ActionMailer::Base.smtp_settings
      puts "SMTP Address: #{settings[:address]}"
      puts "SMTP Port: #{settings[:port]}"
      puts "SMTP Username: #{settings[:user_name]}"
      puts "SMTP Domain: #{settings[:domain]}"
    end
    
    puts "\nSending test email to: #{email}"
    
    begin
      # Create a test user
      user = User.new(
        email: email,
        password: "test1234",
        role: "admin"
      )
      user.save(validate: false)
      
      # Send confirmation email
      UserMailer.confirmation_email(user).deliver_now
      
      puts "✅ Email sent successfully!"
      puts "Check your inbox at: #{email}"
      
      # Cleanup
      user.destroy
    rescue => e
      puts "❌ Error sending email: #{e.message}"
      puts e.backtrace.first(5).join("\n")
    end
  end
  
  desc "Test OTP email"
  task test_otp: :environment do
    email = ENV["TEST_EMAIL"] || "test@example.com"
    otp_code = "123456"
    
    puts "Testing OTP email..."
    puts "Sending to: #{email}"
    
    begin
      user = User.new(
        email: email,
        password: "test1234",
        role: "admin"
      )
      user.save(validate: false)
      
      UserMailer.otp_email(user, otp_code).deliver_now
      
      puts "✅ OTP email sent successfully!"
      puts "OTP Code: #{otp_code}"
      
      user.destroy
    rescue => e
      puts "❌ Error: #{e.message}"
    end
  end
  
  desc "Test password reset email"
  task test_reset: :environment do
    email = ENV["TEST_EMAIL"] || "test@example.com"
    
    puts "Testing password reset email..."
    puts "Sending to: #{email}"
    
    begin
      user = User.new(
        email: email,
        password: "test1234",
        role: "admin"
      )
      user.save(validate: false)
      user.generate_reset_password_token!
      
      UserMailer.reset_password_email(user).deliver_now
      
      puts "✅ Password reset email sent successfully!"
      
      user.destroy
    rescue => e
      puts "❌ Error: #{e.message}"
    end
  end
end
