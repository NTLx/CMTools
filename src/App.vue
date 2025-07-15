<script setup lang="ts">
import { ref, onMounted } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

interface ProcessResult {
  success: boolean;
  message: string;
  error?: string;
}

// 获取应用版本号
const appVersion = (globalThis as any).__APP_VERSION__ || '2.0.0';

const selectedFiles = ref<string[]>([]);
const selectedTool = ref<string>("AneuFiler");
const useAreaData = ref<boolean>(false);
const stdSampleName = ref<string>("STD");
const windowsOptimization = ref<boolean>(true); // Windows系统优化，默认选中
const processing = ref<boolean>(false);
const results = ref<ProcessResult[]>([]);
const showErrorDialog = ref<boolean>(false);
const errorMessages = ref<string[]>([]);
const isDarkMode = ref<boolean>(true); // 默认暗色模式
const currentLanguage = ref<string>('zh'); // 默认中文

const tools = [
  { name: "AneuFiler", label: "AneuFiler" },
  { name: "Aneu23", label: "Aneu23" },
  { name: "SHCarrier", label: "SHCarrier" }
];

// 翻译文本
const translations = {
  zh: {
    subtitle: '结果文件在各输入文件同目录下生成',
    selectTool: '选择工具',
    fileProcessing: '文件处理',
    selectFiles: '选择文件',
    selectFilesBtn: '📁 选择文件',
    clearBtn: '🗑️ 清除',
    selectedFiles: '已选择的文件',
    processOptions: '处理选项',
    useAreaData: '使用峰面积数据进行计算',
    useAreaDataDesc: '选中此选项将使用峰面积数据而非峰高数据进行计算',
    stdSampleName: '标准品样本名称',
    stdSampleNameDesc: '指定标准品样本的名称，用于数据处理时的标准品识别',
    windowsOptimization: 'Windows 系统优化',
    windowsOptimizationDesc: '针对Windows系统进行编码优化，建议在Windows环境下保持选中状态',
    processing: '⏳ 处理中...',
    startProcess: '🚀 开始处理',
    processResults: '处理结果',
    processError: '❌ 处理错误',
    confirm: '确定',
    selectFilesFirst: '请先选择文件',
    selectFilesTitle: '选择要处理的文件',
    selectFilesError: '选择文件时出错:',
    processFilesError: '处理文件时出错:',
    openHelpError: '打开帮助中心时出错:',
    helpCenter: 'CMTools帮助中心',
    switchToLight: '切换到亮色模式',
    switchToDark: '切换到暗色模式'
  },
  en: {
    subtitle: 'Result files are generated in the same directory as input files',
    selectTool: 'Select Processing Tool',
    fileProcessing: 'File Processor',
    selectFiles: 'Select Files',
    selectFilesBtn: '📁 Select Files',
    clearBtn: '🗑️ Clear',
    selectedFiles: 'Selected Files',
    processOptions: 'Processing Options',
    useAreaData: 'Use peak area data for calculation',
    useAreaDataDesc: 'Check this option to use peak area data instead of peak height data for calculation',
    stdSampleName: 'Standard Sample Name',
    stdSampleNameDesc: 'Specify the name of the standard sample for standard identification during data processing',
    windowsOptimization: 'Windows System Optimization',
    windowsOptimizationDesc: 'Optimize encoding for Windows systems, recommended to keep checked in Windows environment',
    processing: '⏳ Processing...',
    startProcess: '🚀 Start Processing',
    processResults: 'Processing Results',
    processError: '❌ Processing Error',
    confirm: 'OK',
    selectFilesFirst: 'Please select files first',
    selectFilesTitle: 'Select files to process',
    selectFilesError: 'Error selecting files:',
    processFilesError: 'Error processing files:',
    openHelpError: 'Error opening help center:',
    helpCenter: 'CMTools Help Center',
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode'
  }
};

// 获取翻译文本
function t(key: string): string {
  return translations[currentLanguage.value as keyof typeof translations]?.[key as keyof typeof translations.zh] || key;
}

// 语言切换
function toggleLanguage() {
  currentLanguage.value = currentLanguage.value === 'zh' ? 'en' : 'zh';
  localStorage.setItem('language', currentLanguage.value);
}

