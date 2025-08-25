<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

// 工具类型枚举
enum ToolType {
  AneuFiler = 'AneuFiler',
  Aneu23 = 'Aneu23',
  SMNFiler = 'SMNFiler',
  SHCarrier = 'SHCarrier',
  UPDFiler = 'UPDFiler',
}

// 工具配置接口
interface ToolConfig {
  name: ToolType;
  label: string;
  supportsStdSample: boolean;
  supportsWindowsOptimization: boolean;
  supportsAreaData: boolean; // 新增：是否支持峰面积数据选项
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
const appVersion = (globalThis as any).__APP_VERSION__ || '2.3.1';

const selectedFiles = ref<string[]>([]);
const selectedTool = ref<ToolType>(ToolType.AneuFiler);
const useAreaData = ref<boolean>(false);
const stdSampleName = ref<string>("STD");
const windowsOptimization = ref<boolean>(true); // Windows系统优化，默认选中
const processing = ref<boolean>(false);
const results = ref<ProcessResult[]>([]);
const showErrorDialog = ref<boolean>(false);
const errorMessages = ref<string[]>([]);
const showVersionDialog = ref<boolean>(false);
const isDarkMode = ref<boolean>(true); // 默认暗色模式
const currentLanguage = ref<string>('zh'); // 默认中文

// 工具配置数组
const tools: ToolConfig[] = [
  {
    name: ToolType.AneuFiler,
    label: 'AneuFiler',
    supportsStdSample: false,
    supportsWindowsOptimization: false,
    supportsAreaData: true,
  },
  {
    name: ToolType.Aneu23,
    label: 'Aneu23',
    supportsStdSample: true,
    supportsWindowsOptimization: false,
    supportsAreaData: true,
  },
  {
    name: ToolType.SMNFiler,
    label: 'SMNFiler',
    supportsStdSample: true,
    supportsWindowsOptimization: true,
    supportsAreaData: true,
  },
  {
    name: ToolType.SHCarrier,
    label: 'SHCarrier',
    supportsStdSample: true,
    supportsWindowsOptimization: true,
    supportsAreaData: true,
  },
  {
    name: ToolType.UPDFiler,
    label: 'UPDFiler',
    supportsStdSample: false,
    supportsWindowsOptimization: true,
    supportsAreaData: false, // UPDFiler 不支持峰面积数据选项
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
    helpBtn: '帮助',
    languageBtn: '中文',
    themeBtnDark: '暗',
    themeBtnLight: '亮',
    versionUpdateTitle: '版本更新检查',
    versionUpdateMessage: '暂不支持进行版本更新检查，请查看帮助中心获取最新版软件',
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
    helpBtn: 'Help',
    languageBtn: 'EN',
    themeBtnDark: 'Dark',
    themeBtnLight: 'Light',
    versionUpdateTitle: 'Version Update Check',
    versionUpdateMessage: 'Version update check is not currently supported. Please visit the help center to get the latest software version',
  },
};

// 打字机动画状态
const typewriterTexts = ref<Record<string, string>>({});
const typingStates = ref<Record<string, boolean>>({});
const isTyping = ref(false);

// 获取翻译文本
function t(key: string): string {
  return translations[currentLanguage.value as keyof typeof translations]?.[key as keyof typeof translations.zh] || key;
}

// 获取打字机显示文本
function getTypewriterText(key: string): string {
  return typewriterTexts.value[key] || '';
}

// 检查是否正在打字
function isTextTyping(key: string): boolean {
  return typingStates.value[key] || false;
}

// 淡出效果函数
function fadeOutEffect(duration: number): Promise<void> {
  return new Promise((resolve) => {
    // 设置淡出状态
    isTyping.value = true;
    
    // 获取所有需要动画的文本元素
    const elements = document.querySelectorAll('.header h1 span, .subtitle span, .tool-selection h3 span, .file-selection h3 span, .process-options h3 span, .results h3 span, .selected-files h4 span, .option-description span, .tool-btn span, .file-actions button span, .process-btn span, .checkbox-text span, .input-text span, .close-btn span, .ok-btn span, .error-item span, .error-header h3 span, .help-btn span, .language-btn span, .theme-btn span, .version-text span');
    
    // 添加淡出效果
    elements.forEach(el => {
      (el as HTMLElement).style.opacity = '0';
    });
    
    // 等待动画完成
    setTimeout(() => {
      resolve();
    }, duration);
  });
}

// 淡入效果函数
function fadeInEffect(duration: number): Promise<void> {
  return new Promise((resolve) => {
    // 更新所有文本内容
    const newLang = translations[currentLanguage.value as keyof typeof translations];
    Object.keys(newLang).forEach(key => {
      typewriterTexts.value[key] = newLang[key as keyof typeof newLang];
    });
    
    // 等待 Vue 更新 DOM
    nextTick(() => {
      // 获取所有需要动画的文本元素
       const elements = document.querySelectorAll('.header h1 span, .subtitle span, .tool-selection h3 span, .file-selection h3 span, .process-options h3 span, .results h3 span, .selected-files h4 span, .option-description span, .tool-btn span, .file-actions button span, .process-btn span, .checkbox-text span, .input-text span, .close-btn span, .ok-btn span, .error-item span, .error-header h3 span, .help-btn span, .language-btn span, .theme-btn span, .version-text span');
      
      // 添加淡入效果
      elements.forEach(el => {
        (el as HTMLElement).style.opacity = '1';
      });
      
      // 等待动画完成
      setTimeout(() => {
        isTyping.value = false;
        resolve();
      }, duration);
    });
  });
}

// 完整的淡出淡入效果函数
function fadeEffect(): Promise<void> {
  return new Promise(async (resolve) => {
    // 每个阶段1秒，总共2秒
    const phaseDuration = 1000;
    
    // 先执行淡出效果
    await fadeOutEffect(phaseDuration);
    
    // 再执行淡入效果
    await fadeInEffect(phaseDuration);
    
    resolve();
  });
}

// 执行淡出淡入动画
async function executeTypewriterAnimations() {
  // 执行淡出淡入效果
  await fadeEffect();
}

// 单独为特定文本执行打字机动画（保留以备将来使用）
// async function animateSpecificText(key: string, delay: number = 0) {
//   const targetText = t(key);
//   await typewriterEffect(key, targetText, delay);
// }

// 语言切换
async function toggleLanguage() {
  if (isTyping.value) return; // 如果正在打字，忽略切换请求
  
  // 切换语言
  const newLanguage = currentLanguage.value === 'zh' ? 'en' : 'zh';
  currentLanguage.value = newLanguage;
  localStorage.setItem('language', newLanguage);
  
  // 执行打字机动画
  await executeTypewriterAnimations();
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
      useAreaData: currentTool.supportsAreaData ? useAreaData.value : false,
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

// 显示版本更新对话框
function showVersionUpdateDialog() {
  showVersionDialog.value = true;
}

// 关闭版本更新对话框
function closeVersionDialog() {
  showVersionDialog.value = false;
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
  
  // 初始化所有打字机文本
  const initialLang = translations[currentLanguage.value as keyof typeof translations];
  Object.keys(initialLang).forEach(key => {
    typewriterTexts.value[key] = initialLang[key as keyof typeof initialLang];
  });
});
</script>

<template>
  <main class="container">
    <header class="header">
      <div class="help-toggle">
        <button @click="openHelpCenter" class="help-btn" :title="t('helpCenter')">
          <span><span>{{ getTypewriterText('helpBtn') || t('helpBtn') }}</span></span>
        </button>
      </div>
      <div class="version-display">
        <button @click="showVersionUpdateDialog" class="version-btn" :title="t('versionUpdateTitle')">
          <span class="version-text"><span>v{{ appVersion }}</span></span>
        </button>
      </div>
      <div class="language-toggle">
        <button @click="toggleLanguage" class="language-btn" :title="t('languageSwitch')">
          <span><span>{{ getTypewriterText('languageBtn') || t('languageBtn') }}</span></span>
        </button>
      </div>
      <div class="theme-toggle">
        <button @click="toggleTheme" class="theme-btn" :title="isDarkMode ? t('switchToLight') : t('switchToDark')">
          <span><span>{{ getTypewriterText(isDarkMode ? 'themeBtnDark' : 'themeBtnLight') || t(isDarkMode ? 'themeBtnDark' : 'themeBtnLight') }}</span></span>
        </button>
      </div>
      <h1><span>CMTools</span></h1>
      <p class="subtitle" :class="{ 'typewriter-text': isTextTyping('subtitle'), 'typing-complete': !isTextTyping('subtitle') && getTypewriterText('subtitle') }"><span>{{ getTypewriterText('subtitle') || t('subtitle') }}</span></p>
    </header>

