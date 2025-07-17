<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

// 工具类型枚举
enum ToolType {
  AneuFiler = 'AneuFiler',
  Aneu23 = 'Aneu23',
  SHCarrier = 'SHCarrier',
}

// 工具配置接口
interface ToolConfig {
  name: ToolType;
  label: string;
  supportsStdSample: boolean;
  supportsWindowsOptimization: boolean;
}

// 处理选项接口
interface ProcessOptions {
  toolName: ToolType;
  filePaths: string[];
  useAreaData: boolean;
  stdSampleName?: string;
  windowsOptimization?: boolean;
  language: string;
  [key: string]: unknown;
}

// 处理结果接口
interface ProcessResult {
  success: boolean;
  message: string;
  error?: string;
  file_path?: string;
}

// 获取应用版本号
const appVersion = (globalThis as any).__APP_VERSION__ || '2.1.0';

const selectedFiles = ref<string[]>([]);
const selectedTool = ref<ToolType>(ToolType.AneuFiler);
const useAreaData = ref<boolean>(false);
const stdSampleName = ref<string>("STD");
const windowsOptimization = ref<boolean>(true); // Windows系统优化，默认选中
const processing = ref<boolean>(false);
const results = ref<ProcessResult[]>([]);
const showErrorDialog = ref<boolean>(false);
const errorMessages = ref<string[]>([]);
const isDarkMode = ref<boolean>(true); // 默认暗色模式
const currentLanguage = ref<string>('zh'); // 默认中文

// 工具配置数组
const tools: ToolConfig[] = [
  {
    name: ToolType.AneuFiler,
    label: 'AneuFiler',
    supportsStdSample: false,
    supportsWindowsOptimization: false,
  },
  {
    name: ToolType.Aneu23,
    label: 'Aneu23',
    supportsStdSample: true,
    supportsWindowsOptimization: false,
  },
  {
    name: ToolType.SHCarrier,
    label: 'SHCarrier',
    supportsStdSample: true,
    supportsWindowsOptimization: true,
  },
];

// 获取当前选中工具的配置
const getCurrentToolConfig = (): ToolConfig => {
  return tools.find(tool => tool.name === selectedTool.value) || tools[0];
};

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
    openDirectoryError: '打开目录时出错:',
    clickToOpenDirectory: '点击打开文件所在目录',
    helpCenter: 'CMTools帮助中心',
    switchToLight: '切换到亮色模式',
    switchToDark: '切换到暗色模式',
    languageSwitch: '语言切换',
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
    openDirectoryError: 'Error opening directory:',
    clickToOpenDirectory: 'Click to open file directory',
    helpCenter: 'CMTools Help Center',
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode',
    languageSwitch: 'Language Switch',
  },
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
    const currentTool = getCurrentToolConfig();
    
    // 构建处理选项
    const options: ProcessOptions = {
      toolName: selectedTool.value,
      filePaths: selectedFiles.value,
      useAreaData: useAreaData.value,
      stdSampleName: currentTool.supportsStdSample ? stdSampleName.value : undefined,
      windowsOptimization: currentTool.supportsWindowsOptimization ? windowsOptimization.value : undefined,
      language: currentLanguage.value
    };
    
    const processResults = await invoke<ProcessResult[]>('process_files', options);
    
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

