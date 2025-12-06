# frozen_string_literal: true

class AddCategoryToPatientTasks < ActiveRecord::Migration[8.1]
  def change
    # カテゴリ追加（board=掲示板, task=タスク）
    add_column :patient_tasks, :category, :string, default: "task", null: false

    # titleをNULL許容に変更（掲示板はタイトル不要）
    change_column_null :patient_tasks, :title, true

    # task_typeをNULL許容に変更（掲示板は種別不要）
    change_column_null :patient_tasks, :task_type, true

    # インデックス追加
    add_index :patient_tasks, :category
  end
end
