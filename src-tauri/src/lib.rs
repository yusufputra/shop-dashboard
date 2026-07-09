use std::net::TcpStream;
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::thread;
use std::time::{Duration, Instant};

use tauri::{Manager, RunEvent, WebviewUrl, WebviewWindowBuilder};

const LOCAL_PORT: u16 = 3721;

struct NextServer(Mutex<Option<Child>>);

fn wait_for_port(port: u16, timeout: Duration) -> bool {
    let deadline = Instant::now() + timeout;

    while Instant::now() < deadline {
        if TcpStream::connect(("127.0.0.1", port)).is_ok() {
            return true;
        }
        thread::sleep(Duration::from_millis(200));
    }

    false
}

fn resolve_app_root(app: &tauri::App) -> PathBuf {
    if cfg!(debug_assertions) {
        return std::env::current_dir().expect("failed to resolve project root");
    }

    app.path()
        .resource_dir()
        .expect("failed to resolve bundled resource directory")
}

fn resolve_remote_url() -> Option<String> {
    std::env::var("SHOP_DASHBOARD_REMOTE_URL")
        .ok()
        .filter(|value| !value.trim().is_empty())
}

fn start_next_server(app_root: &PathBuf) -> Result<Child, String> {
    let script = app_root.join("scripts").join("tauri-start-next.mjs");

    if !script.exists() {
        return Err(format!(
            "Next.js start script not found at {}",
            script.display()
        ));
    }

    let child = Command::new("node")
        .arg(script)
        .env("PORT", LOCAL_PORT.to_string())
        .env("TAURI_APP_ROOT", app_root)
        .current_dir(app_root)
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|error| {
            format!(
                "failed to start Next.js server (is Node.js installed?): {error}"
            )
        })?;

    Ok(child)
}

fn create_main_window(app: &tauri::App, url: &str) -> tauri::Result<()> {
    if app.get_webview_window("main").is_some() {
        return Ok(());
    }

    WebviewWindowBuilder::new(app, "main", WebviewUrl::External(url.parse().unwrap()))
        .title("Shop Dashboard")
        .inner_size(1280.0, 800.0)
        .min_inner_size(1024.0, 600.0)
        .build()?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if let Some(remote_url) = resolve_remote_url() {
                create_main_window(app, remote_url.trim())?;
                return Ok(());
            }

            #[cfg(dev)]
            {
                create_main_window(app, "http://localhost:3000")?;
                return Ok(());
            }

            #[cfg(not(dev))]
            {
                let app_root = resolve_app_root(app);
                let child = start_next_server(&app_root)?;
                app.manage(NextServer(Mutex::new(Some(child))));

                let local_url = format!("http://127.0.0.1:{LOCAL_PORT}");
                if !wait_for_port(LOCAL_PORT, Duration::from_secs(60)) {
                    return Err(format!(
                        "Next.js server did not start on {local_url} within 60 seconds"
                    )
                    .into());
                }

                create_main_window(app, &local_url)?;
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let RunEvent::Exit = event {
                if let Some(state) = app_handle.try_state::<NextServer>() {
                    if let Ok(mut guard) = state.0.lock() {
                        if let Some(mut child) = guard.take() {
                            let _ = child.kill();
                        }
                    }
                }
            }
        });
}
