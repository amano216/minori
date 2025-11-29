# frozen_string_literal: true

# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

puts "\n=========================================="
puts "🌱 開発訪問看護ステーション株式会社 Seed Data"
puts "==========================================\n\n"

# ==========================================
# 組織の作成
# ==========================================
puts "📋 組織を作成中..."

dev_company = Organization.find_or_create_by!(subdomain: "dev-kaihatsu") do |org|
  org.name = "開発訪問看護ステーション株式会社"
  org.plan = "professional"
end

default_org = Organization.find_or_create_by!(subdomain: "default") do |org|
  org.name = "デフォルト組織"
  org.plan = "free"
end

puts "  ✅ #{dev_company.name} (サブドメイン: #{dev_company.subdomain})"
puts "  ✅ #{default_org.name} (サブドメイン: #{default_org.subdomain})\n\n"

# ==========================================
# スタッフ（ユーザー）の作成
# ==========================================
puts "👥 スタッフを作成中..."

users_data = [
  # 管理者
  {
    email: "admin@kaihatsu-nursing.jp",
    password: "password123",
    name: "管理者 太郎",
    role: User::ORGANIZATION_ADMIN,
    staff_status: "active",
    organization: dev_company
  },
  {
    email: "admin@example.com",
    password: "password123",
    name: "デフォルト管理者",
    role: User::ORGANIZATION_ADMIN,
    staff_status: "active",
    organization: default_org
  },

  # 看護師
  {
    email: "tanaka.hanako@kaihatsu-nursing.jp",
    password: "password123",
    name: "田中 花子",
    role: User::STAFF,
    staff_status: "active",
    organization: dev_company
  },
  {
    email: "suzuki.ichiro@kaihatsu-nursing.jp",
    password: "password123",
    name: "鈴木 一郎",
    role: User::STAFF,
    staff_status: "active",
    organization: dev_company
  },
  {
    email: "staff@example.com",
    password: "password123",
    name: "デフォルトスタッフ",
    role: User::STAFF,
    staff_status: "active",
    organization: default_org
  },

  # 理学療法士
  {
    email: "yamada.kenji@kaihatsu-nursing.jp",
    password: "password123",
    name: "山田 健二",
    role: User::STAFF,
    staff_status: "active",
    organization: dev_company
  },
  {
    email: "sato.yuki@kaihatsu-nursing.jp",
    password: "password123",
    name: "佐藤 優希",
    role: User::STAFF,
    staff_status: "active",
    organization: dev_company
  },

  # 作業療法士
  {
    email: "kobayashi.mari@kaihatsu-nursing.jp",
    password: "password123",
    name: "小林 真理",
    role: User::STAFF,
    staff_status: "active",
    organization: dev_company
  },

  # 休職中のスタッフ
  {
    email: "takahashi.jun@kaihatsu-nursing.jp",
    password: "password123",
    name: "高橋 純",
    role: User::STAFF,
    staff_status: "on_leave",
    organization: dev_company
  }
]

created_users = []
users_data.each do |user_data|
  user = User.find_or_initialize_by(email: user_data[:email])

  if user.new_record?
    user.assign_attributes(user_data.except(:organization))
    user.organization = user_data[:organization]
    user.email_confirmed_at = Time.current
    user.save!
    created_users << user
    puts "  ✅ #{user.name} (#{user.email}) - #{user.role}"
  else
    user.update!(
      role: user_data[:role],
      organization: user_data[:organization],
      staff_status: user_data[:staff_status],
      email_confirmed_at: user.email_confirmed_at || Time.current
    )
    created_users << user
    puts "  ♻️  #{user.name} (#{user.email}) - 更新"
  end

  # 組織メンバーシップの作成
  OrganizationMembership.find_or_create_by!(
    user: user,
    organization: user_data[:organization]
  )
end

puts "\n"

# ==========================================
# 患者データの作成
# ==========================================
puts "🏥 患者データを作成中..."