// 选择文件
async function selectFiles() {
  try {
    const selected = await open({
      multiple: true,
      title: t('selectFilesTitle')
    });
    
    if (selected) {
      selectedFiles.value = Array.isArray(selected) ? selected : [selected];
    }
  } catch (error) {
    console.error(t('selectFilesError'), error);
  }
}

// 处理文件
async function processFiles() {
  if (selectedFiles.value.length === 0) {
    alert(t('selectFilesFirst'));
    return;
  }
  
  processing.value = true;
  results.value = [];
  errorMessages.value = [];
  
  try {
    const processResults = await invoke<ProcessResult[]>("process_files", {
      toolName: selectedTool.value,
      filePaths: selectedFiles.value,
      useAreaData: useAreaData.value,
      stdSampleName: (selectedTool.value === "Aneu23" || selectedTool.value === "SHCarrier") ? stdSampleName.value : undefined,
      windowsOptimization: selectedTool.value === "SHCarrier" ? windowsOptimization.value : undefined
    });
    
    results.value = processResults;
    
    // 收集错误信息
    const errors = processResults
      .filter(result => !result.success && result.error)
      .map(result => `${result.message}: ${result.error}`);
    
    if (errors.length > 0) {
      errorMessages.value = errors;
      showErrorDialog.value = true;
    }
    
  } catch (error) {
    console.error(t('processFilesError'), error);
    errorMessages.value = [String(error)];
    showErrorDialog.value = true;
  } finally {
    processing.value = false;
  }
}

// 清除选择的文件
function clearFiles() {
  selectedFiles.value = [];
  results.value = [];
}

// 关闭错误对话框
function closeErrorDialog() {
  showErrorDialog.value = false;
  errorMessages.value = [];
}

// 主题切换
function toggleTheme() {
  isDarkMode.value = !isDarkMode.value;
  localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light');
  updateThemeClass();
}

// 更新主题类名
function updateThemeClass() {
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark-theme');
  } else {
    document.documentElement.classList.remove('dark-theme');
  }
}

// 打开帮助中心
async function openHelpCenter() {
  try {
    const { openUrl } = await import('@tauri-apps/plugin-opener');
    await openUrl('https://docs.dingtalk.com/i/nodes/mExel2BLV5xvg52YSErl4LvbWgk9rpMq');
  } catch (error) {
    console.error(t('openHelpError'), error);
    // 如果Tauri API不可用，使用浏览器默认方式
    window.open('https://docs.dingtalk.com/i/nodes/mExel2BLV5xvg52YSErl4LvbWgk9rpMq', '_blank');
  }
}

// 初始化主题和语言
onMounted(() => {
  // 初始化主题，默认暗色模式
  const savedTheme = localStorage.getItem('theme');
  isDarkMode.value = savedTheme ? savedTheme === 'dark' : true;
  updateThemeClass();
  
  // 初始化语言，默认中文
  const savedLanguage = localStorage.getItem('language');
  currentLanguage.value = savedLanguage || 'zh';
});
</script>

