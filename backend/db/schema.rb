# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2025_11_26_133338) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "group_memberships", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "group_id", null: false
    t.integer "role", default: 0
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["group_id", "user_id"], name: "index_group_memberships_on_group_id_and_user_id", unique: true
    t.index ["group_id"], name: "index_group_memberships_on_group_id"
    t.index ["user_id"], name: "index_group_memberships_on_user_id"
  end

  create_table "groups", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.integer "group_type", default: 0
    t.string "name", null: false
    t.bigint "organization_id", null: false
    t.bigint "parent_id"
    t.datetime "updated_at", null: false
    t.index ["organization_id"], name: "index_groups_on_organization_id"
    t.index ["parent_id"], name: "index_groups_on_parent_id"
  end

  create_table "organization_memberships", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "organization_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["organization_id"], name: "index_organization_memberships_on_organization_id"
    t.index ["user_id", "organization_id"], name: "index_organization_memberships_on_user_id_and_organization_id", unique: true
    t.index ["user_id"], name: "index_organization_memberships_on_user_id"
  end

  create_table "organizations", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.string "plan", default: "free"
    t.jsonb "settings", default: {}
    t.string "subdomain", null: false
    t.datetime "updated_at", null: false
    t.index ["subdomain"], name: "index_organizations_on_subdomain", unique: true
  end

  create_table "patients", force: :cascade do |t|
    t.string "address"
    t.jsonb "care_requirements", default: []
    t.datetime "created_at", null: false
    t.bigint "group_id"
    t.string "name", null: false
    t.text "notes"
    t.bigint "organization_id"
    t.string "phone"
    t.string "status", default: "active", null: false
    t.datetime "updated_at", null: false
    t.index ["group_id"], name: "index_patients_on_group_id"
    t.index ["organization_id"], name: "index_patients_on_organization_id"
    t.index ["status"], name: "index_patients_on_status"
  end

  create_table "planning_lanes", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "group_id"
    t.string "name"
    t.bigint "organization_id", null: false
    t.integer "position"
    t.datetime "updated_at", null: false
    t.index ["group_id"], name: "index_planning_lanes_on_group_id"
    t.index ["organization_id"], name: "index_planning_lanes_on_organization_id"
  end

  create_table "users", force: :cascade do |t|
    t.jsonb "available_hours", default: {}
    t.string "confirmation_token"
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.datetime "email_confirmed_at"
    t.bigint "group_id"
    t.datetime "last_otp_at"
    t.string "name"
    t.bigint "organization_id"
    t.boolean "otp_enabled", default: false
    t.string "otp_secret"
    t.string "password_digest", null: false
    t.jsonb "qualifications", default: []
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.string "role", default: "staff", null: false
    t.string "staff_status", default: "active"
    t.datetime "updated_at", null: false
    t.index ["confirmation_token"], name: "index_users_on_confirmation_token"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["group_id"], name: "index_users_on_group_id"
    t.index ["organization_id"], name: "index_users_on_organization_id"
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token"
    t.index ["staff_status"], name: "index_users_on_staff_status"
  end

  create_table "visits", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "duration", default: 60, null: false
    t.integer "lock_version", default: 0, null: false
    t.text "notes"
    t.bigint "organization_id"
    t.bigint "patient_id", null: false
    t.bigint "planning_lane_id"
    t.datetime "scheduled_at", null: false
    t.string "status", default: "scheduled", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["organization_id"], name: "index_visits_on_organization_id"
    t.index ["patient_id"], name: "index_visits_on_patient_id"
    t.index ["planning_lane_id"], name: "index_visits_on_planning_lane_id"
    t.index ["scheduled_at"], name: "index_visits_on_scheduled_at"
    t.index ["status"], name: "index_visits_on_status"
    t.index ["user_id", "scheduled_at"], name: "index_visits_on_user_id_and_scheduled_at"
    t.index ["user_id"], name: "index_visits_on_user_id"
  end

  add_foreign_key "group_memberships", "groups"
  add_foreign_key "group_memberships", "users"
  add_foreign_key "groups", "groups", column: "parent_id"
  add_foreign_key "groups", "organizations"
  add_foreign_key "organization_memberships", "organizations"
  add_foreign_key "organization_memberships", "users"
  add_foreign_key "patients", "groups"
  add_foreign_key "patients", "organizations"
  add_foreign_key "planning_lanes", "groups"
  add_foreign_key "planning_lanes", "organizations"
  add_foreign_key "users", "groups"
  add_foreign_key "users", "organizations"
  add_foreign_key "visits", "organizations"
  add_foreign_key "visits", "patients"
  add_foreign_key "visits", "planning_lanes"
  add_foreign_key "visits", "users"
end