patients_data = [
  # 開発訪問看護ステーション株式会社の患者
  {
    name: "山田 太郎",
    address: "東京都渋谷区神宮前1-2-3 サンライズマンション101",
    phone_numbers: [ { "number" => "03-1234-5678", "label" => "自宅" } ],
    care_requirements: %w[nursing_care vital_check medication_management],
    notes: "79歳男性。週3回の訪問が必要。高血圧、糖尿病の管理。",
    status: "active",
    organization: dev_company
  },
  {
    name: "佐藤 花子",
    address: "東京都新宿区歌舞伎町2-4-5 グリーンハイツ202",
    phone_numbers: [ { "number" => "03-2345-6789", "label" => "自宅" } ],
    care_requirements: %w[rehabilitation bathing_assistance],
    notes: "脳梗塞後のリハビリ重点。週2回の訪問。",
    status: "active",
    organization: dev_company
  },
  {
    name: "鈴木 一郎",
    address: "東京都世田谷区三軒茶屋3-7-8 パークサイド303",
    phone_numbers: [ { "number" => "03-3456-7890", "label" => "自宅" } ],
    care_requirements: %w[wound_care nursing_care],
    notes: "褥瘡の処置が必要。週4回訪問。",
    status: "active",
    organization: dev_company
  },
  {
    name: "高橋 美咲",
    address: "東京都品川区大崎4-10-12 リバーサイドコート404",
    phone_numbers: [ { "number" => "03-4567-8901", "label" => "自宅" } ],
    care_requirements: %w[nursing_care medication_management vital_check],
    notes: "心不全の管理。毎日の訪問が必要。",
    status: "active",
    organization: dev_company
  },
  {
    name: "田中 健太",
    address: "東京都目黒区自由が丘1-15-20 メゾン自由505",
    phone_numbers: [ { "number" => "03-5678-9012", "label" => "自宅" } ],
    care_requirements: %w[rehabilitation bathing_assistance meal_assistance],
    notes: "パーキンソン病。週3回のリハビリと入浴介助。",
    status: "active",
    organization: dev_company
  },
  {
    name: "伊藤 幸子",
    address: "東京都杉並区荻窪5-22-33 ハイムきぼう606",
    phone_numbers: [ { "number" => "03-6789-0123", "label" => "自宅" } ],
    care_requirements: %w[nursing_care wound_care vital_check],
    notes: "糖尿病性足潰瘍の処置。週3回訪問。",
    status: "active",
    organization: dev_company
  },
  {
    name: "渡辺 正男",
    address: "東京都中野区中野6-25-40 サニーコート707",
    phone_numbers: [ { "number" => "03-7890-1234", "label" => "自宅" } ],
    care_requirements: %w[rehabilitation nursing_care],
    notes: "大腿骨骨折後のリハビリ。週2回の訪問。",
    status: "active",
    organization: dev_company
  },
  {
    name: "小林 京子",
    address: "東京都豊島区池袋2-30-45 グランドメゾン808",
    phone_numbers: [ { "number" => "03-8901-2345", "label" => "自宅" } ],
    care_requirements: %w[medication_management vital_check nursing_care],
    notes: "認知症。服薬管理が必要。週4回訪問。",
    status: "active",
    organization: dev_company
  },
  {
    name: "加藤 博",
    address: "東京都北区赤羽3-35-50 レジデンス赤羽909",
    phone_numbers: [ { "number" => "03-9012-3456", "label" => "自宅" } ],
    care_requirements: %w[nursing_care bathing_assistance],
    notes: "COPD（慢性閉塞性肺疾患）。週2回の訪問。",
    status: "active",
    organization: dev_company
  },
  {
    name: "木村 和子",
    address: "東京都足立区北千住4-40-55 ライフコート1010",
    phone_numbers: [ { "number" => "03-0123-4567", "label" => "自宅" } ],
    care_requirements: %w[rehabilitation meal_assistance],
    notes: "脳梗塞後遺症。嚥下訓練と食事介助。週3回訪問。",
    status: "active",
    organization: dev_company
  },
  {
    name: "中村 勇",
    address: "東京都葛飾区亀有5-45-60 グリーンハウス1101",
    phone_numbers: [ { "number" => "03-1234-6789", "label" => "自宅" } ],
    care_requirements: %w[nursing_care wound_care medication_management],
    notes: "透析患者。シャント管理。週3回訪問。",
    status: "active",
    organization: dev_company
  },
  {
    name: "松本 春江",
    address: "東京都江戸川区小岩6-50-65 メープルタワー1202",
    phone_numbers: [ { "number" => "03-2345-7890", "label" => "自宅" } ],
    care_requirements: %w[bathing_assistance nursing_care vital_check],
    notes: "リウマチ。入浴介助と疼痛管理。週2回訪問。",
    status: "active",
    organization: dev_company
  },
  {
    name: "石井 光男",
    address: "東京都板橋区高島平7-55-70 ハイライフ1303",
    phone_numbers: [ { "number" => "03-3456-8901", "label" => "自宅" } ],
    care_requirements: %w[rehabilitation nursing_care],
    notes: "脊柱管狭窄症術後。リハビリ継続中。週2回訪問。",
    status: "active",
    organization: dev_company
  },
  {
    name: "森 千代子",
    address: "東京都練馬区大泉学園8-60-75 パークレジデンス1404",
    phone_numbers: [ { "number" => "03-4567-9012", "label" => "自宅" } ],
    care_requirements: %w[medication_management vital_check nursing_care],
    notes: "うつ病と高血圧。服薬管理と見守り。週3回訪問。",
    status: "active",
    organization: dev_company
  },
  {
    name: "吉田 清",
    address: "東京都大田区蒲田9-65-80 サンシャインビル1505",
    phone_numbers: [ { "number" => "03-5678-0123", "label" => "自宅" } ],
    care_requirements: %w[nursing_care bathing_assistance meal_assistance],
    notes: "ALS（筋萎縮性側索硬化症）。全介助。週5回訪問。",
    status: "active",
    organization: dev_company
  },

  # デフォルト組織の患者（後方互換性のため）
  {
    name: "デフォルト患者A",
    address: "東京都千代田区1-1-1",
    phone_numbers: [ { "number" => "03-0000-0001", "label" => "自宅" } ],
    care_requirements: %w[nursing_care],
    notes: "テスト用患者",
    status: "active",
    organization: default_org
  },
  {
    name: "デフォルト患者B",
    address: "東京都港区2-2-2",
    phone_numbers: [ { "number" => "03-0000-0002", "label" => "自宅" } ],
    care_requirements: %w[rehabilitation],
    notes: "テスト用患者",
    status: "active",
    organization: default_org
  },
  {
    name: "デフォルト患者C",
    address: "東京都中央区3-3-3",
    phone_numbers: [ { "number" => "03-0000-0003", "label" => "自宅" } ],
    care_requirements: %w[bathing_assistance],
    notes: "テスト用患者",
    status: "inactive",
    organization: default_org
  }
]