// 打开文件所在目录
async function openFileDirectory(filePath?: string) {
  if (!filePath) {
    return;
  }
  
  try {
    await invoke('open_file_directory', { filePath, language: currentLanguage.value });
  } catch (error) {
    console.error(t('openDirectoryError'), error);
    alert(`${t('openDirectoryError')} ${error}`);
  }
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
          <span>{{ currentLanguage === 'zh' ? '帮助' : 'Help' }}</span>
        </button>
      </div>
      <div class="version-display">
        <span class="version-text">v{{ appVersion }}</span>
      </div>
      <div class="language-toggle">
        <button @click="toggleLanguage" class="language-btn" :title="t('languageSwitch')">
          <span>{{ currentLanguage === 'zh' ? '中文' : 'EN' }}</span>
        </button>
      </div>
      <div class="theme-toggle">
        <button @click="toggleTheme" class="theme-btn" :title="isDarkMode ? t('switchToLight') : t('switchToDark')">
          <span>{{ isDarkMode ? (currentLanguage === 'zh' ? '暗' : 'Dark') : (currentLanguage === 'zh' ? '亮' : 'Light') }}</span>
        </button>
      </div>
      <h1>CMTools</h1>
      <p class="subtitle">{{ t('subtitle') }}</p>
    </header>

    <div class="main-content">
      <!-- 左侧内容区域 -->
      <div class="left-panel">
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
          <div class="option-item" v-if="getCurrentToolConfig().supportsWindowsOptimization">
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
          <div class="option-item" v-if="getCurrentToolConfig().supportsStdSample">
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
      </div>

      <!-- 右侧处理结果面板 -->
      <div v-if="results.length > 0" class="results-panel">
        <div class="results">
          <h3>{{ t('processResults') }}</h3>
          <div class="result-list">
            <div 
              v-for="(result, index) in results" 
              :key="index" 
              :class="['result-item', result.success ? 'success' : 'error']"
              @click="openFileDirectory(result.file_path)"
              :title="result.file_path ? t('clickToOpenDirectory') : ''"
            >
              <span class="result-icon">{{ result.success ? '✅' : '❌' }}</span>
              <span class="result-message">{{ result.message }}</span>
              <span v-if="result.file_path" class="open-folder-icon">📁</span>
            </div>
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
  /* 主色调 - 柔和的蓝绿色调 */
  --primary-50: #f0f9ff;
  --primary-100: #e0f2fe;
  --primary-200: #bae6fd;
  --primary-300: #7dd3fc;
  --primary-400: #38bdf8;
  --primary-500: #0ea5e9;
  --primary-600: #0284c7;
  --primary-700: #0369a1;
  --primary-800: #075985;
  --primary-900: #0c4a6e;
  
  /* 辅助色调 - 温和的紫色调 */
  --secondary-50: #faf5ff;
  --secondary-100: #f3e8ff;
  --secondary-200: #e9d5ff;
  --secondary-300: #d8b4fe;
  --secondary-400: #c084fc;
  --secondary-500: #a855f7;
  --secondary-600: #9333ea;
  --secondary-700: #7c3aed;
  --secondary-800: #6b21a8;
  --secondary-900: #581c87;
  
  /* 中性色 - 温暖的灰色调 */
  --gray-50: #fafaf9;
  --gray-100: #f5f5f4;
  --gray-200: #e7e5e4;
  --gray-300: #d6d3d1;
  --gray-400: #a8a29e;
  --gray-500: #78716c;
  --gray-600: #57534e;
  --gray-700: #44403c;
  --gray-800: #292524;
  --gray-900: #1c1917;
  
  /* 语义色彩 - 柔和版本 */
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #06b6d4;
  
  /* 背景和表面 */
  --bg-primary: linear-gradient(135deg, #0ea5e9 0%, #a855f7 100%);
  --bg-surface: #ffffff;
  --bg-surface-variant: var(--gray-50);
  
  /* 文本颜色 */
  --text-primary: var(--gray-800);
  --text-secondary: var(--gray-600);
  --text-on-primary: #ffffff;
  
  /* 阴影 - 更柔和的阴影 */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.03);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.08), 0 4px 6px rgba(0, 0, 0, 0.03);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.02);
}