    <div class="main-content">
      <!-- 左侧内容区域 -->
      <div class="left-panel">
        <!-- 工具选择 -->
        <div class="tool-selection">
          <h3 :class="{ 'typewriter-text': isTextTyping('selectTool'), 'typing-complete': !isTextTyping('selectTool') && getTypewriterText('selectTool') }"><span>{{ getTypewriterText('selectTool') || t('selectTool') }}</span></h3>
          <div class="tool-buttons">
            <button 
              v-for="tool in tools" 
              :key="tool.name"
              :class="['tool-btn', { active: selectedTool === tool.name }]"
              @click="selectedTool = tool.name"
            >
              <span>{{ tool.label }}</span>
            </button>
          </div>
        </div>

        <!-- 文件选择 -->
        <div class="file-selection">
          <h3 :class="{ 'typewriter-text': isTextTyping('fileProcessing'), 'typing-complete': !isTextTyping('fileProcessing') && getTypewriterText('fileProcessing') }"><span>{{ getTypewriterText('fileProcessing') || t('fileProcessing') }}</span></h3>
          <div class="file-actions">
            <button @click="selectFiles" class="select-btn">
              <span>{{ getTypewriterText('selectFilesBtn') || t('selectFilesBtn') }}</span>
            </button>
            <button @click="clearFiles" class="clear-btn" v-if="selectedFiles.length > 0">
              <span>{{ getTypewriterText('clearBtn') || t('clearBtn') }}</span>
            </button>
          </div>
          
