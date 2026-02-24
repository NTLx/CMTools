#!/usr/bin/env node

/**
 * 当前系统环境构建脚本
 * 自动检测当前系统架构并构建对应版本
 */

const { execSync } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

// 递归复制目录
function copyDirSync(src, dest) {
    if (!fs.existsSync(src)) {
        return;
    }
    
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            copyDirSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

console.log('🚀 开始构建当前系统环境软件包...\n');

function detectSystemArchitecture() {
    const arch = os.arch();
    const platform = os.platform();
    
    console.log(`📋 系统信息检测:`);
    console.log(`   平台: ${platform}`);
    console.log(`   架构: ${arch}`);
    
    // macOS 平台
    if (platform === 'darwin') {
        if (arch === 'arm64' || arch === 'aarch64') {
            return {
                target: 'aarch64-apple-darwin',
                output: 'CMTools.AppleSilicon.dmg',
                bundleOutput: 'cmtools_2.8.5_aarch64.dmg',
                description: 'Apple Silicon (M系列) macOS 版本'
            };
        } else {
            return {
                target: 'x86_64-apple-darwin',
                output: 'CMTools.Intel.dmg',
                bundleOutput: 'cmtools_2.8.5_x64.dmg',
                description: 'Intel macOS 版本'
            };
        }
    }
    
    // Windows平台架构检测
    if (platform === 'win32') {
        switch (arch) {
            case 'x64':
            case 'x86_64':
                return {
                    target: 'x86_64-pc-windows-msvc',
                    output: 'CMTools.exe',
                    description: '64位Windows版本'
                };
            case 'ia32':
            case 'x86':
                return {
                    target: 'i686-pc-windows-msvc',
                    output: 'CMTools.exe',
                    description: '32位Windows版本'
                };
            case 'arm64':
                console.log('⚠️  ARM64架构暂不支持，将构建64位x86版本');
                return {
                    target: 'x86_64-pc-windows-msvc',
                    output: 'CMTools.exe',
                    description: '64位Windows版本 (ARM64系统兼容)'
                };
            default:
                console.log(`⚠️  未知架构 ${arch}，将构建64位版本`);
                return {
                    target: 'x86_64-pc-windows-msvc',
                    output: 'CMTools.exe',
                    description: '64位Windows版本 (默认)'
                };
        };
    }
    
    // Linux 平台
    if (platform === 'linux') {
        if (arch === 'arm64' || arch === 'aarch64') {
            return {
                target: 'aarch64-unknown-linux-gnu',
                output: 'CMTools.AppImage',
                description: 'ARM64 Linux 版本'
            };
        } else {
            return {
                target: 'x86_64-unknown-linux-gnu',
                output: 'CMTools.AppImage',
                description: '64位 Linux 版本'
            };
        }
    }
    
    // 其他平台
    console.log('⚠️  当前平台非Windows/macOS/Linux，将构建默认目标平台版本');
    return {
        target: null,
        output: 'CMTools',
        description: '默认平台版本'
    };
}

async function checkAndInstallTarget(target) {
    if (!target) return; // 非目标平台跳过
    
    console.log(`\n📋 检查Rust目标: ${target}`);
    try {
        // 检测系统类型使用不同的命令
        const platform = os.platform();
        let checkCommand;
        
        if (platform === 'win32') {
            checkCommand = `rustup target list --installed | findstr ${target}`;
        } else {
            checkCommand = `rustup target list --installed | grep ${target}`;
        }
        
        execSync(checkCommand, { 
            stdio: 'pipe',
            shell: true 
        });
        console.log(`✅ ${target} 已安装`);
    } catch (error) {
        console.log(`📦 安装 ${target}...`);
        try {
            execSync(`rustup target add ${target}`, { stdio: 'inherit' });
            console.log(`✅ ${target} 安装完成`);
        } catch (installError) {
            console.error(`❌ ${target} 安装失败:`, installError.message);
            throw installError;
        }
    }
}

function buildFrontend() {
    console.log('\n🎨 构建前端...');
    try {
        execSync('npm run build', { stdio: 'inherit' });
        console.log('✅ 前端构建完成');
    } catch (error) {
        console.error('❌ 前端构建失败:', error.message);
        throw error;
    }
}

function cleanAllBuildArtifacts() {
    console.log('🗑️  清理所有历史构建产物...');

    const projectRoot = process.cwd();

    // 清理所有可能的构建产物
    const artifactPatterns = [
        '*.exe',
        '*.dmg',
        '*.app',
        '*.AppImage',
        'CMTools.*',
    ];

    artifactPatterns.forEach(pattern => {
        try {
            const files = require('glob').sync(pattern, { cwd: projectRoot });
            files.forEach(file => {
                const filePath = path.join(projectRoot, file);
                // 跳过 node_modules
                if (!filePath.includes('node_modules') && !filePath.includes('src-tauri/target')) {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log(`   🗑️  删除: ${file}`);
                    }
                }
            });
        } catch (error) {
            // glob 可能不可用，忽略
        }
    });
}