<template>
  <main class="container">
    <header class="header">
      <div class="help-toggle">
        <button @click="openHelpCenter" class="help-btn" :title="t('helpCenter')">
          <span>❓</span>
        </button>
      </div>
      <div class="version-display">
        <span class="version-text">v{{ appVersion }}</span>
      </div>
      <div class="language-toggle">
        <button @click="toggleLanguage" class="language-btn" title="Language / 语言">
          <span>{{ currentLanguage === 'zh' ? 'CN' : 'EN' }}</span>
        </button>
      </div>
      <div class="theme-toggle">
        <button @click="toggleTheme" class="theme-btn" :title="isDarkMode ? t('switchToLight') : t('switchToDark')">
          <span v-if="isDarkMode">☀️</span>
          <span v-else>🌙</span>
        </button>
      </div>
      <img src="/logo.png" class="logo" alt="CMTools Logo" />
      <h1>CMTools</h1>
      <p class="subtitle">{{ t('subtitle') }}</p>
    </header>

    <div class="main-content">
      <!-- 工具选择 -->
      <div class="tool-selection">
        <h3>{{ t('selectTool') }}</h3>
        <div class="tool-buttons">
          <button 
            v-for="tool in tools" 
            :key="tool.name"
            :class="['tool-btn', { active: selectedTool === tool.name }]"
            @click="selectedTool = tool.name"
          >
            {{ tool.label }}
          </button>
        </div>
      </div>

      <!-- 文件选择 -->
      <div class="file-selection">
        <h3>{{ t('fileProcessing') }}</h3>
        <div class="file-actions">
          <button @click="selectFiles" class="select-btn">
            {{ t('selectFilesBtn') }}
          </button>
          <button @click="clearFiles" class="clear-btn" v-if="selectedFiles.length > 0">
            {{ t('clearBtn') }}
          </button>
        </div>
        
        <div v-if="selectedFiles.length > 0" class="selected-files">
          <h4>{{ t('selectedFiles') }} ({{ selectedFiles.length }})</h4>
          <div class="file-list">
            <div v-for="(file, index) in selectedFiles" :key="index" class="file-item">
              📄 {{ file.split('\\').pop() || file.split('/').pop() }}
            </div>
          </div>
        </div>
      </div>

      <!-- 处理选项 -->
      <div class="process-options" v-if="selectedFiles.length > 0">
        <h3>{{ t('processOptions') }}</h3>
        <div class="option-item">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="useAreaData" 
              class="checkbox-input"
            />
            <span class="checkbox-custom"></span>
            <span class="checkbox-text">{{ t('useAreaData') }}</span>
          </label>
          <p class="option-description">{{ t('useAreaDataDesc') }}</p>
        </div>
        
        <!-- Windows系统优化选项 -->
        <div class="option-item" v-if="selectedTool === 'SHCarrier'">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="windowsOptimization" 
              class="checkbox-input"
            />
            <span class="checkbox-custom"></span>
            <span class="checkbox-text">{{ t('windowsOptimization') }}</span>
          </label>
          <p class="option-description">{{ t('windowsOptimizationDesc') }}</p>
        </div>
        
        <!-- 标准品样本名称配置 -->
        <div class="option-item" v-if="selectedTool === 'Aneu23' || selectedTool === 'SHCarrier'">
          <label class="input-label">
            <span class="input-text">{{ t('stdSampleName') }}</span>
            <input 
              type="text" 
              v-model="stdSampleName" 
              class="text-input"
              placeholder="STD"
            />
          </label>
          <p class="option-description">{{ t('stdSampleNameDesc') }}</p>
        </div>
      </div>

      <!-- 处理按钮 -->
      <div class="process-section">
        <button 
          @click="processFiles" 
          :disabled="selectedFiles.length === 0 || processing"
          class="process-btn"
        >
          <span v-if="processing">{{ t('processing') }}</span>
          <span v-else>{{ t('startProcess') }}</span>
         </button>
       </div>

      <!-- 处理结果 -->
      <div v-if="results.length > 0" class="results">
        <h3>{{ t('processResults') }}</h3>
        <div class="result-list">
          <div 
            v-for="(result, index) in results" 
            :key="index" 
            :class="['result-item', result.success ? 'success' : 'error']"
          >
            <span class="result-icon">{{ result.success ? '✅' : '❌' }}</span>
            <span class="result-message">{{ result.message }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误对话框 -->
    <div v-if="showErrorDialog" class="error-dialog-overlay" @click="closeErrorDialog">
      <div class="error-dialog" @click.stop>
        <div class="error-header">
          <h3>{{ t('processError') }}</h3>
          <button @click="closeErrorDialog" class="close-btn">×</button>
        </div>
        <div class="error-content">
          <div v-for="(error, index) in errorMessages" :key="index" class="error-item">
            {{ error }}
          </div>
        </div>
        <div class="error-footer">
          <button @click="closeErrorDialog" class="ok-btn">{{ t('confirm') }}</button>
        </div>
      </div>
    </div>
  </main>
</template>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
}

#app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}