          <div v-if="selectedFiles.length > 0" class="selected-files">
            <h4 :class="{ 'typewriter-text': isTextTyping('selectedFiles'), 'typing-complete': !isTextTyping('selectedFiles') && getTypewriterText('selectedFiles') }"><span>{{ getTypewriterText('selectedFiles') || t('selectedFiles') }} ({{ selectedFiles.length }})</span></h4>
            <div class="file-list">
              <div v-for="(file, index) in selectedFiles" :key="index" class="file-item">
                📄 {{ file.split('\\').pop() || file.split('/').pop() }}
              </div>
            </div>
          </div>
        </div>

        <!-- 处理选项 -->
        <div class="process-options" v-if="selectedFiles.length > 0">
          <h3 :class="{ 'typewriter-text': isTextTyping('processOptions'), 'typing-complete': !isTextTyping('processOptions') && getTypewriterText('processOptions') }"><span>{{ getTypewriterText('processOptions') || t('processOptions') }}</span></h3>
          <div class="option-item" v-if="getCurrentToolConfig().supportsAreaData">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="useAreaData" 
                class="checkbox-input"
              />
              <span class="checkbox-custom"></span>
              <span class="checkbox-text"><span>{{ getTypewriterText('useAreaData') || t('useAreaData') }}</span></span>
            </label>
            <p class="option-description"><span>{{ getTypewriterText('useAreaDataDesc') || t('useAreaDataDesc') }}</span></p>
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
              <span class="checkbox-text"><span>{{ getTypewriterText('windowsOptimization') || t('windowsOptimization') }}</span></span>
            </label>
            <p class="option-description"><span>{{ getTypewriterText('windowsOptimizationDesc') || t('windowsOptimizationDesc') }}</span></p>
          </div>
          
