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

ActiveRecord::Schema[8.1].define(version: 2025_11_23_212057) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "patients", force: :cascade do |t|
    t.string "address"
    t.jsonb "care_requirements", default: []
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.text "notes"
    t.string "phone"
    t.string "status", default: "active", null: false
    t.datetime "updated_at", null: false
    t.index ["status"], name: "index_patients_on_status"
  end

  create_table "staffs", force: :cascade do |t|
    t.jsonb "available_hours", default: {}
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "name", null: false
    t.jsonb "qualifications", default: []
    t.string "status", default: "active"
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_staffs_on_email", unique: true
    t.index ["status"], name: "index_staffs_on_status"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "password_digest", null: false
    t.string "role", default: "staff", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  create_table "visits", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "duration", default: 60, null: false
    t.text "notes"
    t.bigint "patient_id", null: false
    t.datetime "scheduled_at", null: false
    t.bigint "staff_id"
    t.string "status", default: "scheduled", null: false
    t.datetime "updated_at", null: false
    t.index ["patient_id"], name: "index_visits_on_patient_id"
    t.index ["scheduled_at"], name: "index_visits_on_scheduled_at"
    t.index ["staff_id", "scheduled_at"], name: "index_visits_on_staff_id_and_scheduled_at"
    t.index ["staff_id"], name: "index_visits_on_staff_id"
    t.index ["status"], name: "index_visits_on_status"
  end

  add_foreign_key "visits", "patients"
  add_foreign_key "visits", "staffs"
end
