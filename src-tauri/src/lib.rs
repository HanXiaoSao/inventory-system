// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rusqlite::Connection;
use std::fs;
use tauri::Manager;

// 获取数据库文件路径
fn get_db_path(app_handle: &tauri::AppHandle) -> std::path::PathBuf {
    let app_dir = app_handle.path().app_data_dir().unwrap();
    fs::create_dir_all(&app_dir).unwrap();
    app_dir.join("ledger.db")
}

// 读取数据
#[tauri::command]
fn load_data(app: tauri::AppHandle) -> Result<String, String> {
    let db_path = get_db_path(&app);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS app_state (
            id INTEGER PRIMARY KEY,
            json_content TEXT NOT NULL
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT json_content FROM app_state WHERE id = 1")
        .map_err(|e| e.to_string())?;
    let mut rows = stmt.query([]).map_err(|e| e.to_string())?;

    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let content: String = row.get(0).map_err(|e| e.to_string())?;
        Ok(content)
    } else {
        Ok("".to_string())
    }
}

// 保存数据
#[tauri::command]
fn save_data(app: tauri::AppHandle, json_content: String) -> Result<(), String> {
    let db_path = get_db_path(&app);
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS app_state (
            id INTEGER PRIMARY KEY,
            json_content TEXT NOT NULL
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "REPLACE INTO app_state (id, json_content) VALUES (1, ?1)",
        [&json_content],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

// 【新增】备份数据库
#[tauri::command]
fn backup_db(app: tauri::AppHandle, destination: String) -> Result<(), String> {
    let db_path = get_db_path(&app);
    std::fs::copy(db_path, destination)
        .map(|_| ())
        .map_err(|e| format!("备份失败: {}", e))
}

// 【新增】恢复数据库
#[tauri::command]
fn restore_db(app: tauri::AppHandle, source: String) -> Result<(), String> {
    let dest_path = get_db_path(&app);
    std::fs::copy(source, dest_path)
        .map(|_| ())
        .map_err(|e| format!("恢复失败: {}", e))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init()) // 【新增】注册对话框插件
        .invoke_handler(tauri::generate_handler![
            load_data, save_data, backup_db,  // 【新增】注册备份命令
            restore_db  // 【新增】注册恢复命令
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