async function buildTarget(buildConfig) {
    const { target, output, bundleOutput, description } = buildConfig;

    console.log(`\n🔨 构建 ${description}...`);
    if (target) {
        console.log(`   目标: ${target}`);
    }
    console.log(`   输出: ${output}`);

    const startTime = Date.now();

    try {
        // 检查是否需要使用 --target 参数
        // 如果目标平台与当前系统匹配，则不使用 --target 参数以避免路径问题
        const currentPlatform = os.platform();
        const currentArch = os.arch();
        let useTargetArgForBuild = true;
        let buildCmd;

        if (target) {
            // macOS: 如果当前是 arm64 且目标是 aarch64-apple-darwin，或当前是 x64 且目标是 x86_64-apple-darwin
            if (currentPlatform === 'darwin') {
                if ((currentArch === 'arm64' || currentArch === 'aarch64') && target === 'aarch64-apple-darwin') {
                    useTargetArgForBuild = false;
                } else if (currentArch === 'x64' && target === 'x86_64-apple-darwin') {
                    useTargetArgForBuild = false;
                }
            }
            // Linux: 类似处理
            else if (currentPlatform === 'linux') {
                if ((currentArch === 'arm64' || currentArch === 'aarch64') && target === 'aarch64-unknown-linux-gnu') {
                    useTargetArgForBuild = false;
                } else if (currentArch === 'x64' && target === 'x86_64-unknown-linux-gnu') {
                    useTargetArgForBuild = false;
                }
            }
            // Windows: 如果当前是 x64 且目标是 x86_64-pc-windows-msvc，或当前是 x86 且目标是 i686-pc-windows-msvc
            else if (currentPlatform === 'win32') {
                if ((currentArch === 'x64' || currentArch === 'x86_64') && target === 'x86_64-pc-windows-msvc') {
                    useTargetArgForBuild = false;
                } else if ((currentArch === 'ia32' || currentArch === 'x86') && target === 'i686-pc-windows-msvc') {
                    useTargetArgForBuild = false;
                }
            }
        }

        // macOS 处理
        if (target && target.includes('darwin')) {
            // macOS 不需要特殊处理，使用默认路径
            buildCmd = target && useTargetArgForBuild
                ? `npm run tauri -- build -- --target ${target}`
                : 'npm run tauri -- build';
            execSync(buildCmd, { stdio: 'inherit' });

            // 根据 useTargetArgForBuild 决定产物路径
            const bundleDir = useTargetArgForBuild
                ? `src-tauri/target/${target}/release/bundle/dmg/`
                : `src-tauri/target/release/bundle/dmg/`;
            const resourcesDir = useTargetArgForBuild
                ? `src-tauri/target/${target}/release/bundle/macos/cmtools.app/Contents/Resources/`
                : `src-tauri/target/release/bundle/macos/cmtools.app/Contents/Resources/`;

            // 复制前端资源到 app bundle
            console.log('📦 复制前端资源到 app bundle...');
            try {
                // 确保 Resources 目录存在
                if (!fs.existsSync(resourcesDir)) {
                    fs.mkdirSync(resourcesDir, { recursive: true });
                }
                // 复制 dist 目录内容到 Resources
                copyDirSync('dist', resourcesDir);
                console.log('✅ 前端资源复制完成');
            } catch (copyError) {
                console.warn('⚠️  前端资源复制失败:', copyError.message);
            }

            // 优先使用 bundleOutput，如果没有则自动检测
            let sourceFile = bundleOutput ? `${bundleDir}${bundleOutput}` : null;

            // 自动检测实际生成的 DMG 文件
            if (!sourceFile || !fs.existsSync(sourceFile)) {
                try {
                    const files = fs.readdirSync(bundleDir).filter(f => f.endsWith('.dmg'));
                    if (files.length > 0) {
                        sourceFile = `${bundleDir}${files[0]}`;
                    }
                } catch (error) {
                    console.warn(`⚠️  无法读取目录 ${bundleDir}:`, error.message);
                }
            }

            if (sourceFile && fs.existsSync(sourceFile)) {
                // 复制到项目根目录
                const projectRootOutput = output;
                if (fs.existsSync(projectRootOutput)) {
                    fs.unlinkSync(projectRootOutput);
                }
                fs.copyFileSync(sourceFile, projectRootOutput);

                const stats = fs.statSync(projectRootOutput);
                const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
                const buildTime = ((Date.now() - startTime) / 1000).toFixed(1);

                console.log(`✅ ${description} 构建成功`);
                console.log(`   文件大小: ${sizeMB} MB`);
                console.log(`   构建时间: ${buildTime}s`);
                console.log(`   文件位置: ${projectRootOutput}`);
            } else {
                console.log(`✅ ${description} 构建成功 (app bundle 已生成)`);
                console.log(`   产物目录: ${bundleDir}`);
            }
        }
        // Windows平台处理输出文件
        else if (target && target.includes('windows')) {
            // Windows 便携版构建 - 使用 tauri build（包含前端资源）
            if (!useTargetArgForBuild) {
                // 不需要 --target，直接 tauri build
                console.log('   📦 构建中...');
                execSync('npm run tauri -- build', { stdio: 'inherit' });
                const sourceExe = 'src-tauri/target/release/cmtools.exe';
                if (fs.existsSync(sourceExe)) {
                    if (fs.existsSync(output)) fs.unlinkSync(output);
                    fs.copyFileSync(sourceExe, output);
                } else {
                    throw new Error(`构建输出文件不存在: ${sourceExe}`);
                }
            } else {
                execSync(`npm run tauri -- build -- --target ${target}`, {
                    stdio: 'inherit'
                });
                const targetExePath = `src-tauri/target/${target}/release/cmtools.exe`;
                if (fs.existsSync(targetExePath)) {
                    if (fs.existsSync(output)) fs.unlinkSync(output);
                    fs.copyFileSync(targetExePath, output);
                } else {
                    throw new Error(`构建输出文件不存在: ${targetExePath}`);
                }
            }

            const stats = fs.statSync(output);
            const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
            const buildTime = ((Date.now() - startTime) / 1000).toFixed(1);

            console.log(`✅ ${description} 构建成功`);
            console.log(`   文件大小: ${sizeMB} MB`);
            console.log(`   构建时间: ${buildTime}s`);
            console.log(`   文件位置: ${output}`);
            console.log(`   完整文件夹: ${target ? `src-tauri/target/${target}/release/bundle/app/CMTools/` : 'src-tauri/target/release/bundle/app/CMTools/'}`);
        }
        // Linux平台处理
        else if (target && target.includes('linux')) {
            // Linux 构建
            if (!useTargetArgForBuild) {
                execSync('npm run tauri -- build', { stdio: 'inherit' });
            } else {
                execSync(`npm run tauri -- build -- --target ${target}`, {
                    stdio: 'inherit'
                });
            }

            // 查找 AppImage 文件
            const bundlePath = target && useTargetArgForBuild
                ? `src-tauri/target/${target}/release/bundle/appimage/`
                : `src-tauri/target/release/bundle/appimage/`;

            let sourceFile = null;
            if (fs.existsSync(bundlePath)) {
                const files = fs.readdirSync(bundlePath).filter(f => f.endsWith('.AppImage'));
                if (files.length > 0) {
                    sourceFile = path.join(bundlePath, files[0]);
                }
            }

            if (sourceFile && fs.existsSync(sourceFile)) {
                if (fs.existsSync(output)) fs.unlinkSync(output);
                fs.copyFileSync(sourceFile, output);

                const stats = fs.statSync(output);
                const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
                const buildTime = ((Date.now() - startTime) / 1000).toFixed(1);

                console.log(`✅ ${description} 构建成功`);
                console.log(`   文件大小: ${sizeMB} MB`);
                console.log(`   构建时间: ${buildTime}s`);
                console.log(`   文件位置: ${output}`);
            } else {
                console.log(`✅ ${description} 构建成功 (AppImage 可能已生成)`);
            }
        } else {
            const buildTime = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`✅ ${description} 构建成功`);
            console.log(`   构建时间: ${buildTime}s`);
        }

    } catch (error) {
        console.error(`❌ ${description} 构建失败:`, error.message);
        throw error;
    }
}
async function main() {
    try {
        // 清理所有缓存
        console.log('\n🧹 清理所有构建缓存...');
        try {
            execSync('node scripts/clean-build-cache.cjs all', { stdio: 'inherit' });
        } catch (cleanError) {
            console.warn('⚠️  清理缓存失败，继续构建:', cleanError.message);
        }

        // 清理所有历史构建产物
        cleanAllBuildArtifacts();

        // 检测系统环境
        const buildConfig = detectSystemArchitecture();

        // 安装必要的Rust目标
        await checkAndInstallTarget(buildConfig.target);

        // 构建前端
        buildFrontend();

        // 构建目标版本
        await buildTarget(buildConfig);

        console.log('\n🎉 当前系统环境软件包构建完成！');
        console.log('\n💡 使用说明:');
        console.log(`   - 您的系统: ${os.platform()} (${os.arch()})`);
        console.log(`   - 构建版本: ${buildConfig.description}`);
        console.log(`   - 输出文件: ${buildConfig.output}`);

        if (buildConfig.target && buildConfig.target.includes('windows')) {
            console.log('\n📋 其他构建选项:');
            console.log('   npm run tauri:build:win  # 构建所有Windows版本');
            console.log('   npm run tauri:build:all  # 构建所有支持的版本');
        } else if (buildConfig.target && buildConfig.target.includes('darwin')) {
            console.log('\n📋 其他构建选项:');
            console.log('   npm run tauri:build:all  # 构建所有支持的版本');
        }

    } catch (error) {
        console.error('\n❌ 构建过程中发生错误:', error.message);
        process.exit(1);
    }
}

// 处理中断信号
process.on('SIGINT', () => {
    console.log('\n\n⚠️  用户中断构建');
    process.exit(1);
});

main();