          <!-- 标准品样本名称配置 -->
          <div class="option-item" v-if="getCurrentToolConfig().supportsStdSample">
            <label class="input-label">
              <span class="input-text"><span>{{ getTypewriterText('stdSampleName') || t('stdSampleName') }}</span></span>
              <input 
                type="text" 
                v-model="stdSampleName" 
                class="text-input"
                placeholder="STD"
              />
            </label>
            <p class="option-description"><span>{{ getTypewriterText('stdSampleNameDesc') || t('stdSampleNameDesc') }}</span></p>
          </div>
        </div>

        <!-- 处理按钮 -->
        <div class="process-section">
          <button 
            @click="processFiles" 
            :disabled="selectedFiles.length === 0 || processing"
            class="process-btn"
          >
            <span v-if="processing">{{ getTypewriterText('processing') || t('processing') }}</span>
            <span v-else>{{ getTypewriterText('startProcess') || t('startProcess') }}</span>
           </button>
         </div>
      </div>

      <!-- 右侧处理结果面板 -->
      <div v-if="results.length > 0" class="results-panel">
        <div class="results">
          <h3 :class="{ 'typewriter-text': isTextTyping('processResults'), 'typing-complete': !isTextTyping('processResults') && getTypewriterText('processResults') }"><span>{{ getTypewriterText('processResults') || t('processResults') }}</span></h3>
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
          <h3><span>{{ getTypewriterText('processError') || t('processError') }}</span></h3>
          <button @click="closeErrorDialog" class="close-btn"><span>×</span></button>
        </div>
        <div class="error-content">
          <div v-for="(error, index) in errorMessages" :key="index" class="error-item">
            <span>{{ error }}</span>
          </div>
        </div>
        <div class="error-footer">
          <button @click="closeErrorDialog" class="ok-btn"><span>{{ getTypewriterText('confirm') || t('confirm') }}</span></button>
        </div>
      </div>
    </div>

    <!-- 版本更新对话框 -->
    <div v-if="showVersionDialog" class="error-dialog-overlay" @click="closeVersionDialog">
      <div class="error-dialog" @click.stop>
        <div class="error-header">
          <h3><span>{{ getTypewriterText('versionUpdateTitle') || t('versionUpdateTitle') }}</span></h3>
          <button @click="closeVersionDialog" class="close-btn"><span>×</span></button>
        </div>
        <div class="error-content">
          <div class="error-item">
            <span>{{ getTypewriterText('versionUpdateMessage') || t('versionUpdateMessage') }}</span>
          </div>
        </div>
        <div class="error-footer">
          <button @click="closeVersionDialog" class="ok-btn"><span>{{ getTypewriterText('confirm') || t('confirm') }}</span></button>
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
  scroll-behavior: smooth;
}

#app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}

