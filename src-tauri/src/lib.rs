// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::env;
use tauri::{Emitter, Manager};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

use font_kit::source::SystemSource;

#[tauri::command]
fn get_system_fonts() -> Vec<String> {
    let source = SystemSource::new();
    let fonts = source.all_families().unwrap_or_default();
    fonts
}

#[tauri::command]
fn get_cli_file_path() -> Option<String> {
    let args: Vec<String> = env::args().collect();
    // First argument is the executable, second is the file path
    if args.len() > 1 {
        let path = &args[1];
        // Check if it's a file path (not a flag)
        if !path.starts_with('-') && (path.ends_with(".md") || path.ends_with(".markdown")) {
            return Some(path.clone());
        }
    }
    None
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_system_fonts,
            get_cli_file_path
        ])
        .setup(|app| {
            // Get command line arguments
            let args: Vec<String> = env::args().collect();
            if args.len() > 1 {
                let path = &args[1];
                if !path.starts_with('-') && (path.ends_with(".md") || path.ends_with(".markdown"))
                {
                    // Store the file path in app state or emit event after window is ready
                    let path_clone = path.clone();
                    let window = app.get_webview_window("main").unwrap();
                    // Emit event to frontend after a short delay to ensure app is ready
                    std::thread::spawn(move || {
                        std::thread::sleep(std::time::Duration::from_millis(500));
                        let _ = window.emit("open-file", path_clone);
                    });
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
