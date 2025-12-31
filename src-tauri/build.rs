use std::fs;
use std::path::Path;

fn main() {
    // 监听二进制文件变化，确保文件更新时重新编译
    watch_binary_files();

    // 为 Windows 7 兼容性设置环境变量
    #[cfg(target_os = "windows")]
    {
        // 设置最低 Windows 版本为 Windows 7
        println!("cargo:rustc-link-arg=/SUBSYSTEM:WINDOWS,6.01");
        
        // 为 32 位版本设置更低的最低版本要求
        if std::env::var("CARGO_CFG_TARGET_ARCH").unwrap() == "x86" {
            println!("cargo:rustc-env=WINVER=0x0601");
            println!("cargo:rustc-env=_WIN32_WINNT=0x0601");
        }
    }
    
    tauri_build::build()
}

// 监听二进制文件变化
fn watch_binary_files() {
    let assets_dir = Path::new("../src/assets");
    
    if !assets_dir.exists() {
        println!("cargo:warning=Assets directory not found: {:?}", assets_dir);
        return;
    }
    
    // 定义需要监听的二进制文件列表（不带扩展名）
    let binary_names = vec![
        "AneuFiler",
        "Aneu23",
        "SMNFiler_v1",
        "SMNFiler_v2",
        "SHCarrier",
        "UPDFiler_v1",
        "UPDFiler_v2",
    ];
    
    let mut hash_string = String::new();
    
    for name in &binary_names {
        // 根据当前平台确定文件扩展名
        let file_path = if cfg!(target_os = "windows") {
            assets_dir.join(format!("{}.exe", name))
        } else {
            assets_dir.join(name)
        };
        
        if file_path.exists() {
            // 告诉 Cargo 监听这个文件
            println!("cargo:rerun-if-changed={}", file_path.display());
            
            // 计算文件哈希（使用修改时间和文件大小作为简单的哈希）
            if let Ok(metadata) = fs::metadata(&file_path) {
                let modified = metadata.modified()
                    .map(|t| t.duration_since(std::time::UNIX_EPOCH)
                        .map(|d| d.as_secs()).unwrap_or(0))
                    .unwrap_or(0);
                let size = metadata.len();
                hash_string.push_str(&format!("{}:{}:{};", name, modified, size));
            }
        } else {
            println!("cargo:warning=Binary file not found: {:?}", file_path);
        }
    }
    
    // 将哈希字符串作为环境变量传递给编译器
    // 这样当任何二进制文件变化时，哈希值会改变，从而触发重新编译
    if !hash_string.is_empty() {
        println!("cargo:rustc-env=BINARY_FILES_HASH={}", hash_string);
    }
}