/* 全局动画优化 */
* {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 页面加载动画 */
@keyframes pageLoad {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.container {
  animation: pageLoad 0.8s var(--ease-out-cubic);
}

/* 打字机效果样式 */
@keyframes typewriterCursor {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

.typewriter-text {
  position: relative;
  display: inline-block;
}

.typewriter-text::after {
  content: '|';
  color: var(--primary-500);
  animation: typewriterCursor 1s infinite;
  margin-left: 2px;
}

.typewriter-text.typing-complete::after {
  display: none;
}

/* 打字机文本过渡效果 */
.typewriter-transition {
  transition: all 0.3s ease;
  min-height: 1.2em;
  display: inline-block;
}

/* 悬浮粒子效果 */
@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  33% {
    transform: translateY(-10px) rotate(1deg);
  }
  66% {
    transform: translateY(5px) rotate(-1deg);
  }
}

/* 渐入动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 为各个区域添加渐入动画 */
.tool-selection {
  animation: fadeInUp 0.6s var(--ease-out-cubic) 0.1s both;
}

.file-selection {
  animation: fadeInUp 0.6s var(--ease-out-cubic) 0.2s both;
}

.process-options {
  animation: fadeInUp 0.6s var(--ease-out-cubic) 0.3s both;
}

.process-section {
  animation: fadeInUp 0.6s var(--ease-out-cubic) 0.4s both;
}

.results-panel {
  animation: fadeInUp 0.6s var(--ease-out-cubic) 0.5s both;
}

/* CSS变量定义 - 亮色主题 */
:root {
  /* 主色调 - 现代蓝紫渐变 */
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
  
  /* 辅助色调 - 炫彩紫色 */
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
  
  /* 中性色 - 现代灰色调 */
  --gray-50: #fafafa;
  --gray-100: #f4f4f5;
  --gray-200: #e4e4e7;
  --gray-300: #d4d4d8;
  --gray-400: #a1a1aa;
  --gray-500: #71717a;
  --gray-600: #52525b;
  --gray-700: #3f3f46;
  --gray-800: #27272a;
  --gray-900: #18181b;
  
  /* 语义色彩 - 现代版本 */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #06b6d4;
  
  /* 背景和表面 - 玻璃拟态设计 */
  --bg-primary: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  --bg-surface: rgba(255, 255, 255, 0.85);
  --bg-surface-variant: rgba(255, 255, 255, 0.6);
  --bg-glass: rgba(255, 255, 255, 0.25);
  --bg-glass-hover: rgba(255, 255, 255, 0.35);
  
  /* 文本颜色 */
  --text-primary: var(--gray-800);
  --text-secondary: var(--gray-600);
  --text-on-primary: #ffffff;
  
  /* 高级阴影系统 */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.03);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15), 0 10px 10px rgba(0, 0, 0, 0.04);
  --shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.25);
  --shadow-glow: 0 0 20px rgba(102, 126, 234, 0.4);
  --shadow-glow-purple: 0 0 20px rgba(168, 85, 247, 0.4);
  
  /* 动画缓动函数 */
  --ease-out-cubic: cubic-bezier(0.33, 1, 0.68, 1);
  --ease-in-out-cubic: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* 暗色主题 */
.dark-theme {
  /* 主色调 - 现代暗色蓝紫渐变 */
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
  
  /* 辅助色调 - 炫彩暗色紫色 */
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
  
  /* 中性色 - 现代暗色调 */
  --gray-50: #18181b;
  --gray-100: #27272a;
  --gray-200: #3f3f46;
  --gray-300: #52525b;
  --gray-400: #71717a;
  --gray-500: #a1a1aa;
  --gray-600: #d4d4d8;
  --gray-700: #e4e4e7;
  --gray-800: #f4f4f5;
  --gray-900: #fafafa;
  
  /* 语义色彩 - 现代暗色版本 */
  --success: #059669;
  --warning: #d97706;
  --error: #dc2626;
  --info: #0891b2;
  
  /* 背景和表面 - 暗色玻璃拟态设计 */
  --bg-primary: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #581c87 100%);
  --bg-surface: rgba(39, 39, 42, 0.85);
  --bg-surface-variant: rgba(63, 63, 70, 0.6);
  --bg-glass: rgba(255, 255, 255, 0.1);
  --bg-glass-hover: rgba(255, 255, 255, 0.15);
  
  /* 文本颜色 - 暗色版本 */
  --text-primary: var(--gray-800);
  --text-secondary: var(--gray-600);
  --text-on-primary: #ffffff;
  
  /* 高级暗色阴影系统 */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.25), 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.3), 0 10px 10px rgba(0, 0, 0, 0.15);
  --shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.4);
  --shadow-glow: 0 0 20px rgba(56, 189, 248, 0.3);
  --shadow-glow-purple: 0 0 20px rgba(192, 132, 252, 0.3);
}
</style>

<style scoped>
.container {
  min-height: 100vh;
  background: var(--bg-primary);
  padding: 0 0 32px 0;
  font-family: 'Inter', 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  transition: all 0.6s var(--ease-out-cubic);
  position: relative;
  overflow-x: hidden;
}

.container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.2) 0%, transparent 50%);
  pointer-events: none;
  animation: backgroundFloat 20s ease-in-out infinite;
}

