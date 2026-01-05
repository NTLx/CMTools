use std::fs;
use std::path::Path;

fn main() {
    // 强制重新复制二进制文件并触发重新编译
    force_rebuild_binaries();

    // 为 Windows 设置环境变量（Windows 10+）
    #[cfg(target_os = "windows")]
    {
        println!("cargo:rustc-link-arg=/SUBSYSTEM:WINDOWS,6.01");
        if std::env::var("CARGO_CFG_TARGET_ARCH").unwrap() == "x86" {
            println!("cargo:rustc-env=WINVER=0x0601");
            println!("cargo:rustc-env=_WIN32_WINNT=0x0601");
        }
    }
    
    tauri_build::build()
}

/// 强制重新复制二进制文件并触发重新编译
/// 每次构建都无条件复制所有二进制文件，不使用缓存
fn force_rebuild_binaries() {
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
    
    // 创建临时目录用于存放复制的二进制文件
    let build_bin_dir = Path::new("build_binaries");
    
    // 确保临时目录存在
    if let Err(e) = fs::create_dir_all(build_bin_dir) {
        println!("cargo:warning=Failed to create build_binaries directory: {}", e);
        return;
    }
    
    for name in &binary_names {
        // 根据当前平台确定文件扩展名
        let source_path = if cfg!(target_os = "windows") {
            assets_dir.join(format!("{}.exe", name))
        } else {
            assets_dir.join(name)
        };
        
        let dest_path = build_bin_dir.join(source_path.file_name().unwrap_or_default());
        
        if source_path.exists() {
            // 告诉 Cargo 监听源文件变化
            println!("cargo:rerun-if-changed={}", source_path.display());
            
            // 每次构建都强制复制，不使用缓存
            if let Err(e) = fs::copy(&source_path, &dest_path) {
                println!("cargo:warning=Failed to copy {}: {}", source_path.display(), e);
            } else {
                println!("cargo:rerun-if-changed={}", dest_path.display());
            }
        } else {
            println!("cargo:warning=Binary file not found: {:?}", source_path);
        }
    }
    
    // 强制每次构建都触发重新编译
    let force_rebuild_hash = format!("force_rebuild_{}", std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0));
    println!("cargo:rustc-env=BINARY_FILES_FORCE_REBUILD={}", force_rebuild_hash);
}