/* CSS变量定义 - 亮色主题 */
:root {
  /* 主色调 - Material Design Blue */
  --primary-50: #e3f2fd;
  --primary-100: #bbdefb;
  --primary-200: #90caf9;
  --primary-300: #64b5f6;
  --primary-400: #42a5f5;
  --primary-500: #2196f3;
  --primary-600: #1e88e5;
  --primary-700: #1976d2;
  --primary-800: #1565c0;
  --primary-900: #0d47a1;
  
  /* 辅助色调 - Material Design Indigo */
  --secondary-50: #e8eaf6;
  --secondary-100: #c5cae9;
  --secondary-200: #9fa8da;
  --secondary-300: #7986cb;
  --secondary-400: #5c6bc0;
  --secondary-500: #3f51b5;
  --secondary-600: #3949ab;
  --secondary-700: #303f9f;
  --secondary-800: #283593;
  --secondary-900: #1a237e;
  
  /* 中性色 */
  --gray-50: #fafafa;
  --gray-100: #f5f5f5;
  --gray-200: #eeeeee;
  --gray-300: #e0e0e0;
  --gray-400: #bdbdbd;
  --gray-500: #9e9e9e;
  --gray-600: #757575;
  --gray-700: #616161;
  --gray-800: #424242;
  --gray-900: #212121;
  
  /* 语义色彩 */
  --success: #4caf50;
  --warning: #ff9800;
  --error: #f44336;
  --info: #2196f3;
  
  /* 背景和表面 */
  --bg-primary: linear-gradient(135deg, var(--primary-400) 0%, var(--secondary-500) 100%);
  --bg-surface: #ffffff;
  --bg-surface-variant: var(--gray-50);
  
  /* 文本颜色 */
  --text-primary: var(--gray-900);
  --text-secondary: var(--gray-600);
  --text-on-primary: #ffffff;
  
  /* 阴影 */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
}

/* 暗色主题 */
.dark-theme {
  /* 主色调 - 暗色版本 */
  --primary-50: #0d47a1;
  --primary-100: #1565c0;
  --primary-200: #1976d2;
  --primary-300: #1e88e5;
  --primary-400: #2196f3;
  --primary-500: #42a5f5;
  --primary-600: #64b5f6;
  --primary-700: #90caf9;
  --primary-800: #bbdefb;
  --primary-900: #e3f2fd;
  
  /* 辅助色调 - 暗色版本 */
  --secondary-50: #1a237e;
  --secondary-100: #283593;
  --secondary-200: #303f9f;
  --secondary-300: #3949ab;
  --secondary-400: #3f51b5;
  --secondary-500: #5c6bc0;
  --secondary-600: #7986cb;
  --secondary-700: #9fa8da;
  --secondary-800: #c5cae9;
  --secondary-900: #e8eaf6;
  
  /* 中性色 - 暗色版本 */
  --gray-50: #121212;
  --gray-100: #1e1e1e;
  --gray-200: #2d2d2d;
  --gray-300: #404040;
  --gray-400: #5a5a5a;
  --gray-500: #757575;
  --gray-600: #9e9e9e;
  --gray-700: #bdbdbd;
  --gray-800: #e0e0e0;
  --gray-900: #ffffff;
  
  /* 背景和表面 - 暗色版本 */
  --bg-primary: linear-gradient(135deg, #1a237e 0%, #0d47a1 100%);
  --bg-surface: #1e1e1e;
  --bg-surface-variant: #2d2d2d;
  
  /* 文本颜色 - 暗色版本 */
  --text-primary: var(--gray-900);
  --text-secondary: var(--gray-700);
  --text-on-primary: #ffffff;
  
  /* 阴影 - 暗色版本 */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.2), 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.1);
}
</style>

<style scoped>
.container {
  min-height: 100vh;
  background: var(--bg-primary);
  padding: 0;
  font-family: 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  transition: all 0.3s ease;
}

.header {
  text-align: center;
  margin-bottom: 16px;
  padding: 16px 0 0 0;
  color: var(--text-on-primary);
  position: relative;
}

.help-toggle {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
}

.version-display {
  position: absolute;
  top: 16px;
  left: 80px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px;
}

.version-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 8px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.version-text:hover {
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.95);
}

.language-toggle {
  position: absolute;
  top: 16px;
  right: 80px;
  z-index: 10;
}

.theme-toggle {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
}

