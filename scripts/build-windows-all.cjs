#!/usr/bin/env node

/**
 * Windows全版本构建脚本
 * 构建所有Windows支持的版本
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始构建所有Windows版本软件包...\n');

// Windows构建配置
const builds = [
    {
        name: 'Windows 64位版本',
        target: 'x86_64-pc-windows-msvc',
        output: 'CMTools.x64.exe',
        description: '适用于64位Windows 10+系统'
    },
    {
        name: 'Windows 32位版本',
        target: 'i686-pc-windows-msvc',
        output: 'CMTools.x86.exe',
        description: '适用于32位Windows 10+系统'
    },
    {
        name: 'Windows 7兼容版本',
        target: 'i686-pc-windows-msvc',
        output: 'CMTools.Win7.x86.exe',
        description: '适用于Windows 7 SP1+系统',
        env: {
            WINVER: '0x0601',
            _WIN32_WINNT: '0x0601',
            RUSTFLAGS: '-C target-feature=-crt-static -C link-arg=/SUBSYSTEM:WINDOWS,6.01'
        },
        win7: true
    }
];

// 构建统计
let successCount = 0;
let failCount = 0;
const buildResults = [];

async function checkAndInstallTargets() {
    console.log('📋 检查Rust目标...');
    
    const targets = ['i686-pc-windows-msvc', 'x86_64-pc-windows-msvc'];
    
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
    console.log('\n🎨 构建前端...');
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

    // 只清理特定target的构建产物
    const targetsToClean = ['i686-pc-windows-msvc', 'x86_64-pc-windows-msvc'];

    targetsToClean.forEach(target => {
        const targetDir = `src-tauri/target/${target}`;
        if (fs.existsSync(targetDir)) {
            try {
                const releaseDir = path.join(targetDir, 'release');
                if (fs.existsSync(releaseDir)) {
                    execSync(`rm -rf "${releaseDir}"`, { stdio: 'pipe' });
                    console.log(`🗑️  清理: ${target}/release`);
                }
            } catch (error) {
                // 忽略清理错误
            }
        }
    });

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
    const { name, target, output, description, env = {}, win7 = false } = buildConfig;
    
    console.log(`🔨 构建 ${name}...`);
    console.log(`   目标: ${target}`);
    console.log(`   输出: ${output}`);
    console.log(`   说明: ${description}`);
    
    const startTime = Date.now();
    
    try {
        // 设置环境变量
        const buildEnv = {
            ...process.env,
            ...env,
            TAURI_PRIVATE_KEY: '',
            TAURI_KEY_PASSWORD: ''
        };

        // 使用 tauri build（会包含前端资源）
        console.log(`   📦 构建 ${target}...`);
        execSync(`npm run tauri -- build -- --target ${target}`, {
            stdio: 'inherit',
            env: buildEnv
        });

        // 复制便携版exe
        const targetExePath = `src-tauri/target/${target}/release/cmtools.exe`;
        if (!fs.existsSync(targetExePath)) {
            throw new Error(`构建输出文件不存在: ${targetExePath}`);
        }
        fs.copyFileSync(targetExePath, output);
        
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
            description,
            success: true
        });
        
        successCount++;
        
    } catch (error) {
        console.error(`❌ ${name} 构建失败:`, error.message);
        
        buildResults.push({
            name,
            output,
            error: error.message,
            description,
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
        console.log(`      说明: ${result.description}`);
        
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
    console.log('   - CMTools.x64.exe: 64位Windows便携版');
    console.log('   - CMTools.x86.exe: 32位Windows便携版');
    console.log('   - CMTools.Win7.x86.exe: Windows 7兼容便携版');
    
    console.log('\n📚 相关文档:');
    console.log('   - VERSION_SELECTION_GUIDE.md: 版本选择指南');
    console.log('   - WINDOWS7_COMPATIBILITY.md: Windows 7兼容性说明');
    console.log('   - user_manual.md: 用户使用手册');
}

async function main() {
    try {
        // 检查和安装目标
        await checkAndInstallTargets();
        
        // 构建前端
        buildFrontend();

        // 清理之前的构建（保留默认target的bundler文件）
        cleanPreviousBuilds();
        
        // 构建所有版本
        for (const buildConfig of builds) {
            await buildVersion(buildConfig);
        }
        
        // 打印汇总报告
        printBuildSummary();
        
        if (failCount === 0) {
            console.log('\n🎉 所有Windows版本构建完成！');
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












