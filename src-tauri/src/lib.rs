use std::path::Path;
use std::process::Command;
use std::fs;
use std::io::Write;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct ProcessResult {
    success: bool,
    message: String,
    error: Option<String>,
    file_path: Option<String>,
}

// 消息翻译函数
fn get_message(key: &str, language: &str, filename: Option<&str>) -> String {
    match (key, language) {
        ("file_not_found", "zh") => format!("文件不存在: {}", filename.unwrap_or("")),
        ("file_not_found", _) => format!("File not found: {}", filename.unwrap_or("")),
        ("file_not_found_error", "zh") => "文件不存在".to_string(),
        ("file_not_found_error", _) => "File not found".to_string(),
        ("process_success", "zh") => format!("成功处理文件: {}", filename.unwrap_or("")),
        ("process_success", _) => format!("Successfully processed file: {}", filename.unwrap_or("")),
        ("process_failed", "zh") => format!("处理文件失败: {}", filename.unwrap_or("")),
        ("process_failed", _) => format!("Failed to process file: {}", filename.unwrap_or("")),
        ("execute_failed", "zh") => format!("执行程序失败: {}", filename.unwrap_or("")),
        ("execute_failed", _) => format!("Failed to execute program: {}", filename.unwrap_or("")),
        ("unknown_tool", "zh") => "未知的工具名称".to_string(),
        ("unknown_tool", _) => "Unknown tool name".to_string(),
        ("unable_open_directory", "zh") => "无法打开目录".to_string(),
        ("unable_open_directory", _) => "Unable to open directory".to_string(),
        ("unable_create_temp_file", "zh") => "无法创建临时可执行文件".to_string(),
        ("unable_create_temp_file", _) => "Unable to create temporary executable file".to_string(),
        ("unable_write_file_data", "zh") => "无法写入可执行文件数据".to_string(),
        ("unable_write_file_data", _) => "Unable to write executable file data".to_string(),
        ("unable_get_permissions", "zh") => "无法获取文件权限".to_string(),
        ("unable_get_permissions", _) => "Unable to get file permissions".to_string(),
        ("unable_set_permissions", "zh") => "无法设置可执行权限".to_string(),
        ("unable_set_permissions", _) => "Unable to set executable permissions".to_string(),
        _ => key.to_string(),
    }
}

// 打开文件所在目录的命令
#[tauri::command]
async fn open_file_directory(file_path: String, language: Option<String>) -> Result<(), String> {
    let lang = language.as_deref().unwrap_or("en");
    let path = Path::new(&file_path);
    let dir_path = if path.is_file() {
        path.parent().unwrap_or(path)
    } else {
        path
    };
    
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(dir_path)
            .spawn()
            .map_err(|e| format!("{}: {}", get_message("unable_open_directory", lang, None), e))?;
    }
    
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(dir_path)
            .spawn()
            .map_err(|e| format!("{}: {}", get_message("unable_open_directory", lang, None), e))?;
    }
    
    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(dir_path)
            .spawn()
            .map_err(|e| format!("{}: {}", get_message("unable_open_directory", lang, None), e))?;
    }
    
    Ok(())
}