.help-btn,
.language-btn,
.theme-btn {
  background: transparent;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.help-btn,
.theme-btn {
  font-size: 20px;
}

.help-btn:hover,
.language-btn:hover,
.theme-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

.logo {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin-bottom: 8px;
  background: white;
  box-shadow: var(--shadow-lg);
}

.header h1 {
  margin: 6px 0 2px 0;
  font-size: 1.875rem;
  font-weight: 500;
  letter-spacing: -0.025em;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.subtitle {
  margin: 0;
  font-size: 1rem;
  opacity: 0.9;
  font-weight: 400;
}

.main-content {
  max-width: 800px;
  margin: 0 auto 16px auto;
  background: var(--bg-surface);
  border-radius: 20px;
  padding: 20px;
  box-shadow: var(--shadow-xl);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.tool-selection,
.file-selection,
.process-section,
.results {
  margin-bottom: 16px;
}

h3 {
  color: var(--text-primary);
  margin-bottom: 12px;
  font-size: 1.125rem;
  font-weight: 500;
  letter-spacing: -0.025em;
}

.tool-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.tool-btn {
  padding: 10px 20px;
  border: 1px solid var(--gray-300);
  background: var(--bg-surface);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.8125rem;
  position: relative;
  overflow: hidden;
}

.tool-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.tool-btn:hover::before {
  left: 100%;
}

.tool-btn:hover {
  border-color: var(--primary-500);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.tool-btn.active {
  background: var(--primary-500);
  color: var(--text-on-primary);
  border-color: var(--primary-500);
  box-shadow: var(--shadow-md);
}

.file-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.select-btn,
.clear-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.8125rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.select-btn {
  background: var(--success);
  color: white;
  box-shadow: var(--shadow-sm);
}

.select-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  filter: brightness(1.1);
}

.clear-btn {
  background: var(--error);
  color: white;
  box-shadow: var(--shadow-sm);
}

.clear-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  filter: brightness(1.1);
}

.selected-files {
  background: var(--bg-surface-variant);
  border-radius: 12px;
  padding: 16px;
  border-left: 4px solid var(--primary-500);
  border: 1px solid var(--gray-200);
}

.selected-files h4 {
  margin: 0 0 8px 0;
  color: var(--text-primary);
  font-size: 0.9375rem;
  font-weight: 500;
}

.file-list {
  max-height: 200px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--gray-400) transparent;
}

.file-list::-webkit-scrollbar {
  width: 6px;
}

.file-list::-webkit-scrollbar-track {
  background: transparent;
}

.file-list::-webkit-scrollbar-thumb {
  background: var(--gray-400);
  border-radius: 3px;
}

.file-item {
  padding: 8px 0;
  border-bottom: 1px solid var(--gray-200);
  color: var(--text-secondary);
  font-size: 0.8125rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.file-item:last-child {
  border-bottom: none;
}

.process-section {
  text-align: center;
  margin-top: 20px;
}

.process-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary-500), var(--secondary-500));
  color: white;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-lg);
  position: relative;
  overflow: hidden;
  min-width: 140px;
}

.process-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s;
}

.process-btn:hover:not(:disabled)::before {
  left: 100%;
}

.process-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: var(--shadow-xl);
}

.process-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  filter: grayscale(0.3);
}

.results {
  background: var(--bg-surface-variant);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--gray-200);
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.8125rem;
  box-shadow: var(--shadow-sm);
}

.result-item:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.result-item.success {
  background: rgba(76, 175, 80, 0.1);
  border-left: 4px solid var(--success);
  border: 1px solid rgba(76, 175, 80, 0.2);
}

.result-item.error {
  background: rgba(244, 67, 54, 0.1);
  border-left: 4px solid var(--error);
  border: 1px solid rgba(244, 67, 54, 0.2);
}

.result-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.result-message {
  flex: 1;
  color: var(--text-primary);
  line-height: 1.4;
}

