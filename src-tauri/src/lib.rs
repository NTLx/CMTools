use std::path::Path;
use std::process::Command;
use std::fs;
use std::io::Write;
use std::collections::HashMap;
use std::sync::LazyLock;
use serde::{Deserialize, Serialize};
// use thiserror::Error; // 不再需要，已改为手动实现 Display trait
use tokio::task;

// 自定义错误类型
#[derive(Debug)]
enum ProcessError {
    UnknownTool { tool: String },
    Io(std::io::Error),
    CommandFailed { message: String },
    FileProcessing { file: String, message: String },
}

impl std::fmt::Display for ProcessError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ProcessError::UnknownTool { tool } => write!(f, "Unknown tool name: {}", tool),
            ProcessError::Io(err) => write!(f, "IO error: {}", err),
            ProcessError::CommandFailed { message } => write!(f, "Command execution failed: {}", message),
            ProcessError::FileProcessing { file, message } => write!(f, "File processing error: {} - {}", file, message),
        }
    }
}

impl std::error::Error for ProcessError {}

impl From<std::io::Error> for ProcessError {
    fn from(err: std::io::Error) -> Self {
        ProcessError::Io(err)
    }
}

// 工具枚举，提供类型安全的工具选择
#[derive(Debug, Clone, Copy)]
enum Tool {
    AneuFiler,
    Aneu23,
    SMNFiler,
    SHCarrier,
    UPDFiler,
}

impl Tool {
    // 从字符串解析工具类型
    fn from_str(s: &str) -> Result<Self, ProcessError> {
        match s {
            "AneuFiler" => Ok(Tool::AneuFiler),
            "Aneu23" => Ok(Tool::Aneu23),
            "SMNFiler" => Ok(Tool::SMNFiler),
            "SHCarrier" => Ok(Tool::SHCarrier),
            "UPDFiler" => Ok(Tool::UPDFiler),
            _ => Err(ProcessError::UnknownTool { tool: s.to_string() }),
        }
    }
    
    // 获取可执行文件名
    fn exe_name(&self) -> &'static str {
        match self {
            Tool::AneuFiler => "AneuFiler.exe",
            Tool::Aneu23 => "Aneu23.exe",
            Tool::SMNFiler => "SMNFiler.exe",
            Tool::SHCarrier => "SHCarrier.exe",
            Tool::UPDFiler => "UPDFiler.exe",
        }
    }
    
    // 获取嵌入的可执行文件数据
    fn exe_data(&self) -> &'static [u8] {
        match self {
            Tool::AneuFiler => include_bytes!("../../AneuFiler.exe"),
            Tool::Aneu23 => include_bytes!("../../Aneu23.exe"),
            Tool::SMNFiler => include_bytes!("../../SMNFiler.exe"),
            Tool::SHCarrier => include_bytes!("../../SHCarrier.exe"),
            Tool::UPDFiler => include_bytes!("../../UPDFiler.exe"),
        }
    }
    
    // 检查工具是否支持标准品样本名称
    fn supports_std_sample(&self) -> bool {
        matches!(self, Tool::Aneu23 | Tool::SMNFiler | Tool::SHCarrier)
        // UPDFiler 不需要标准品样本名称配置
    }
    
    // 检查工具是否支持 Windows 优化
    fn supports_windows_optimization(&self) -> bool {
        matches!(self, Tool::SMNFiler | Tool::SHCarrier | Tool::UPDFiler)
        // UPDFiler 现在也支持 Windows 优化配置
    }
}

#[derive(Serialize, Deserialize)]
struct ProcessResult {
    success: bool,
    message: String,
    error: Option<String>,
    file_path: Option<String>,
}

// 静态翻译映射表
static TRANSLATIONS: LazyLock<HashMap<(&str, &str), &str>> = LazyLock::new(|| {
    HashMap::from([
        // 中文翻译
        (("file_not_found", "zh"), "文件不存在"),
        (("file_not_found_error", "zh"), "文件不存在"),
        (("process_success", "zh"), "成功处理文件"),
        (("process_failed", "zh"), "处理文件失败"),
        (("execute_failed", "zh"), "执行程序失败"),
        (("unknown_tool", "zh"), "未知的工具名称"),
        (("unable_open_directory", "zh"), "无法打开目录"),
        (("unable_create_temp_file", "zh"), "无法创建临时可执行文件"),
        (("unable_write_file_data", "zh"), "无法写入可执行文件数据"),
        (("unable_get_permissions", "zh"), "无法获取文件权限"),
        (("unable_set_permissions", "zh"), "无法设置可执行权限"),
        (("task_execution_failed", "zh"), "任务执行失败"),
        (("unknown_tool_error", "zh"), "未知的工具名称"),
        (("io_error", "zh"), "IO 错误"),
        (("command_failed_error", "zh"), "命令执行失败"),
        (("file_processing_error", "zh"), "文件处理错误"),
        
        // 英文翻译
        (("file_not_found", "en"), "File not found"),
        (("file_not_found_error", "en"), "File not found"),
        (("process_success", "en"), "Successfully processed file"),
        (("process_failed", "en"), "Failed to process file"),
        (("execute_failed", "en"), "Failed to execute program"),
        (("unknown_tool", "en"), "Unknown tool name"),
        (("unable_open_directory", "en"), "Unable to open directory"),
        (("unable_create_temp_file", "en"), "Unable to create temporary executable file"),
        (("unable_write_file_data", "en"), "Unable to write executable file data"),
        (("unable_get_permissions", "en"), "Unable to get file permissions"),
        (("unable_set_permissions", "en"), "Unable to set executable permissions"),
        (("task_execution_failed", "en"), "Task execution failed"),
        (("unknown_tool_error", "en"), "Unknown tool name"),
        (("io_error", "en"), "IO error"),
        (("command_failed_error", "en"), "Command execution failed"),
        (("file_processing_error", "en"), "File processing error"),
    ])
});

