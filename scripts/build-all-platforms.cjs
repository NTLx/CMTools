#!/usr/bin/env node

/**
 * 全平台构建脚本
 * 构建所有支持的平台版本（Windows、macOS、Linux）
 */

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');

console.log('🚀 开始构建全平台软件包...\n');

// Windows构建配置
const windowsBuilds = [
    {
        name: 'Windows 7兼容版 (32位)',
        target: 'i686-pc-windows-msvc',
        output: 'CMTools.Win7.x86.exe',
        env: {
            WINVER: '0x0601',
            _WIN32_WINNT: '0x0601',
            RUSTFLAGS: '-C target-feature=-crt-static -C link-arg=/SUBSYSTEM:WINDOWS,6.01'
        }
    },
    {
        name: '标准32位Windows版本',
        target: 'i686-pc-windows-msvc',
        output: 'CMTools.x86.exe',
        env: {}
    },
    {
        name: '标准64位Windows版本',
        target: 'x86_64-pc-windows-msvc',
        output: 'CMTools.x64.exe',
        env: {}
    }
];

// macOS构建配置
const macosBuilds = [
    {
        name: 'macOS (Apple Silicon)',
        target: 'aarch64-apple-darwin',
        output: 'CMTools.applesilicon.app',
        env: {}
    },
    {
        name: 'macOS (Intel)',
        target: 'x86_64-apple-darwin',
        output: 'CMTools.intel.app',
        env: {}
    }
];

// Linux构建配置
const linuxBuilds = [
    {
        name: 'Linux (64位)',
        target: 'x86_64-unknown-linux-gnu',
        output: 'CMTools.x86_64.AppImage',
        env: {}
    },
    {
        name: 'Linux (32位)',
        target: 'i686-unknown-linux-gnu',
        output: 'CMTools.i686.AppImage',
        env: {}
    }
];

// 根据当前平台确定构建配置
function getPlatformBuilds() {
    const platform = os.platform();
    switch (platform) {
        case 'win32':
            return windowsBuilds;
        case 'darwin':
            return macosBuilds;
        case 'linux':
            return linuxBuilds;
        default:
            // 默认构建Windows版本
            return windowsBuilds;
    }
}

const builds = getPlatformBuilds();

// 构建统计
let successCount = 0;
let failCount = 0;
const buildResults = [];

async function checkAndInstallTargets() {
    console.log('📋 检查Rust目标...');
    
    const targets = [...new Set(builds.map(build => build.target))];
    
    for (const target of targets) {
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
}

function buildFrontend() {
    console.log('🎨 构建前端...');
    try {
        execSync('npm run build', { stdio: 'inherit' });
        console.log('✅ 前端构建完成\n');
    } catch (error) {
        console.error('❌ 前端构建失败:', error.message);
        throw error;
    }
}

function cleanPreviousBuilds() {
    console.log('🧹 清理之前的构建...');
    
    // 清理构建目录
    try {
        execSync('cargo clean', { 
            cwd: 'src-tauri', 
            stdio: 'pipe' 
        });
    } catch (error) {
        // 忽略清理错误
    }
    
    // 清理之前的输出文件
    builds.forEach(build => {
        if (fs.existsSync(build.output)) {
            try {
                fs.unlinkSync(build.output);
                console.log(`🗑️  删除旧文件: ${build.output}`);
            } catch (error) {
                console.log(`⚠️  无法删除: ${build.output}`);
            }
        }
    });
    console.log('');
}

async function buildVersion(buildConfig) {
    const { name, target, output, env } = buildConfig;
    
    console.log(`🔨 构建 ${name}...`);
    console.log(`   目标: ${target}`);
    console.log(`   输出: ${output}`);
    
    const startTime = Date.now();
    
    try {
        // 设置环境变量
        const buildEnv = {
            ...process.env,
            ...env,
            TAURI_PRIVATE_KEY: '',
            TAURI_KEY_PASSWORD: ''
        };
        
        // 执行构建
        execSync(`npm run tauri -- build -- --target ${target}`, { 
            stdio: 'inherit',
            env: buildEnv
        });
        
        // 检查源文件
        const sourcePath = `src-tauri/target/${target}/release/cmtools${target.includes('windows') ? '.exe' : target.includes('apple') ? '.app' : ''}`;
        if (!fs.existsSync(sourcePath)) {
            throw new Error(`构建输出文件不存在: ${sourcePath}`);
        }
        
        // 复制并重命名文件
        fs.copyFileSync(sourcePath, output);
        
        // 获取文件信息
        const stats = fs.statSync(output);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        const buildTime = ((Date.now() - startTime) / 1000).toFixed(1);
        
        console.log(`✅ ${name} 构建成功`);
        console.log(`   文件大小: ${sizeMB} MB`);
        console.log(`   构建时间: ${buildTime}s\n`);
        
        buildResults.push({
            name,
            output,
            size: sizeMB,
            time: buildTime,
            success: true
        });
        
        successCount++;
        
    } catch (error) {
        console.error(`❌ ${name} 构建失败:`, error.message);
        
        buildResults.push({
            name,
            output,
            error: error.message,
            success: false
        });
        
        failCount++;
    }
}

function printBuildSummary() {
    console.log('=' .repeat(80));
    console.log('📊 构建汇总报告');
    console.log('=' .repeat(80));
    
    console.log(`\n🎯 构建统计:`);
    console.log(`   成功: ${successCount} 个`);
    console.log(`   失败: ${failCount} 个`);
    console.log(`   总计: ${builds.length} 个`);
    
    console.log(`\n📋 详细结果:`);
    buildResults.forEach((result, index) => {
        const status = result.success ? '✅' : '❌';
        console.log(`   ${index + 1}. ${status} ${result.name}`);
        
        if (result.success) {
            console.log(`      文件: ${result.output} (${result.size} MB)`);
            console.log(`      耗时: ${result.time}s`);
        } else {
            console.log(`      错误: ${result.error}`);
        }
        console.log('');
    });
    
    if (successCount > 0) {
        console.log('📁 生成的文件:');
        buildResults
            .filter(r => r.success)
            .forEach(result => {
                console.log(`   ${result.output}`);
            });
    }
    
    console.log('\n💡 使用说明:');
    console.log('   - Windows版本: 适用于Windows系统');
    console.log('   - macOS版本: 适用于macOS系统');
    console.log('   - Linux版本: 适用于Linux系统');
    
    console.log('\n📚 相关文档:');
    console.log('   - README.md: 开发者文档');
    console.log('   - user_manual.md: 用户使用手册');
}

async function main() {
    try {
        // 检查和安装目标
        await checkAndInstallTargets();
        
        // 构建前端
        buildFrontend();
        
        // 清理之前的构建
        cleanPreviousBuilds();
        
        // 构建所有版本
        for (const buildConfig of builds) {
            await buildVersion(buildConfig);
        }
        
        // 打印汇总报告
        printBuildSummary();
        
        if (failCount === 0) {
            console.log('\n🎉 所有平台版本构建完成！');
            process.exit(0);
        } else {
            console.log('\n⚠️  部分版本构建失败，请查看错误信息');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('\n❌ 构建过程中发生严重错误:', error.message);
        process.exit(1);
    }
}

// 处理中断信号
process.on('SIGINT', () => {
    console.log('\n\n⚠️  用户中断构建');
    console.log('📊 已完成构建:');
    buildResults
        .filter(r => r.success)
        .forEach(result => {
            console.log(`   ✅ ${result.output}`);
        });
    process.exit(1);
});

main();


