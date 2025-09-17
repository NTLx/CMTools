fn main() {
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