created_patients = []
patients_data.each do |patient_data|
  patient = Patient.find_or_initialize_by(
    name: patient_data[:name],
    organization: patient_data[:organization]
  )

  if patient.new_record?
    patient.assign_attributes(patient_data)
    patient.save!
    created_patients << patient
    puts "  ✅ #{patient.name} (#{patient.organization.name})"
  else
    patient.update!(patient_data.except(:organization))
    created_patients << patient
    puts "  ♻️  #{patient.name} - 更新"
  end
end

puts "\n"

# ==========================================
# 訪問スケジュールの作成
# ==========================================
puts "📅 訪問スケジュールを作成中..."

# 開発会社のスタッフと患者のみを使用
dev_staff = created_users.select { |u| u.organization == dev_company && u.role == User::STAFF && u.staff_status == "active" }
dev_patients = created_patients.select { |p| p.organization == dev_company && p.status == "active" }

visit_count = 0

# 過去2週間の訪問履歴（完了済み）
(-14..-1).each do |days_ago|
  date = Date.today + days_ago
  next if date.saturday? || date.sunday? # 週末はスキップ

  # 1日あたり8-12件の訪問
  rand(8..12).times do
    staff = dev_staff.sample
    patient = dev_patients.sample

    # 9:00-17:00の間でランダムな時間
    hour = rand(9..16)
    minute = [ 0, 30 ].sample
    scheduled_time = Time.zone.local(date.year, date.month, date.day, hour, minute)

    # 訪問時間は30分、60分、90分のいずれか
    duration = [ 30, 60, 90 ].sample

    visit = Visit.find_or_initialize_by(
      patient: patient,
      scheduled_at: scheduled_time,
      organization: dev_company
    )

    next if visit.persisted? # 既に存在する場合はスキップ

    visit.assign_attributes(
      user: staff,
      duration: duration,
      status: "completed",
      notes: "訪問完了。バイタル測定、服薬確認実施。",
    )

    if visit.save
      visit_count += 1
      print "."
    end
  end
