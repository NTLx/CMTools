#!/usr/bin/env node

/**
 * 当前系统环境构建脚本
 * 自动检测当前系统架构并构建对应版本
 */

const { execSync } = require('child_process');
const os = require('os');
const fs = require('fs');

console.log('🚀 开始构建当前系统环境软件包...\n');

function detectSystemArchitecture() {
    const arch = os.arch();
    const platform = os.platform();
    
    console.log(`📋 系统信息检测:`);
    console.log(`   平台: ${platform}`);
    console.log(`   架构: ${arch}`);
    
    if (platform !== 'win32') {
        console.log('⚠️  当前平台非Windows，将构建默认目标平台版本');
        return {
            target: null,
            output: 'cmtools',
            description: '默认平台版本'
        };
    }
    
    // Windows平台架构检测
    switch (arch) {
        case 'x64':
        case 'x86_64':
            return {
                target: 'x86_64-pc-windows-msvc',
                output: 'CMTools.x64.exe',
                description: '64位Windows版本'
            };
        case 'ia32':
        case 'x86':
            return {
                target: 'i686-pc-windows-msvc',
                output: 'CMTools.x86.exe',
                description: '32位Windows版本'
            };
        case 'arm64':
            console.log('⚠️  ARM64架构暂不支持，将构建64位x86版本');
            return {
                target: 'x86_64-pc-windows-msvc',
                output: 'CMTools.x64.exe',
                description: '64位Windows版本 (ARM64系统兼容)'
            };
        default:
            console.log(`⚠️  未知架构 ${arch}，将构建64位版本`);
            return {
                target: 'x86_64-pc-windows-msvc',
                output: 'CMTools.x64.exe',
                description: '64位Windows版本 (默认)'
            };
    }
}

async function checkAndInstallTarget(target) {
    if (!target) return; // 非Windows平台跳过
    
    console.log(`\n📋 检查Rust目标: ${target}`);
    try {
        execSync(`rustup target list --installed | findstr ${target}`, { 
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

async function buildTarget(buildConfig) {
    const { target, output, description } = buildConfig;
    
    console.log(`\n🔨 构建 ${description}...`);
    if (target) {
        console.log(`   目标: ${target}`);
    }
    console.log(`   输出: ${output}`);
    
    const startTime = Date.now();
    
    try {
        // 构建命令
        const buildCmd = target 
            ? `npm run tauri -- build -- --target ${target}`
            : 'npm run tauri -- build';
            
        execSync(buildCmd, { stdio: 'inherit' });
        
        // Windows平台处理输出文件
        if (target && target.includes('windows')) {
            const sourcePath = `src-tauri/target/${target}/release/cmtools.exe`;
            if (fs.existsSync(sourcePath)) {
                // 删除旧文件
                if (fs.existsSync(output)) {
                    fs.unlinkSync(output);
                }
                // 复制并重命名
                fs.copyFileSync(sourcePath, output);
                
                const stats = fs.statSync(output);
                const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
                const buildTime = ((Date.now() - startTime) / 1000).toFixed(1);
                
                console.log(`✅ ${description} 构建成功`);
                console.log(`   文件大小: ${sizeMB} MB`);
                console.log(`   构建时间: ${buildTime}s`);
                console.log(`   文件位置: ${output}`);
            } else {
                throw new Error(`构建输出文件不存在: ${sourcePath}`);
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