@keyframes backgroundFloat {
  0%, 100% { opacity: 1; transform: translateY(0px); }
  50% { opacity: 0.8; transform: translateY(-10px); }
}

.header {
  text-align: center;
  margin-bottom: 24px;
  padding: 16px 0;
  color: var(--text-on-primary);
  position: relative;
  z-index: 10;
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
  left: 96px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.version-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  transition: all 0.3s var(--ease-out-cubic);
  border-radius: 12px;
}

.version-btn:hover {
  transform: translateY(-2px) scale(1.05);
  filter: brightness(1.1);
}

.version-btn:active {
  transform: translateY(0) scale(0.98);
}

.version-text {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 600;
  background: var(--bg-glass);
  width: 64px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.4s var(--ease-out-cubic);
  position: relative;
  overflow: hidden;
}

.version-text::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.version-text:hover {
  background: var(--bg-glass-hover);
  transform: translateY(-2px) scale(1.05);
  box-shadow: var(--shadow-glow);
  border-color: rgba(255, 255, 255, 0.3);
}

.version-text:hover::before {
  transform: translateX(100%);
}

.version-text:active {
  transform: translateY(0) scale(0.95);
  transition: all 0.1s ease;
}

.language-toggle {
  position: absolute;
  top: 16px;
  right: 96px;
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
  background: var(--bg-glass);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  width: 64px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.4s var(--ease-out-cubic);
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  position: relative;
  overflow: hidden;
}

.help-btn::before,
.language-btn::before,
.theme-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.help-btn:hover,
.language-btn:hover,
.theme-btn:hover {
  background: var(--bg-glass-hover);
  transform: translateY(-2px) scale(1.05);
  box-shadow: var(--shadow-glow);
  border-color: rgba(255, 255, 255, 0.3);
}

.help-btn:hover::before,
.language-btn:hover::before,
.theme-btn:hover::before {
  transform: translateX(100%);
}

.help-btn:active,
.language-btn:active,
.theme-btn:active {
  transform: translateY(0) scale(0.95);
  transition: all 0.1s ease;
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
  border-radius: 24px;
  padding: 32px;
  box-shadow: var(--shadow-2xl);
  backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.6s var(--ease-out-cubic);
  display: flex;
  gap: 32px;
  align-items: stretch;
  position: relative;
  overflow: hidden;
}

.main-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  pointer-events: none;
  border-radius: 24px;
}

.main-content:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-2xl), var(--shadow-glow);
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
  padding: 14px 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: var(--bg-glass);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.4s var(--ease-out-cubic);
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.875rem;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(20px);
  letter-spacing: 0.025em;
}

.tool-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s var(--ease-out-cubic);
}

.tool-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(168, 85, 247, 0.1));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.tool-btn:hover::before {
  left: 100%;
}

.tool-btn:hover {
  border-color: var(--primary-400);
  transform: translateY(-3px) scale(1.02);
  box-shadow: var(--shadow-xl), var(--shadow-glow);
}

.tool-btn:hover::after {
  opacity: 1;
}

.tool-btn.active {
  background: linear-gradient(135deg, var(--primary-500), var(--secondary-500));
  color: var(--text-on-primary);
  border-color: var(--primary-500);
  box-shadow: var(--shadow-lg), var(--shadow-glow);
  transform: translateY(-2px);
}

.tool-btn.active::after {
  opacity: 0;
}

.tool-btn:active {
  transform: translateY(-1px) scale(0.98);
  transition: all 0.1s ease;
}

.file-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.select-btn,
.clear-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.4s var(--ease-out-cubic);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
  letter-spacing: 0.025em;
}

.select-btn::before,
.clear-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s ease;
}

.select-btn {
  background: linear-gradient(135deg, var(--success), #059669);
  color: white;
  box-shadow: var(--shadow-md);
}

.select-btn:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: var(--shadow-xl), 0 0 20px rgba(16, 185, 129, 0.4);
}

.select-btn:hover::before {
  left: 100%;
}

.clear-btn {
  background: linear-gradient(135deg, var(--error), #dc2626);
  color: white;
  box-shadow: var(--shadow-md);
}

.clear-btn:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: var(--shadow-xl), 0 0 20px rgba(239, 68, 68, 0.4);
}