// 消息翻译函数
fn get_message(key: &str, language: &str, filename: Option<&str>) -> String {
    let message = TRANSLATIONS.get(&(key, language))
        .or_else(|| TRANSLATIONS.get(&(key, "en")))
        .unwrap_or(&key);
    
    if let Some(name) = filename {
        if !name.is_empty() {
            format!("{}: {}", message, name)
        } else {
            message.to_string()
        }
    } else {
        message.to_string()
    }
}

// 将 ProcessError 转换为本地化错误消息
fn process_error_to_localized_string(error: &ProcessError, language: &str) -> String {
    match error {
        ProcessError::UnknownTool { tool } => {
            format!("{}: {}", get_message("unknown_tool_error", language, None), tool)
        }
        ProcessError::Io(err) => {
            format!("{}: {}", get_message("io_error", language, None), err)
        }
        ProcessError::CommandFailed { message } => {
            format!("{}: {}", get_message("command_failed_error", language, None), message)
        }
        ProcessError::FileProcessing { file, message } => {
            format!("{}: {} - {}", get_message("file_processing_error", language, None), file, message)
        }
    }
}

// 打开文件所在目录的命令
#[tauri::command]
async fn open_file_directory(file_path: String, language: Option<String>) -> Result<(), String> {
    let lang = language.as_deref().unwrap_or("en");
    let path = Path::new(&file_path);

    #[cfg(target_os = "windows")]
    {
        // 确保路径是绝对路径并且格式正确
        let absolute_path = if path.is_absolute() {
            path.to_path_buf()
        } else {
            std::env::current_dir()
                .map_err(|e| format!("{}: {}", get_message("unable_open_directory", lang, None), e))?
                .join(path)
        };
        
        // 使用 /select 参数打开文件浏览器并选中文件
        Command::new("explorer")
            .arg("/select,")
            .arg(&absolute_path)
            .spawn()
            .map_err(|e| format!("{}: {}", get_message("unable_open_directory", lang, None), e))?;
    }

    #[cfg(not(target_os = "windows"))]
    {
        let dir_path = if path.is_file() {
            path.parent().unwrap_or(path)
        } else {
            path
        };

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
    }

    Ok(())
}

