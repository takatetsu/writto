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

#[derive(serde::Serialize)]
struct ShortcutInfo {
    target_path: Option<String>,
    is_directory: bool,
}

#[cfg(windows)]
#[tauri::command]
fn resolve_shortcut(path: &str) -> ShortcutInfo {
    use std::path::Path;
    use std::ptr::null_mut;
    use windows::core::{Interface, HSTRING, PCWSTR};
    use windows::Win32::System::Com::{
        CoCreateInstance, CoInitializeEx, CoUninitialize, IPersistFile, CLSCTX_INPROC_SERVER,
        COINIT_APARTMENTTHREADED, STGM_READ,
    };
    use windows::Win32::UI::Shell::{IShellLinkW, ShellLink};

    unsafe {
        // Initialize COM
        let _ = CoInitializeEx(None, COINIT_APARTMENTTHREADED);

        let result = (|| -> Result<ShortcutInfo, windows::core::Error> {
            // Create ShellLink instance
            let shell_link: IShellLinkW = CoCreateInstance(&ShellLink, None, CLSCTX_INPROC_SERVER)?;

            // Get IPersistFile interface
            let persist_file: IPersistFile = shell_link.cast()?;

            // Load the shortcut file
            let wide_path = HSTRING::from(path);
            persist_file.Load(PCWSTR(wide_path.as_ptr()), STGM_READ)?;

            // Get target path
            let mut target_buffer = [0u16; 260];
            shell_link.GetPath(&mut target_buffer, null_mut(), 0)?;

            // Find null terminator
            let len = target_buffer
                .iter()
                .position(|&c| c == 0)
                .unwrap_or(target_buffer.len());
            let target_path = String::from_utf16_lossy(&target_buffer[..len]);

            if target_path.is_empty() {
                return Ok(ShortcutInfo {
                    target_path: None,
                    is_directory: false,
                });
            }

            let is_directory = Path::new(&target_path).is_dir();

            Ok(ShortcutInfo {
                target_path: Some(target_path),
                is_directory,
            })
        })();

        CoUninitialize();

        match result {
            Ok(info) => info,
            Err(_) => ShortcutInfo {
                target_path: None,
                is_directory: false,
            },
        }
    }
}

#[cfg(not(windows))]
#[tauri::command]
fn resolve_shortcut(_path: &str) -> ShortcutInfo {
    // Non-Windows platforms don't support .lnk files
    ShortcutInfo {
        target_path: None,
        is_directory: false,
    }
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
            resolve_shortcut
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
