#!/usr/bin/env node

/**
 * 清理构建缓存脚本
 * 清理 Cargo 构建缓存、前端构建缓存和临时文件，确保每次构建都使用最新的二进制文件
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 开始清理构建缓存...\n');

// 递归删除目录
function removeDirSync(dir) {
    if (!fs.existsSync(dir)) {
        return;
    }
    
    try {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`✅ 已删除: ${dir}`);
    } catch (error) {
        console.warn(`⚠️  删除失败: ${dir} - ${error.message}`);
    }
}

// 删除文件
function removeFileSync(file) {
    if (!fs.existsSync(file)) {
        return;
    }
    
    try {
        fs.unlinkSync(file);
        console.log(`✅ 已删除: ${file}`);
    } catch (error) {
        console.warn(`⚠️  删除失败: ${file} - ${error.message}`);
    }
}

function cleanCargoCache() {
    console.log('\n📦 清理 Cargo 构建缓存...');
    
    // 清理 target 目录
    const targetDir = path.join(process.cwd(), 'src-tauri', 'target');
    removeDirSync(targetDir);
    
    // 清理 Cargo.lock（如果存在）
    const cargoLock = path.join(process.cwd(), 'src-tauri', 'Cargo.lock');
    removeFileSync(cargoLock);
}

function cleanFrontendCache() {
    console.log('\n🎨 清理前端构建缓存...');
    
    // 清理 dist 目录
    const distDir = path.join(process.cwd(), 'dist');
    removeDirSync(distDir);
    
    // 清理 node_modules/.cache
    const cacheDir = path.join(process.cwd(), 'node_modules', '.cache');
    removeDirSync(cacheDir);
    
    // 清理 TypeScript 缓存
    const tsbuildinfoFiles = [
        path.join(process.cwd(), 'tsconfig.tsbuildinfo'),
        path.join(process.cwd(), 'node_modules', '.vite', 'deps_temp'),
    ];
    
    tsbuildinfoFiles.forEach(file => {
        removeFileSync(file);
        removeDirSync(file);
    });
}

function cleanTempFiles() {
    console.log('\n🗑️  清理临时文件...');
    
    // 清理各种临时文件
    const tempPatterns = [
        '*.tmp',
        '*.temp',
        '*.log',
        '.DS_Store',
    ];
    
    const rootDir = process.cwd();
    
    tempPatterns.forEach(pattern => {
        try {
            const files = require('glob').sync(pattern, { cwd: rootDir });
            files.forEach(file => {
                const filePath = path.join(rootDir, file);
                removeFileSync(filePath);
            });
        } catch (error) {
            // glob 模块可能不可用，跳过
        }
    });
}

function cleanViteCache() {
    console.log('\n⚡ 清理 Vite 缓存...');
    
    const viteCacheDir = path.join(process.cwd(), 'node_modules', '.vite');
    removeDirSync(viteCacheDir);
}

function cleanAll() {
    console.log('\n🔥 执行完全清理...');
    
    cleanCargoCache();
    cleanFrontendCache();
    cleanViteCache();
    cleanTempFiles();
    
    // 清理 Cargo 注册表缓存
    console.log('\n📋 清理 Cargo 注册表缓存...');
    try {
        execSync('cargo clean', { stdio: 'inherit' });
        console.log('✅ Cargo 注册表缓存已清理');
    } catch (error) {
        console.warn('⚠️  Cargo clean 命令执行失败:', error.message);
    }
}

function main() {
    const args = process.argv.slice(2);
    const cleanType = args[0] || 'all';
    
    console.log(`📋 清理模式: ${cleanType}\n`);
    
    switch (cleanType) {
        case 'cargo':
            cleanCargoCache();
            break;
        case 'frontend':
            cleanFrontendCache();
            cleanViteCache();
            break;
        case 'all':
            cleanAll();
            break;
        default:
            console.log('❌ 未知的清理模式:', cleanType);
            console.log('\n📋 可用的清理模式:');
            console.log('   cargo    - 仅清理 Cargo 构建缓存');
            console.log('   frontend - 仅清理前端构建缓存');
            console.log('   all      - 清理所有缓存（默认）');
            process.exit(1);
    }
    
    console.log('\n✨ 清理完成！');
    console.log('\n💡 下一步:');
    console.log('   npm run tauri:build    # 使用最新二进制文件重新构建');
}

// 处理中断信号
process.on('SIGINT', () => {
    console.log('\n\n⚠️  用户中断清理');
    process.exit(1);
});

main();