end

puts "\n  ✅ 過去の訪問履歴: #{visit_count}件\n"

# 今週・来週の訪問予定
future_visit_count = 0
(0..14).each do |days_ahead|
  date = Date.today + days_ahead
  next if date.saturday? || date.sunday?

  # 1日あたり10-15件の訪問予定
  rand(10..15).times do
    staff = dev_staff.sample
    patient = dev_patients.sample

    hour = rand(9..16)
    minute = [ 0, 30 ].sample
    scheduled_time = Time.zone.local(date.year, date.month, date.day, hour, minute)

    duration = [ 30, 60, 90 ].sample

    visit = Visit.find_or_initialize_by(
      patient: patient,
      scheduled_at: scheduled_time,
      organization: dev_company
    )

    next if visit.persisted?

    # 未来の訪問はscheduled、一部はin_progress
    status = if date == Date.today && hour <= Time.current.hour
               "in_progress"
    else
               "scheduled"
    end

    visit.assign_attributes(
      user: staff,
      duration: duration,
      status: status,
      notes: "定期訪問予定",
    )

    if visit.save
      future_visit_count += 1
      print "."
    end
  end
end

puts "\n  ✅ 今後の訪問予定: #{future_visit_count}件\n"

# 未割り当て訪問（スタッフが決まっていない）
unassigned_count = 0
(1..7).each do |days_ahead|
  date = Date.today + days_ahead
  next if date.saturday? || date.sunday?

  rand(2..4).times do
    patient = dev_patients.sample

    hour = rand(9..16)
    minute = [ 0, 30 ].sample
    scheduled_time = Time.zone.local(date.year, date.month, date.day, hour, minute)

    visit = Visit.find_or_initialize_by(
      patient: patient,
      scheduled_at: scheduled_time,
      organization: dev_company,
      user: nil
    )

    next if visit.persisted?

    visit.assign_attributes(
      duration: 60,
      status: "unassigned",
      notes: "スタッフ割り当て待ち",
    )

    if visit.save
      unassigned_count += 1
      print "."
    end
  end
end

puts "\n  ✅ 未割り当て訪問: #{unassigned_count}件\n"

puts "\n=========================================="
puts "✨ Seed データの作成が完了しました！"
puts "==========================================\n"
puts "📊 作成されたデータ:"
puts "  - 組織: #{Organization.count}件"
puts "  - ユーザー: #{User.count}件"
puts "  - 患者: #{Patient.count}件"
puts "  - 訪問スケジュール: #{Visit.count}件"
puts "\n🔐 ログイン情報:"
puts "  Email: admin@kaihatsu-nursing.jp"
puts "  Password: password123"
puts "\n  または"
puts "\n  Email: admin@example.com"
puts "  Password: password123"
puts "==========================================\n\n"