// 处理文件的命令
#[tauri::command]
async fn process_files(_app: tauri::AppHandle, tool_name: String, file_paths: Vec<String>, use_area_data: bool, std_sample_name: Option<String>, windows_optimization: Option<bool>, language: Option<String>) -> Result<Vec<ProcessResult>, String> {
    let lang = language.as_deref().unwrap_or("en");
    let mut results = Vec::new();
    
    // 获取嵌入的可执行文件数据
    let (exe_name, exe_data): (&str, &[u8]) = match tool_name.as_str() {
        "AneuFiler" => ("AneuFiler.exe", include_bytes!("../../AneuFiler.exe")),
        "Aneu23" => ("Aneu23.exe", include_bytes!("../../Aneu23.exe")),
        "SHCarrier" => ("SHCarrier.exe", include_bytes!("../../SHCarrier.exe")),
        _ => return Err(get_message("unknown_tool", lang, None)),
    };
    
    // 获取临时目录
    let temp_dir = std::env::temp_dir();
    let exe_path = temp_dir.join(format!("cmtools_{}", exe_name));
    
    // 如果临时文件不存在或大小不匹配，则重新写入
    let should_write = !exe_path.exists() || {
        fs::metadata(&exe_path)
            .map(|m| m.len() != exe_data.len() as u64)
            .unwrap_or(true)
    };
    
    if should_write {
        // 将嵌入的可执行文件写入临时目录
        let mut file = fs::File::create(&exe_path)
            .map_err(|e| format!("{}: {}", get_message("unable_create_temp_file", lang, None), e))?;
        file.write_all(exe_data)
            .map_err(|e| format!("{}: {}", get_message("unable_write_file_data", lang, None), e))?;
        
        // 在Windows上设置可执行权限（虽然通常不需要）
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let mut perms = fs::metadata(&exe_path)
                .map_err(|e| format!("{}: {}", get_message("unable_get_permissions", lang, None), e))?
                .permissions();
            perms.set_mode(0o755);
            fs::set_permissions(&exe_path, perms)
                .map_err(|e| format!("{}: {}", get_message("unable_set_permissions", lang, None), e))?;
        }
    }
    
    for file_path in file_paths {
        let file_path_obj = Path::new(&file_path);
        
        // 检查文件是否存在
        if !file_path_obj.exists() {
            results.push(ProcessResult {
                success: false,
                message: get_message("file_not_found", lang, Some(&file_path)),
                error: Some(get_message("file_not_found_error", lang, None)),
                file_path: Some(file_path.clone()),
            });
            continue;
        }
        
        // 获取文件所在目录
        let file_dir = file_path_obj.parent().unwrap_or(Path::new("."));
        
        // 根据不同工具构建命令行参数
        let mut cmd = Command::new(&exe_path);
        
        match tool_name.as_str() {
             "AneuFiler" => {
                 // AneuFiler工具需要-i参数指定输入文件
                 cmd.arg("-i").arg(&file_path);
                 
                 // 如果选择使用峰面积数据，添加-Area参数
                 if use_area_data {
                     cmd.arg("-Area");
                 }
             }
             "Aneu23" | "SHCarrier" => {
                 // Aneu23和SHCarrier工具需要-i参数指定输入文件
                 cmd.arg("-i").arg(&file_path);
                 
                 // 如果选择使用峰面积数据，添加-Area参数
                 if use_area_data {
                     cmd.arg("-Area");
                 }
                 
                 // 如果提供了标准品样本名称，添加-STD参数
                 if let Some(ref std_name) = std_sample_name {
                     if !std_name.trim().is_empty() {
                         cmd.arg("-STD").arg(std_name.trim());
                     }
                 }
                 
                 // SHCarrier工具的Windows系统优化选项
                 if tool_name == "SHCarrier" && windows_optimization.unwrap_or(false) {
                     cmd.arg("-GBK");
                 }
             }
             _ => {
                 // 其他未知工具直接传递文件路径
                 cmd.arg(&file_path);
             }
         }
        
        // 在开发模式下输出调用命令到控制台
        #[cfg(debug_assertions)]
        {
            let cmd_str = format!("{:?}", cmd);
            println!("[DEBUG] 执行命令: {}", cmd_str);
            println!("[DEBUG] 工作目录: {:?}", file_dir);
            println!("[DEBUG] 工具: {}, 文件: {}", tool_name, file_path);
            if use_area_data {
                println!("[DEBUG] 使用峰面积数据: true");
            }
            if let Some(ref std_name) = std_sample_name {
                println!("[DEBUG] 标准品样本名称: {}", std_name);
            }
            if tool_name == "SHCarrier" {
                println!("[DEBUG] Windows系统优化: {}", windows_optimization.unwrap_or(false));
            }
            println!("[DEBUG] ----------------------------------------");
        }
        
        // 执行外部程序
        match cmd.current_dir(file_dir).output()
        {
            Ok(output) => {
                if output.status.success() {
                    results.push(ProcessResult {
                        success: true,
                        message: get_message("process_success", lang, Some(&file_path_obj.file_name().unwrap().to_string_lossy())),
                        error: None,
                        file_path: Some(file_path.clone()),
                    });
                } else {
                    let error_msg = String::from_utf8_lossy(&output.stderr);
                    results.push(ProcessResult {
                        success: false,
                        message: get_message("process_failed", lang, Some(&file_path_obj.file_name().unwrap().to_string_lossy())),
                        error: Some(error_msg.to_string()),
                        file_path: Some(file_path.clone()),
                    });
                }
            }
            Err(e) => {
                results.push(ProcessResult {
                    success: false,
                    message: get_message("execute_failed", lang, Some(&file_path_obj.file_name().unwrap().to_string_lossy())),
                    error: Some(e.to_string()),
                    file_path: Some(file_path.clone()),
                });
            }
        }
    }
    
    Ok(results)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![process_files, open_file_directory])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