/* 错误对话框样式 */
.error-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.error-dialog {
  background: var(--bg-surface);
  border-radius: 20px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--gray-200);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.error-header {
  background: var(--error);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-header h3 {
  margin: 0;
  color: white;
  font-size: 1.125rem;
  font-weight: 500;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.error-content {
  padding: 24px;
  max-height: 300px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--gray-400) transparent;
}

.error-content::-webkit-scrollbar {
  width: 6px;
}

.error-content::-webkit-scrollbar-track {
  background: transparent;
}

.error-content::-webkit-scrollbar-thumb {
  background: var(--gray-400);
  border-radius: 3px;
}

.error-item {
  padding: 12px;
  margin-bottom: 12px;
  background: var(--bg-surface-variant);
  border-radius: 8px;
  border-left: 4px solid var(--error);
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.75rem;
  color: var(--text-primary);
  line-height: 1.4;
  border: 1px solid var(--gray-200);
}

/* 处理选项样式 */
.process-options {
  background: var(--bg-surface-variant);
  border-radius: 12px;
  padding: 16px;
  border-left: 4px solid var(--primary-500);
  border: 1px solid var(--gray-200);
}

.option-item {
  margin-bottom: 10px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.8125rem;
  transition: color 0.3s ease;
}

.checkbox-label:hover {
  color: var(--primary-600);
}

.checkbox-input {
  display: none;
}

.checkbox-custom {
  width: 18px;
  height: 18px;
  border: 2px solid var(--gray-300);
  border-radius: 5px;
  margin-right: 10px;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--bg-surface);
  flex-shrink: 0;
}

.checkbox-input:checked + .checkbox-custom {
  background: var(--primary-500);
  border-color: var(--primary-500);
  transform: scale(1.1);
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.checkbox-custom:hover {
  border-color: var(--primary-500);
  transform: scale(1.05);
  box-shadow: var(--shadow-sm);
}

.checkbox-text {
  font-size: 0.8125rem;
  color: var(--text-primary);
}

.option-description {
  margin: 6px 0 0 28px;
  font-size: 0.6875rem;
  color: var(--text-secondary);
  line-height: 1.3;
}

/* 文本输入框样式 */
.input-label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.8125rem;
}

.input-text {
  font-size: 0.8125rem;
  color: var(--text-primary);
  margin-bottom: 3px;
}

.text-input {
  padding: 10px 14px;
  border: 2px solid var(--gray-300);
  border-radius: 10px;
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: 0.8125rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  font-family: inherit;
}

.text-input:focus {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
  transform: translateY(-1px);
}

.text-input:hover:not(:focus) {
  border-color: var(--primary-400);
}

.text-input::placeholder {
  color: var(--text-secondary);
  opacity: 0.7;
}

.error-footer {
  padding: 20px 24px;
  text-align: center;
  border-top: 1px solid var(--gray-200);
  background: var(--bg-surface-variant);
}

.ok-btn {
  padding: 12px 32px;
  background: var(--primary-500);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.875rem;
  box-shadow: var(--shadow-sm);
  min-width: 100px;
}

.ok-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  filter: brightness(1.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding: 0;
  }
  
  .header {
    padding: 12px 0 0 0;
    margin-bottom: 12px;
  }
  
  .help-toggle {
    top: 10px;
    left: 10px;
  }
  
  .language-toggle {
    top: 10px;
    right: 60px;
  }
  
  .theme-toggle {
    top: 10px;
    right: 10px;
  }
  
  .help-btn,
  .language-btn,
  .theme-btn {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }
  
  .main-content {
    margin: 0 10px 12px 10px;
    padding: 16px;
    border-radius: 16px;
  }
  
  .tool-buttons {
    flex-direction: column;
    gap: 6px;
  }
  
  .file-actions {
    flex-direction: column;
    gap: 6px;
  }
  
  .header h1 {
    font-size: 1.625rem;
    margin: 4px 0 2px 0;
  }
  
  .logo {
    width: 40px;
    height: 40px;
    margin-bottom: 6px;
  }
  
  .subtitle {
    font-size: 0.8125rem;
  }
  
  .process-btn {
    padding: 10px 20px;
    font-size: 0.8125rem;
    min-width: 120px;
  }
  
  .error-dialog {
    margin: 12px;
    width: calc(100% - 24px);
  }
  
  h3 {
    font-size: 1rem;
    margin-bottom: 10px;
  }
  
  .tool-selection,
  .file-selection,
  .process-section,
  .results {
    margin-bottom: 12px;
  }
  
  .process-section {
    margin-top: 16px;
  }
}
</style>