.clear-btn:hover::before {
  left: 100%;
}

.select-btn:active,
.clear-btn:active {
  transform: translateY(-1px) scale(0.98);
  transition: all 0.1s ease;
}

.selected-files {
  background: var(--bg-surface-variant);
  border-radius: 16px;
  padding: 20px;
  border-left: 4px solid var(--primary-500);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  position: relative;
  overflow: hidden;
  transition: all 0.3s var(--ease-out-cubic);
}

.selected-files::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.05), rgba(168, 85, 247, 0.05));
  pointer-events: none;
}

.selected-files:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
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
  padding: 16px 32px;
  border: none;
  border-radius: 20px;
  background: linear-gradient(135deg, var(--primary-500), var(--secondary-500));
  color: white;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.4s var(--ease-out-cubic);
  box-shadow: var(--shadow-xl), var(--shadow-glow);
  position: relative;
  overflow: hidden;
  min-width: 160px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.process-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.8s var(--ease-out-cubic);
}

.process-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.process-btn:hover:not(:disabled)::before {
  left: 100%;
}

.process-btn:hover:not(:disabled)::after {
  opacity: 1;
}

.process-btn:hover:not(:disabled) {
  transform: translateY(-4px) scale(1.05);
  box-shadow: var(--shadow-2xl), var(--shadow-glow-purple);
  background: linear-gradient(135deg, var(--primary-400), var(--secondary-400));
}

.process-btn:active:not(:disabled) {
  transform: translateY(-2px) scale(1.02);
  transition: all 0.1s ease;
}

.process-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  filter: grayscale(0.5);
  box-shadow: var(--shadow-md);
}

.process-btn:disabled::before,
.process-btn:disabled::after {
  display: none;
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
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(20px);
  animation: overlayFadeIn 0.4s var(--ease-out-cubic);
}

@keyframes overlayFadeIn {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(20px);
  }
}

.error-dialog {
  background: var(--bg-surface);
  border-radius: 24px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: var(--shadow-2xl);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(40px);
  animation: dialogSlideIn 0.5s var(--ease-spring);
  position: relative;
}

.error-dialog::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  pointer-events: none;
  border-radius: 24px;
}

@keyframes dialogSlideIn {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.9) rotateX(10deg);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1) rotateX(0deg);
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
  border-radius: 16px;
  padding: 20px;
  border-left: 4px solid var(--primary-500);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  position: relative;
  overflow: hidden;
  transition: all 0.3s var(--ease-out-cubic);
}

.process-options::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.05), rgba(168, 85, 247, 0.05));
  pointer-events: none;
}

.process-options:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
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
  width: 20px;
  height: 20px;
  border: 2px solid var(--gray-300);
  border-radius: 8px;
  margin-right: 12px;
  position: relative;
  transition: all 0.4s var(--ease-spring);
  background: var(--bg-glass);
  flex-shrink: 0;
  backdrop-filter: blur(10px);
  box-shadow: var(--shadow-sm);
}

/* 暗色模式下的复选框边框 */
.dark-theme .checkbox-custom {
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: var(--shadow-sm), inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}

.checkbox-input:checked + .checkbox-custom {
  background: linear-gradient(135deg, var(--primary-500), var(--secondary-500));
  border-color: var(--primary-500);
  transform: scale(1.1) rotate(5deg);
  box-shadow: var(--shadow-glow);
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(1.2);
  color: white;
  font-size: 12px;
  font-weight: bold;
  animation: checkmarkPop 0.3s var(--ease-spring);
}

@keyframes checkmarkPop {
  0% { transform: translate(-50%, -50%) scale(0) rotate(180deg); }
  50% { transform: translate(-50%, -50%) scale(1.3) rotate(0deg); }
  100% { transform: translate(-50%, -50%) scale(1.2) rotate(0deg); }
}