/* 暗色主题 */
.dark-theme {
  /* 主色调 - 柔和的暗色蓝绿色调 */
  --primary-50: #0c4a6e;
  --primary-100: #075985;
  --primary-200: #0369a1;
  --primary-300: #0284c7;
  --primary-400: #0ea5e9;
  --primary-500: #38bdf8;
  --primary-600: #7dd3fc;
  --primary-700: #bae6fd;
  --primary-800: #e0f2fe;
  --primary-900: #f0f9ff;
  
  /* 辅助色调 - 温和的暗色紫色调 */
  --secondary-50: #581c87;
  --secondary-100: #6b21a8;
  --secondary-200: #7c3aed;
  --secondary-300: #9333ea;
  --secondary-400: #a855f7;
  --secondary-500: #c084fc;
  --secondary-600: #d8b4fe;
  --secondary-700: #e9d5ff;
  --secondary-800: #f3e8ff;
  --secondary-900: #faf5ff;
  
  /* 中性色 - 温暖的暗色调 */
  --gray-50: #1c1917;
  --gray-100: #292524;
  --gray-200: #44403c;
  --gray-300: #57534e;
  --gray-400: #78716c;
  --gray-500: #a8a29e;
  --gray-600: #d6d3d1;
  --gray-700: #e7e5e4;
  --gray-800: #f5f5f4;
  --gray-900: #fafaf9;
  
  /* 语义色彩 - 暗色柔和版本 */
  --success: #16a34a;
  --warning: #d97706;
  --error: #dc2626;
  --info: #0891b2;
  
  /* 背景和表面 - 暗色版本 */
  --bg-primary: linear-gradient(135deg, #0c4a6e 0%, #581c87 100%);
  --bg-surface: #292524;
  --bg-surface-variant: #44403c;
  
  /* 文本颜色 - 暗色版本 */
  --text-primary: var(--gray-800);
  --text-secondary: var(--gray-600);
  --text-on-primary: #ffffff;
  
  /* 阴影 - 柔和的暗色阴影 */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.2), 0 4px 6px rgba(0, 0, 0, 0.08);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.1);
}
</style>

<style scoped>
.container {
  min-height: 100vh;
  background: var(--bg-primary);
  padding: 0 0 32px 0;
  font-family: 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  transition: all 0.3s ease;
}

.header {
  text-align: center;
  margin-bottom: 16px;
  padding: 8px 0 0 0;
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
  font-size: 14px;
}



.header h1 {
  margin: 0 0 2px 0;
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
  max-width: 1400px;
  margin: 0 auto 48px auto;
  background: var(--bg-surface);
  border-radius: 20px;
  padding: 20px;
  box-shadow: var(--shadow-xl);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  display: flex;
  gap: 20px;
  align-items: stretch; /* 改为 stretch 以便子元素等高 */
}

/* 左侧面板 */
.left-panel {
  flex: 1;
  min-width: 0;
}

/* 右侧结果面板 */
.results-panel {
  flex: 1;
  min-width: 0;
  background: var(--bg-surface-variant);
  border-radius: 16px;
  padding: 16px;
  border: none; /* 移除边框 */
  transition: all 0.3s ease;
  display: flex; /* 使用 flex 布局 */
  flex-direction: column; /* 垂直排列 */
  min-height: 0;
}

.dark-theme .results-panel {
  background: var(--gray-100);
}

.tool-selection,
.file-selection,
.process-section,
.results {
  margin-bottom: 16px;
}

/* 响应式布局 - 窄屏时垂直排列 */
@media (max-width: 1024px) {
  .main-content {
    flex-direction: column;
    max-width: 800px;
  }

  .left-panel,
  .results-panel {
    width: 100%;
  }
  
  .results-panel {
    margin-top: 16px;
  }
}

/* 移动端优化 */
@media (max-width: 768px) {
  .main-content {
    margin: 0 16px 32px 16px;
    padding: 16px;
  }
  
  .results-panel {
    padding: 12px;
  }
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
  max-height: 100px; /* 增加最大高度 */
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--gray-400) transparent;
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
  background: transparent;
  border-radius: 0;
  padding: 0;
  border: none;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-height: 0;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto; /* 内容超出时显示滚动条 */
  flex-grow: 1; /* 占据剩余空间 */
  max-height: 600px; /* Limit height to roughly 12 items */
  scrollbar-width: thin;
  scrollbar-color: var(--gray-400) transparent;
}

/* Common scrollbar styles */
.file-list::-webkit-scrollbar,
.result-list::-webkit-scrollbar,
.error-content::-webkit-scrollbar {
  width: 6px;
}

.file-list::-webkit-scrollbar-track,
.result-list::-webkit-scrollbar-track,
.error-content::-webkit-scrollbar-track {
  background: transparent;
}

.file-list::-webkit-scrollbar-thumb,
.result-list::-webkit-scrollbar-thumb,
.error-content::-webkit-scrollbar-thumb {
  background: var(--gray-400);
  border-radius: 3px;
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
  cursor: pointer;
  position: relative;
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

.open-folder-icon {
  font-size: 1.125rem;
  opacity: 0.7;
  transition: all 0.3s ease;
  margin-left: auto;
}

.result-item:hover .open-folder-icon {
  opacity: 1;
  transform: scale(1.1);
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