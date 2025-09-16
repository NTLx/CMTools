#!/usr/bin/env node
/**
 * CMTools 多架构构建脚本
 * 自动构建 32位 和 64位 Windows 版本，并重命名文件
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始 CMTools 多架构构建...\n');

// 构建配置
const targets = [
  {
    name: 'x64',
    target: 'x86_64-pc-windows-msvc',
    suffix: '.x64.exe'
  },
  {
    name: 'x86',
    target: 'i686-pc-windows-msvc',
    suffix: '.x86.exe'
  }
];

// 执行命令的工具函数
function executeCommand(command, description) {
  console.log(`📦 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} 完成\n`);
  } catch (error) {
    console.error(`❌ ${description} 失败:`, error.message);
    process.exit(1);
  }
}

// 重命名文件的工具函数
function renameExecutable(targetConfig) {
  const targetDir = path.join('src-tauri', 'target', targetConfig.target, 'release');
  const originalFile = path.join(targetDir, 'cmtools.exe');
  const newFileName = `CMTools${targetConfig.suffix}`;
  const newFile = path.join(targetDir, newFileName);
  
  try {
    if (fs.existsSync(originalFile)) {
      fs.copyFileSync(originalFile, newFile);
      console.log(`📋 已重命名: ${originalFile} -> ${newFileName}`);
      
      // 同时复制到根目录方便访问
      const rootFile = path.join('.', newFileName);
      fs.copyFileSync(originalFile, rootFile);
      console.log(`📂 已复制到根目录: ${newFileName}`);
    } else {
      console.warn(`⚠️  原始文件不存在: ${originalFile}`);
    }
  } catch (error) {
    console.error(`❌ 文件重命名失败:`, error.message);
  }
}

// 清理之前的构建文件
function cleanPreviousBuilds() {
  console.log('🧹 清理之前的构建文件...');
  
  const filesToClean = [
    'CMTools.x64.exe',
    'CMTools.x86.exe'
  ];
  
  filesToClean.forEach(file => {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`🗑️  删除旧文件: ${file}`);
      }
    } catch (error) {
      console.warn(`⚠️  删除文件失败: ${file} - ${error.message}`);
    }
  });
  
  console.log('✅ 清理完成\n');
}

// 主构建流程
async function buildMultiArch() {
  try {
    // 清理之前的构建
    cleanPreviousBuilds();
    
    // 构建前端
    executeCommand('npm run build', '构建前端应用');
    
    // 构建每个目标架构
    for (const targetConfig of targets) {
      console.log(`🎯 开始构建 ${targetConfig.name} (${targetConfig.target})...`);
      
      // 执行 Tauri 构建
      executeCommand(
        `npx tauri build --target ${targetConfig.target}`,
        `构建 ${targetConfig.name} 版本`
      );
      
      // 重命名可执行文件
      renameExecutable(targetConfig);
      
      console.log(`✅ ${targetConfig.name} 版本构建完成\n`);
    }
    
    // 显示构建结果
    console.log('🎉 所有版本构建完成！');
    console.log('\n📦 构建产物:');
    
    targets.forEach(target => {
      const fileName = `CMTools${target.suffix}`;
      if (fs.existsSync(fileName)) {
        const stats = fs.statSync(fileName);
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`   • ${fileName} (${sizeInMB} MB)`);
      }
    });
    
    console.log('\n📍 文件位置:');
    console.log('   • 根目录: 方便使用的重命名版本');
    console.log('   • src-tauri/target/[arch]/release/: 原始构建文件');
    
  } catch (error) {
    console.error('❌ 构建过程中发生错误:', error);
    process.exit(1);
  }
}

// 验证 Rust 目标是否已安装
function checkRustTargets() {
  console.log('🔍 检查 Rust 构建目标...');
  
  targets.forEach(target => {
    try {
      execSync(`rustup target list --installed | findstr ${target.target}`, { stdio: 'pipe' });
      console.log(`✅ ${target.target} 已安装`);
    } catch (error) {
      console.log(`📦 正在安装 ${target.target}...`);
      executeCommand(`rustup target add ${target.target}`, `安装 ${target.target}`);
    }
  });
  
  console.log('✅ Rust 目标检查完成\n');
}

// 启动构建流程
if (require.main === module) {
  checkRustTargets();
  buildMultiArch();
}

module.exports = { buildMultiArch, targets };