.checkbox-custom:hover {
  border-color: var(--primary-400);
  transform: scale(1.05);
  box-shadow: var(--shadow-md), 0 0 10px rgba(14, 165, 233, 0.3);
  background: var(--bg-glass-hover);
}

/* 亮色模式下的复选框悬停效果增强 */
:root .checkbox-custom:hover {
  border-color: var(--primary-500);
  box-shadow: var(--shadow-lg), 0 0 15px rgba(14, 165, 233, 0.4), inset 0 0 0 1px rgba(14, 165, 233, 0.2);
}

/* 暗色模式下保持原有悬停效果 */
.dark-theme .checkbox-custom:hover {
  border-color: var(--primary-400);
  box-shadow: var(--shadow-md), 0 0 10px rgba(14, 165, 233, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.2);
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
  padding: 12px 16px;
  border: 2px solid var(--gray-300);
  border-radius: 12px;
  background: var(--bg-glass);
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: all 0.4s var(--ease-out-cubic);
  outline: none;
  font-family: inherit;
  backdrop-filter: blur(20px);
  position: relative;
  box-shadow: var(--shadow-sm);
}

/* 暗色模式下的文本输入框边框 */
.dark-theme .text-input {
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: var(--shadow-sm), inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}

.text-input:focus {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.15), var(--shadow-glow);
  transform: translateY(-2px) scale(1.02);
  background: var(--bg-glass-hover);
}

.text-input:hover:not(:focus) {
  border-color: var(--primary-400);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
  background: var(--bg-glass-hover);
}

/* 亮色模式下的文本输入框聚焦和悬停效果增强 */
:root .text-input:focus {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.15), var(--shadow-glow), inset 0 0 0 1px rgba(14, 165, 233, 0.2);
}

:root .text-input:hover:not(:focus) {
  border-color: var(--primary-500);
  box-shadow: var(--shadow-lg), 0 0 10px rgba(14, 165, 233, 0.2), inset 0 0 0 1px rgba(14, 165, 233, 0.1);
}

/* 暗色模式下保持原有效果并增强 */
.dark-theme .text-input:focus {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.15), var(--shadow-glow), inset 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.dark-theme .text-input:hover:not(:focus) {
  border-color: var(--primary-400);
  box-shadow: var(--shadow-md), 0 0 8px rgba(14, 165, 233, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.15);
}

.text-input::placeholder {
  color: var(--text-secondary);
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

.text-input:focus::placeholder {
  opacity: 0.5;
}

.error-footer {
  padding: 20px 24px;
  text-align: center;
  border-top: 1px solid var(--gray-200);
  background: var(--bg-surface-variant);
}

.ok-btn {
  padding: 14px 36px;
  background: linear-gradient(135deg, var(--primary-500), var(--secondary-500));
  color: white;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.4s var(--ease-out-cubic);
  font-size: 0.875rem;
  box-shadow: var(--shadow-lg);
  min-width: 120px;
  position: relative;
  overflow: hidden;
  letter-spacing: 0.025em;
}

.ok-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s ease;
}

.ok-btn:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: var(--shadow-xl), var(--shadow-glow);
  background: linear-gradient(135deg, var(--primary-400), var(--secondary-400));
}

.ok-btn:hover::before {
  left: 100%;
}

.ok-btn:active {
  transform: translateY(-1px) scale(1.02);
  transition: all 0.1s ease;
}

/* 淡出淡入动画效果 */
.fade-transition {
  transition: opacity 1s ease-in-out;
}

.fade-out {
  opacity: 0;
}

.fade-in {
  opacity: 1;
}

/* 为所有需要动画的文本元素添加过渡效果 */
.header h1 span,
.subtitle span,
.tool-selection h3 span,
.file-selection h3 span,
.process-options h3 span,
.results h3 span,
.selected-files h4 span,
.option-description span,
.tool-btn span,
.file-actions button span,
.process-btn span,
.checkbox-text span,
.input-text span,
.close-btn span,
.ok-btn span,
.error-item span,
.error-header h3 span,
.help-btn span,
.language-btn span,
.theme-btn span,
.version-text span {
  transition: opacity 1s ease-in-out;
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