// 内部处理函数，使用 ProcessError
async fn process_files_internal(_app: tauri::AppHandle, tool_name: String, file_paths: Vec<String>, use_area_data: bool, std_sample_name: Option<String>, windows_optimization: Option<bool>, language: Option<String>) -> Result<Vec<ProcessResult>, ProcessError> {
    let lang = language.as_deref().unwrap_or("en");
    let mut results = Vec::new();
    
    // 解析工具类型
    let tool = Tool::from_str(&tool_name)?;
    
    // 获取工具的可执行文件信息
    let exe_name = tool.exe_name();
    let exe_data = tool.exe_data();
    
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
        let mut file = fs::File::create(&exe_path)?;
        file.write_all(exe_data)?;
        
        // 在Windows上设置可执行权限（虽然通常不需要）
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let mut perms = fs::metadata(&exe_path)?.permissions();
            perms.set_mode(0o755);
            fs::set_permissions(&exe_path, perms)?;
        }
    }
    
    // 并行处理文件
    let tasks: Vec<_> = file_paths.into_iter().map(|file_path| {
        let exe_path = exe_path.clone();
        let _tool_name = tool_name.clone();
        let std_sample_name = std_sample_name.clone();
        let lang = lang.to_string();
        
        task::spawn_blocking(move || -> ProcessResult {
            let file_path_obj = Path::new(&file_path);
            
            // 检查文件是否存在
            if !file_path_obj.exists() {
                let error = ProcessError::FileProcessing {
                    file: file_path.clone(),
                    message: get_message("file_not_found_error", &lang, None),
                };
                return ProcessResult {
                    success: false,
                    message: get_message("file_not_found", &lang, Some(&file_path)),
                    error: Some(process_error_to_localized_string(&error, &lang)),
                    file_path: Some(file_path.clone()),
                };
            }
            
            // 获取文件所在目录
            let file_dir = file_path_obj.parent().unwrap_or(Path::new("."));
            
            // 根据不同工具构建命令行参数
            let mut cmd = Command::new(&exe_path);
            
            // 在 Windows 上隐藏命令行窗口
            #[cfg(target_os = "windows")]
            {
                use std::os::windows::process::CommandExt;
                cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
            }
            
            // 添加输入文件参数
            cmd.arg("-i").arg(&file_path);
            
            // 添加峰面积数据参数（除 UPDFiler 外的工具都支持）
            if use_area_data && !matches!(tool, Tool::UPDFiler) {
                match tool {
                    Tool::SMNFiler => cmd.arg("-a"),
                    _ => cmd.arg("-Area"),
                };
            }
            
            // 添加标准品样本名称参数（仅部分工具支持）
            if tool.supports_std_sample() {
                if let Some(ref std_name) = std_sample_name {
                    if !std_name.trim().is_empty() {
                        match tool {
                            Tool::SMNFiler => cmd.arg("-c").arg(std_name.trim()),
                            _ => cmd.arg("-STD").arg(std_name.trim()),
                        };
                    }
                }
            }
            
            // 添加 Windows 优化参数（SMNFiler 和 SHCarrier 支持）
            if tool.supports_windows_optimization() {
                if windows_optimization.unwrap_or(false) {
                    match tool {
                        Tool::SMNFiler => cmd.arg("-e").arg("GBK"),
                        _ => cmd.arg("-GBK"),
                    };
                }
            }
            
            // 为 SMNFiler 添加特殊参数
            if let Tool::SMNFiler = tool {
                // 添加输出路径参数（使用输入文件所在目录）
                if let Some(parent_dir) = file_path_obj.parent() {
                    cmd.arg("-o").arg(parent_dir);
                }
                
                // 添加语言参数（与当前界面语言一致）
                if lang == "zh" {
                    cmd.arg("-l");
                }
            }
            
            // 在开发模式下输出调用命令到控制台
            #[cfg(debug_assertions)]
            {
                let cmd_str = format!("{:?}", cmd);
                println!("[DEBUG] Executing command: {}", cmd_str);
                println!("[DEBUG] Working directory: {:?}", file_dir);
                println!("[DEBUG] Tool: {}, File: {}", _tool_name, file_path);
                if use_area_data && !matches!(tool, Tool::UPDFiler) {
                    println!("[DEBUG] Using peak area data: true");
                }
                if let Some(ref std_name) = std_sample_name {
                    println!("[DEBUG] Standard sample name: {}", std_name);
                }
                if matches!(tool, Tool::SMNFiler | Tool::SHCarrier | Tool::UPDFiler) {
                    println!("[DEBUG] Windows optimization: {}", windows_optimization.unwrap_or(false));
                }
                println!("[DEBUG] ----------------------------------------");
            }
            
            // 执行外部程序
            match cmd.current_dir(file_dir).output() {
                Ok(output) => {
                    if output.status.success() {
                        ProcessResult {
                            success: true,
                            message: get_message("process_success", &lang, Some(&file_path_obj.file_name().unwrap().to_string_lossy())),
                            error: None,
                            file_path: Some(file_path.clone()),
                        }
                    } else {
                        let error_msg = String::from_utf8_lossy(&output.stderr);
                        let error = ProcessError::CommandFailed {
                            message: error_msg.to_string(),
                        };
                        ProcessResult {
                            success: false,
                            message: get_message("process_failed", &lang, Some(&file_path_obj.file_name().unwrap().to_string_lossy())),
                            error: Some(process_error_to_localized_string(&error, &lang)),
                            file_path: Some(file_path.clone()),
                        }
                    }
                }
                Err(e) => {
                    let error = ProcessError::CommandFailed {
                        message: e.to_string(),
                    };
                    ProcessResult {
                        success: false,
                        message: get_message("execute_failed", &lang, Some(&file_path_obj.file_name().unwrap().to_string_lossy())),
                        error: Some(process_error_to_localized_string(&error, &lang)),
                        file_path: Some(file_path.clone()),
                    }
                }
            }
        })
    }).collect();
    
    // 等待所有任务完成并收集结果
    for task in tasks {
        match task.await {
            Ok(result) => results.push(result),
            Err(e) => {
                results.push(ProcessResult {
                    success: false,
                    message: get_message("task_execution_failed", &lang, None),
                    error: Some(e.to_string()),
                    file_path: None,
                });
            }
        }
    }
    
    Ok(results)
}

// 处理文件的命令
#[tauri::command]
async fn process_files(app: tauri::AppHandle, tool_name: String, file_paths: Vec<String>, use_area_data: bool, std_sample_name: Option<String>, windows_optimization: Option<bool>, language: Option<String>) -> Result<Vec<ProcessResult>, String> {
    let lang = language.as_deref().unwrap_or("en");
    process_files_internal(app, tool_name, file_paths, use_area_data, std_sample_name, windows_optimization, language.clone())
        .await
        .map_err(|e| process_error_to_localized_string(&e, lang))
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
