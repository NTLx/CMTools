<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

// 工具类型枚举
enum ToolType {
  AneuFiler = 'AneuFiler',
  Aneu23 = 'Aneu23',
  SMNFiler_v1 = 'SMNFiler_v1',
  SMNFiler_v2 = 'SMNFiler_v2',
  SHCarrier = 'SHCarrier',
  UPDFiler_v1 = 'UPDFiler_v1',
  UPDFiler_v2 = 'UPDFiler_v2',
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
  verboseLog?: boolean;
  language: string;
  [key: string]: unknown;
}

// 处理结果接口
interface ProcessResult {
  success: boolean;
  message: string;
  error?: string;
  file_path?: string;
  originalMessage?: string; // 存储原始消息键
  fileName?: string; // 存储文件名
}

// 获取应用版本号
const appVersion = (globalThis as any).__APP_VERSION__ || '2.6.6';

const selectedFiles = ref<string[]>([]);
const selectedTool = ref<ToolType>(ToolType.AneuFiler);
const useAreaData = ref<boolean>(false);
const stdSampleName = ref<string>("STD");
const windowsOptimization = ref<boolean>(true); // Windows系统优化，默认选中
const verboseLog = ref<boolean>(false); // 输出详细运行日志文件，默认不选中
const processing = ref<boolean>(false);
const results = ref<ProcessResult[]>([]);
const showErrorDialog = ref<boolean>(false);
const errorMessages = ref<string[]>([]);
const showVersionDialog = ref<boolean>(false);
const toolVersion = ref<string>('');
const loadingToolVersion = ref<boolean>(false);
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
    name: ToolType.SMNFiler_v1,
    label: 'SMNFiler_v1',
    supportsStdSample: true,
    supportsWindowsOptimization: true,
    supportsAreaData: true, // SMNFiler_v1 支持峰面积数据选项
  },
  {
    name: ToolType.SMNFiler_v2,
    label: 'SMNFiler_v2',
    supportsStdSample: true,
    supportsWindowsOptimization: true,
    supportsAreaData: false, // SMNFiler_v2 不支持峰面积数据选项
  },
  {
    name: ToolType.SHCarrier,
    label: 'SHCarrier',
    supportsStdSample: true,
    supportsWindowsOptimization: true,
    supportsAreaData: true,
  },
  {
    name: ToolType.UPDFiler_v1,
    label: 'UPDFiler_v1',
    supportsStdSample: false,
    supportsWindowsOptimization: true,
    supportsAreaData: false, // UPDFiler_v1 不支持峰面积数据选项
  },
  {
    name: ToolType.UPDFiler_v2,
    label: 'UPDFiler_v2',
    supportsStdSample: false,
    supportsWindowsOptimization: true,
    supportsAreaData: false, // UPDFiler_v2 不支持峰面积数据选项
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
    verboseLog: '输出详细运行日志文件',
    verboseLogDesc: '选中此选项将在调用UPDFiler_v2时传入-verbose参数，用于输出详细运行日志文件',
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
    currentTool: '当前选择的工具',
    toolVersion: '工具版本',
    loadingVersion: '正在获取版本信息...',
    cmtoolsVersion: 'CMTools 版本',
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
    verboseLog: 'Output detailed runtime log file',
    verboseLogDesc: 'Check this option to pass -verbose parameter when calling UPDFiler_v2, for outputting detailed runtime log file',
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
    currentTool: 'Current Tool',
    toolVersion: 'Tool Version',
    loadingVersion: 'Loading version info...',
    cmtoolsVersion: 'CMTools Version',
  },
};

// 打字机动画状态
const typewriterTexts = ref<Record<string, string>>({});
const typingStates = ref<Record<string, boolean>>({});


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

// 动态翻译结果消息
function getLocalizedResultMessage(result: ProcessResult): string {
  // 如果有原始消息键和文件名，根据当前语言重新翻译
  if (result.originalMessage && result.fileName) {
    const messageKey = result.originalMessage;
    const fileName = result.fileName;
    
    // 根据消息键和当前语言返回翻译
    switch (messageKey) {
      case 'process_success':
        return currentLanguage.value === 'zh' 
          ? `成功处理文件: ${fileName}` 
          : `Successfully processed file: ${fileName}`;
      case 'process_failed':
        return currentLanguage.value === 'zh' 
          ? `处理文件失败: ${fileName}` 
          : `Failed to process file: ${fileName}`;
      case 'execute_failed':
        return currentLanguage.value === 'zh' 
          ? `执行程序失败: ${fileName}` 
          : `Failed to execute program: ${fileName}`;
      case 'file_not_found':
        return currentLanguage.value === 'zh' 
          ? `文件不存在: ${fileName}` 
          : `File not found: ${fileName}`;
      default:
        return result.message;
    }
  }
  
  // 如果没有原始消息键，返回当前消息
  return result.message;
}









// 单独为特定文本执行打字机动画（保留以备将来使用）
// async function animateSpecificText(key: string, delay: number = 0) {
//   const targetText = t(key);
//   await typewriterEffect(key, targetText, delay);
// }

// 语言切换
function toggleLanguage() {
  // 切换语言
  const newLanguage = currentLanguage.value === 'zh' ? 'en' : 'zh';
  currentLanguage.value = newLanguage;
  localStorage.setItem('language', newLanguage);
  
  // 立即更新所有文本内容，不使用动画
  const newLang = translations[currentLanguage.value as keyof typeof translations];
  Object.keys(newLang).forEach(key => {
    typewriterTexts.value[key] = newLang[key as keyof typeof newLang];
  });
  
  // 强制更新结果消息显示
  // 由于使用了计算属性，Vue会自动重新渲染
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
      verboseLog: selectedTool.value === ToolType.UPDFiler_v2 ? verboseLog.value : undefined,
      language: currentLanguage.value
    };
    
    const processResults = await invoke<ProcessResult[]>('process_files', options);
    
    // 处理结果，提取原始消息键和文件名
    results.value = processResults.map(result => {
      const processedResult = { ...result };
      
      // 解析消息以提取原始消息键和文件名
      if (result.success && result.message) {
        // 尝试解析成功消息
        const successMatchZh = result.message.match(/^成功处理文件:\s*(.+)$/);
        const successMatchEn = result.message.match(/^Successfully processed file:\s*(.+)$/);
        
        if (successMatchZh || successMatchEn) {
          processedResult.originalMessage = 'process_success';
          processedResult.fileName = (successMatchZh || successMatchEn)?.[1] || '';
        }
      } else if (!result.success && result.message) {
        // 尝试解析失败消息
        const failedMatchZh = result.message.match(/^处理文件失败:\s*(.+)$/);
        const failedMatchEn = result.message.match(/^Failed to process file:\s*(.+)$/);
        const executeMatchZh = result.message.match(/^执行程序失败:\s*(.+)$/);
        const executeMatchEn = result.message.match(/^Failed to execute program:\s*(.+)$/);
        const notFoundMatchZh = result.message.match(/^文件不存在:\s*(.+)$/);
        const notFoundMatchEn = result.message.match(/^File not found:\s*(.+)$/);
        
        if (failedMatchZh || failedMatchEn) {
          processedResult.originalMessage = 'process_failed';
          processedResult.fileName = (failedMatchZh || failedMatchEn)?.[1] || '';
        } else if (executeMatchZh || executeMatchEn) {
          processedResult.originalMessage = 'execute_failed';
          processedResult.fileName = (executeMatchZh || executeMatchEn)?.[1] || '';
        } else if (notFoundMatchZh || notFoundMatchEn) {
          processedResult.originalMessage = 'file_not_found';
          processedResult.fileName = (notFoundMatchZh || notFoundMatchEn)?.[1] || '';
        }
      }
      
      return processedResult;
    });
    
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
async function showVersionUpdateDialog() {
  showVersionDialog.value = true;
  toolVersion.value = '';
  loadingToolVersion.value = true;
  
  try {
    const version = await invoke<string>('get_tool_version', {
      toolName: selectedTool.value,
      language: currentLanguage.value
    });
    toolVersion.value = version;
  } catch (error) {
    console.error('Failed to get tool version:', error);
    toolVersion.value = currentLanguage.value === 'zh' ? '获取失败' : 'Failed to retrieve';
  } finally {
    loadingToolVersion.value = false;
  }
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
      <div class="header-controls">
        <div class="control-group-left">
          <button @click="openHelpCenter" class="control-button" :title="t('helpCenter')">
            <span>{{ getTypewriterText('helpBtn') || t('helpBtn') }}</span>
          </button>
          <button @click="showVersionUpdateDialog" class="control-button" :title="t('versionUpdateTitle')">
            <span>v{{ appVersion }}</span>
          </button>
        </div>
        <div class="control-group-right">
          <button @click="toggleLanguage" class="control-button" :title="t('languageSwitch')">
            <span>{{ getTypewriterText('languageBtn') || t('languageBtn') }}</span>
          </button>
          <button @click="toggleTheme" class="control-button" :title="isDarkMode ? t('switchToLight') : t('switchToDark')">
            <span>{{ getTypewriterText(isDarkMode ? 'themeBtnDark' : 'themeBtnLight') || t(isDarkMode ? 'themeBtnDark' : 'themeBtnLight') }}</span>
          </button>
        </div>
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
          
          <!-- 输出详细运行日志文件选项 - 仅 UPDFiler_v2 支持 -->
          <div class="option-item" v-if="selectedTool === ToolType.UPDFiler_v2">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="verboseLog" 
                class="checkbox-input"
              />
              <span class="checkbox-custom"></span>
              <span class="checkbox-text"><span>{{ getTypewriterText('verboseLog') || t('verboseLog') }}</span></span>
            </label>
            <p class="option-description"><span>{{ getTypewriterText('verboseLogDesc') || t('verboseLogDesc') }}</span></p>
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
              <span class="result-icon" :data-icon="result.success ? '✓' : '✕'"></span>
              <span class="result-message">{{ getLocalizedResultMessage(result) }}</span>
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
        <div class="version-content">
          <div class="version-info-container">
            <div class="version-item">
              <strong><span>{{ getTypewriterText('cmtoolsVersion') || t('cmtoolsVersion') }}:</span></strong>
              <span class="version-value">v{{ appVersion }}</span>
            </div>
            <div class="version-divider"></div>
            <div class="version-item">
              <strong><span>{{ getTypewriterText('currentTool') || t('currentTool') }}:</span></strong>
              <span class="version-value">{{ getCurrentToolConfig().label }}</span>
            </div>
            <div class="version-item">
              <strong><span>{{ getTypewriterText('toolVersion') || t('toolVersion') }}:</span></strong>
              <span v-if="loadingToolVersion" class="version-loading">{{ getTypewriterText('loadingVersion') || t('loadingVersion') }}</span>
              <span v-else class="version-value">{{ toolVersion || (currentLanguage === 'zh' ? '未知' : 'Unknown') }}</span>
            </div>
          </div>
          <div class="version-notice">
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

/* 简化页面加载动画 */
@keyframes pageLoad {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.container {
  animation: pageLoad 0.4s var(--ease-out-cubic);
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

/* Material You 动画效果 */
.tool-selection,
.file-selection,
.process-options,
.process-section,
.results-panel {
  animation: fadeInUp 0.3s cubic-bezier(0.2, 0, 0, 1) both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.result-item {
  animation: slideInRight 0.3s cubic-bezier(0.2, 0, 0, 1) both;
}

.result-item:nth-child(1) { animation-delay: 0.05s; }
.result-item:nth-child(2) { animation-delay: 0.1s; }
.result-item:nth-child(3) { animation-delay: 0.15s; }
.result-item:nth-child(4) { animation-delay: 0.2s; }
.result-item:nth-child(5) { animation-delay: 0.25s; }
.result-item:nth-child(6) { animation-delay: 0.3s; }
.result-item:nth-child(7) { animation-delay: 0.35s; }
.result-item:nth-child(8) { animation-delay: 0.4s; }

/* Material You 设计系统 - 亮色主题 */
:root {
  /* 主色调 - Material You 蓝色系 */
  --md-sys-color-primary: #0061a4;
  --md-sys-color-on-primary: #ffffff;
  --md-sys-color-primary-container: #d1e4ff;
  --md-sys-color-on-primary-container: #001d36;
  
  /* 次要色调 */
  --md-sys-color-secondary: #535e70;
  --md-sys-color-on-secondary: #ffffff;
  --md-sys-color-secondary-container: #d7e3f8;
  --md-sys-color-on-secondary-container: #101c2b;
  
  /* 第三色调 */
  --md-sys-color-tertiary: #6b5778;
  --md-sys-color-on-tertiary: #ffffff;
  --md-sys-color-tertiary-container: #f2daff;
  --md-sys-color-on-tertiary-container: #251432;
  
  /* 表面色彩 */
  --md-sys-color-surface: #fdfbff;
  --md-sys-color-on-surface: #1a1b1e;
  --md-sys-color-surface-variant: #dfe2eb;
  --md-sys-color-on-surface-variant: #43474e;
  --md-sys-color-surface-tint: #0061a4;
  --md-sys-color-surface-bright: #fdfbff;
  
  /* 背景色彩 */
  --md-sys-color-background: #fdfbff;
  --md-sys-color-on-background: #1a1b1e;
  
  /* 轮廓线 */
  --md-sys-color-outline: #73777f;
  --md-sys-color-outline-variant: #c3c7cf;
  
  /* 语义色彩 */
  --md-sys-color-error: #ba1a1a;
  --md-sys-color-on-error: #ffffff;
  --md-sys-color-error-container: #ffdad6;
  --md-sys-color-on-error-container: #410002;
  
  /* 成功和警告色 */
  --md-sys-color-success: #146c2e;
  --md-sys-color-on-success: #ffffff;
  --md-sys-color-warning: #724c00;
  --md-sys-color-on-warning: #ffffff;
  
  /* 阴影系统 - Material You Elevation */
  --md-sys-elevation-level0: 0px 0px 0px 0px rgba(0, 0, 0, 0.12), 0px 0px 0px 0px rgba(0, 0, 0, 0.16), 0px 0px 0px 0px rgba(0, 0, 0, 0.2);
  --md-sys-elevation-level1: 0px 1px 2px 0px rgba(0, 0, 0, 0.12), 0px 1px 3px 1px rgba(0, 0, 0, 0.16), 0px 2px 1px -1px rgba(0, 0, 0, 0.2);
  --md-sys-elevation-level2: 0px 1px 2px 0px rgba(0, 0, 0, 0.12), 0px 2px 4px 1px rgba(0, 0, 0, 0.16), 0px 1px 6px 2px rgba(0, 0, 0, 0.2);
  --md-sys-elevation-level3: 0px 1px 3px 0px rgba(0, 0, 0, 0.12), 0px 4px 8px 3px rgba(0, 0, 0, 0.16), 0px 1px 14px 4px rgba(0, 0, 0, 0.2);
  --md-sys-elevation-level4: 0px 2px 3px 0px rgba(0, 0, 0, 0.12), 0px 6px 10px 4px rgba(0, 0, 0, 0.16), 0px 2px 20px 6px rgba(0, 0, 0, 0.2);
  --md-sys-elevation-level5: 0px 1px 8px 0px rgba(0, 0, 0, 0.12), 0px 16px 24px 2px rgba(0, 0, 0, 0.16), 0px 3px 8px 0px rgba(0, 0, 0, 0.2);
  
  /* 状态层 */
  --md-sys-state-hover: 0.08;
  --md-sys-state-focus: 0.12;
  --md-sys-state-pressed: 0.12;
  --md-sys-state-dragged: 0.16;
  
  /* 形状 - 圆角 */
  --md-sys-shape-corner-none: 0px;
  --md-sys-shape-corner-extra-small: 4px;
  --md-sys-shape-corner-small: 8px;
  --md-sys-shape-corner-medium: 12px;
  --md-sys-shape-corner-large: 16px;
  --md-sys-shape-corner-extra-large: 28px;
  
  /* 排版 - Material You Type Scale */
  --md-sys-typescale-headline-large-font-family: "Roboto", sans-serif;
  --md-sys-typescale-headline-large-font-weight: 400;
  --md-sys-typescale-headline-large-font-size: 32px;
  --md-sys-typescale-headline-large-line-height: 40px;
  --md-sys-typescale-headline-large-letter-spacing: 0px;
  
  --md-sys-typescale-headline-medium-font-family: "Roboto", sans-serif;
  --md-sys-typescale-headline-medium-font-weight: 400;
  --md-sys-typescale-headline-medium-font-size: 28px;
  --md-sys-typescale-headline-medium-line-height: 36px;
  --md-sys-typescale-headline-medium-letter-spacing: 0px;
  
  --md-sys-typescale-headline-small-font-family: "Roboto", sans-serif;
  --md-sys-typescale-headline-small-font-weight: 400;
  --md-sys-typescale-headline-small-font-size: 24px;
  --md-sys-typescale-headline-small-line-height: 32px;
  --md-sys-typescale-headline-small-letter-spacing: 0px;
  
  --md-sys-typescale-title-large-font-family: "Roboto", sans-serif;
  --md-sys-typescale-title-large-font-weight: 500;
  --md-sys-typescale-title-large-font-size: 22px;
  --md-sys-typescale-title-large-line-height: 28px;
  --md-sys-typescale-title-large-letter-spacing: 0px;
  
  --md-sys-typescale-title-medium-font-family: "Roboto", sans-serif;
  --md-sys-typescale-title-medium-font-weight: 500;
  --md-sys-typescale-title-medium-font-size: 16px;
  --md-sys-typescale-title-medium-line-height: 24px;
  --md-sys-typescale-title-medium-letter-spacing: 0.15px;
  
  --md-sys-typescale-body-large-font-family: "Roboto", sans-serif;
  --md-sys-typescale-body-large-font-weight: 400;
  --md-sys-typescale-body-large-font-size: 16px;
  --md-sys-typescale-body-large-line-height: 24px;
  --md-sys-typescale-body-large-letter-spacing: 0.5px;
  
  --md-sys-typescale-body-medium-font-family: "Roboto", sans-serif;
  --md-sys-typescale-body-medium-font-weight: 400;
  --md-sys-typescale-body-medium-font-size: 14px;
  --md-sys-typescale-body-medium-line-height: 20px;
  --md-sys-typescale-body-medium-letter-spacing: 0.25px;
  
  --md-sys-typescale-label-large-font-family: "Roboto", sans-serif;
  --md-sys-typescale-label-large-font-weight: 500;
  --md-sys-typescale-label-large-font-size: 14px;
  --md-sys-typescale-label-large-line-height: 20px;
  --md-sys-typescale-label-large-letter-spacing: 0.1px;
}

/* Material You 设计系统 - 暗色主题 */
.dark-theme {
  /* 主色调 - 暗色版本 */
  --md-sys-color-primary: #90caff;
  --md-sys-color-on-primary: #003258;
  --md-sys-color-primary-container: #00497d;
  --md-sys-color-on-primary-container: #d1e4ff;
  
  /* 次要色调 - 暗色版本 */
  --md-sys-color-secondary: #b0c7e9;
  --md-sys-color-on-secondary: #253140;
  --md-sys-color-secondary-container: #3c4858;
  --md-sys-color-on-secondary-container: #d7e3f8;
  
  /* 第三色调 - 暗色版本 */
  --md-sys-color-tertiary: #d6bee4;
  --md-sys-color-on-tertiary: #3b2948;
  --md-sys-color-tertiary-container: #523f5f;
  --md-sys-color-on-tertiary-container: #f2daff;
  
  /* 表面色彩 - 暗色版本 */
  --md-sys-color-surface: #10131b;
  --md-sys-color-on-surface: #e2e2e9;
  --md-sys-color-surface-variant: #43474e;
  --md-sys-color-on-surface-variant: #c3c7cf;
  --md-sys-color-surface-tint: #90caff;
  --md-sys-color-surface-bright: #36393f;
  
  /* 背景色彩 - 暗色版本 */
  --md-sys-color-background: #10131b;
  --md-sys-color-on-background: #e2e2e9;
  
  /* 轮廓线 - 暗色版本 */
  --md-sys-color-outline: #8d9199;
  --md-sys-color-outline-variant: #43474e;
  
  /* 语义色彩 - 暗色版本 */
  --md-sys-color-error: #ffb4ab;
  --md-sys-color-on-error: #690005;
  --md-sys-color-error-container: #93000a;
  --md-sys-color-on-error-container: #ffdad6;
  
  /* 成功和警告色 - 暗色版本 */
  --md-sys-color-success: #4cd664;
  --md-sys-color-on-success: #00390f;
  --md-sys-color-warning: #ffb951;
  --md-sys-color-on-warning: #402600;
  
  /* 阴影系统 - 暗色版本 */
  --md-sys-elevation-level0: 0px 0px 0px 0px rgba(0, 0, 0, 0.24), 0px 0px 0px 0px rgba(0, 0, 0, 0.32), 0px 0px 0px 0px rgba(0, 0, 0, 0.4);
  --md-sys-elevation-level1: 0px 1px 2px 0px rgba(0, 0, 0, 0.24), 0px 1px 3px 1px rgba(0, 0, 0, 0.32), 0px 2px 1px -1px rgba(0, 0, 0, 0.4);
  --md-sys-elevation-level2: 0px 1px 2px 0px rgba(0, 0, 0, 0.24), 0px 2px 4px 1px rgba(0, 0, 0, 0.32), 0px 1px 6px 2px rgba(0, 0, 0, 0.4);
  --md-sys-elevation-level3: 0px 1px 3px 0px rgba(0, 0, 0, 0.24), 0px 4px 8px 3px rgba(0, 0, 0, 0.32), 0px 1px 14px 4px rgba(0, 0, 0, 0.4);
  --md-sys-elevation-level4: 0px 2px 3px 0px rgba(0, 0, 0, 0.24), 0px 6px 10px 4px rgba(0, 0, 0, 0.32), 0px 2px 20px 6px rgba(0, 0, 0, 0.4);
  --md-sys-elevation-level5: 0px 1px 8px 0px rgba(0, 0, 0, 0.24), 0px 16px 24px 2px rgba(0, 0, 0, 0.32), 0px 3px 8px 0px rgba(0, 0, 0, 0.4);
}
</style>

<style scoped>
.container {
  min-height: 100vh;
  background: var(--md-sys-color-background);
  padding: 0 0 32px 0;
  font-family: var(--md-sys-typescale-body-large-font-family);
  color: var(--md-sys-color-on-background);
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
  position: relative;
  overflow-x: hidden;
}

.header {
  text-align: center;
  margin-bottom: 32px;
  padding: 24px 0;
  color: var(--md-sys-color-on-background);
  position: relative;
  z-index: 10;
}

.header h1 {
  margin: 0 0 8px 0;
  font-family: var(--md-sys-typescale-headline-large-font-family);
  font-size: var(--md-sys-typescale-headline-large-font-size);
  font-weight: var(--md-sys-typescale-headline-large-font-weight);
  line-height: var(--md-sys-typescale-headline-large-line-height);
  letter-spacing: var(--md-sys-typescale-headline-large-letter-spacing);
  color: var(--md-sys-color-primary);
}

.subtitle {
  margin: 0;
  font-family: var(--md-sys-typescale-body-medium-font-family);
  font-size: var(--md-sys-typescale-body-medium-font-size);
  font-weight: var(--md-sys-typescale-body-medium-font-weight);
  line-height: var(--md-sys-typescale-body-medium-line-height);
  letter-spacing: var(--md-sys-typescale-body-medium-letter-spacing);
  color: var(--md-sys-color-on-surface-variant);
}

/* 顶部控制栏 */
.header-controls {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.control-group-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.control-group-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.control-button {
  padding: 8px 16px;
  border: 1px solid var(--md-sys-color-outline);
  border-radius: var(--md-sys-shape-corner-large);
  background: var(--md-sys-color-surface);
  color: var(--md-sys-color-primary);
  font-family: var(--md-sys-typescale-label-large-font-family);
  font-size: var(--md-sys-typescale-label-large-font-size);
  font-weight: var(--md-sys-typescale-label-large-font-weight);
  line-height: var(--md-sys-typescale-label-large-line-height);
  letter-spacing: var(--md-sys-typescale-label-large-letter-spacing);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  box-shadow: var(--md-sys-elevation-level1);
  position: relative;
  overflow: hidden;
}

.control-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--md-sys-color-primary);
  opacity: 0;
  transition: opacity 0.2s cubic-bezier(0.2, 0, 0, 1);
}

.control-button:hover {
  box-shadow: var(--md-sys-elevation-level2);
}

.control-button:hover::before {
  opacity: var(--md-sys-state-hover);
}

.control-button:active {
  box-shadow: var(--md-sys-elevation-level0);
  transform: scale(0.98);
}

.control-button span {
  position: relative;
  z-index: 1;
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
  max-width: 1200px;
  margin: 0 auto 48px auto;
  background: var(--md-sys-color-surface);
  border-radius: var(--md-sys-shape-corner-large);
  padding: 24px;
  box-shadow: var(--md-sys-elevation-level2);
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
  display: flex;
  gap: 24px;
  align-items: stretch;
  position: relative;
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
  background: var(--md-sys-color-surface-variant);
  border-radius: var(--md-sys-shape-corner-medium);
  padding: 16px;
  border: 1px solid var(--md-sys-color-outline);
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
  display: flex;
  flex-direction: column;
  min-height: 0;
  box-shadow: var(--md-sys-elevation-level1);
}

.results-panel:hover {
  box-shadow: var(--md-sys-elevation-level2);
}

/* Material You 暗色主题无需额外样式，所有颜色都通过CSS变量自动处理 */

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
    gap: 16px;
  }

  .left-panel,
  .results-panel {
    width: 100%;
  }
}

/* 移动端优化 */
@media (max-width: 768px) {
  .main-content {
    margin: 0 16px 32px 16px;
    padding: 16px;
    gap: 12px;
  }
  
  .results-panel {
    padding: 12px;
  }
}

h3 {
  color: var(--md-sys-color-on-surface);
  margin-bottom: 16px;
  font-family: var(--md-sys-typescale-title-medium-font-family);
  font-size: var(--md-sys-typescale-title-medium-font-size);
  font-weight: var(--md-sys-typescale-title-medium-font-weight);
  line-height: var(--md-sys-typescale-title-medium-line-height);
  letter-spacing: var(--md-sys-typescale-title-medium-letter-spacing);
}

.tool-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.tool-btn {
  padding: 10px 24px;
  border: 1px solid var(--md-sys-color-outline);
  background: var(--md-sys-color-surface);
  border-radius: var(--md-sys-shape-corner-large);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
  font-family: var(--md-sys-typescale-label-large-font-family);
  font-size: var(--md-sys-typescale-label-large-font-size);
  font-weight: var(--md-sys-typescale-label-large-font-weight);
  line-height: var(--md-sys-typescale-label-large-line-height);
  letter-spacing: var(--md-sys-typescale-label-large-letter-spacing);
  color: var(--md-sys-color-primary);
  position: relative;
  overflow: hidden;
}

.tool-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--md-sys-color-primary);
  opacity: 0;
  transition: opacity 0.2s cubic-bezier(0.2, 0, 0, 1);
}

.tool-btn:hover {
  border-color: var(--md-sys-color-outline);
  box-shadow: var(--md-sys-elevation-level1);
}

.tool-btn:hover::before {
  opacity: var(--md-sys-state-hover);
}

.tool-btn.active {
  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  border-color: var(--md-sys-color-primary);
  box-shadow: var(--md-sys-elevation-level1);
}

.tool-btn.active::before {
  opacity: 0;
}

.tool-btn:active {
  box-shadow: var(--md-sys-elevation-level0);
  transform: scale(0.98);
}

.tool-btn span {
  position: relative;
  z-index: 1;
}

.file-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.select-btn,
.clear-btn {
  padding: 10px 24px;
  border: none;
  border-radius: var(--md-sys-shape-corner-large);
  cursor: pointer;
  font-family: var(--md-sys-typescale-label-large-font-family);
  font-size: var(--md-sys-typescale-label-large-font-size);
  font-weight: var(--md-sys-typescale-label-large-font-weight);
  line-height: var(--md-sys-typescale-label-large-line-height);
  letter-spacing: var(--md-sys-typescale-label-large-letter-spacing);
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
  min-width: 100px;
  justify-content: center;
}

.select-btn::before,
.clear-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0;
  transition: opacity 0.2s cubic-bezier(0.2, 0, 0, 1);
}

.select-btn {
  background: var(--md-sys-color-success);
  color: var(--md-sys-color-on-success);
  box-shadow: var(--md-sys-elevation-level1);
}

.select-btn::before {
  background: var(--md-sys-color-on-success);
}

.select-btn:hover {
  box-shadow: var(--md-sys-elevation-level2);
}

.select-btn:hover::before {
  opacity: var(--md-sys-state-hover);
}

.clear-btn {
  background: var(--md-sys-color-error);
  color: var(--md-sys-color-on-error);
  box-shadow: var(--md-sys-elevation-level1);
}

.clear-btn::before {
  background: var(--md-sys-color-on-error);
}

.clear-btn:hover {
  box-shadow: var(--md-sys-elevation-level2);
}

.clear-btn:hover::before {
  opacity: var(--md-sys-state-hover);
}

.select-btn:active,
.clear-btn:active {
  box-shadow: var(--md-sys-elevation-level0);
  transform: scale(0.98);
}

.select-btn span,
.clear-btn span {
  position: relative;
  z-index: 1;
}

.selected-files {
  background: var(--md-sys-color-surface-variant);
  border-radius: var(--md-sys-shape-corner-medium);
  padding: 16px;
  border: 1px solid var(--md-sys-color-outline);
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
  box-shadow: var(--md-sys-elevation-level1);
}

.selected-files:hover {
  box-shadow: var(--md-sys-elevation-level2);
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
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  color: var(--md-sys-color-on-surface-variant);
  font-family: var(--md-sys-typescale-body-medium-font-family);
  font-size: var(--md-sys-typescale-body-medium-font-size);
  font-weight: var(--md-sys-typescale-body-medium-font-weight);
  line-height: var(--md-sys-typescale-body-medium-line-height);
  letter-spacing: var(--md-sys-typescale-body-medium-letter-spacing);
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-item:last-child {
  border-bottom: none;
}

.process-section {
  text-align: center;
  margin-top: 20px;
}

.process-btn {
  padding: 12px 32px;
  border: none;
  border-radius: var(--md-sys-shape-corner-large);
  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  font-family: var(--md-sys-typescale-label-large-font-family);
  font-size: var(--md-sys-typescale-label-large-font-size);
  font-weight: var(--md-sys-typescale-label-large-font-weight);
  line-height: var(--md-sys-typescale-label-large-line-height);
  letter-spacing: var(--md-sys-typescale-label-large-letter-spacing);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
  box-shadow: var(--md-sys-elevation-level1);
  min-width: 140px;
  position: relative;
  overflow: hidden;
}

.process-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--md-sys-color-on-primary);
  opacity: 0;
  transition: opacity 0.2s cubic-bezier(0.2, 0, 0, 1);
}

.process-btn:hover:not(:disabled) {
  box-shadow: var(--md-sys-elevation-level2);
}

.process-btn:hover:not(:disabled)::before {
  opacity: var(--md-sys-state-hover);
}

.process-btn:active:not(:disabled) {
  box-shadow: var(--md-sys-elevation-level0);
  transform: scale(0.98);
}

.process-btn:disabled {
  opacity: 0.38;
  cursor: not-allowed;
  box-shadow: var(--md-sys-elevation-level0);
}

.process-btn span {
  position: relative;
  z-index: 1;
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
  gap: 12px;
  overflow-y: auto;
  flex-grow: 1;
  max-height: 600px;
  scrollbar-width: thin;
  scrollbar-color: var(--md-sys-color-outline) transparent;
  padding: 4px;
}

/* Material You 滚动条样式 */
.file-list::-webkit-scrollbar,
.result-list::-webkit-scrollbar,
.error-content::-webkit-scrollbar {
  width: 8px;
}

.file-list::-webkit-scrollbar-track,
.result-list::-webkit-scrollbar-track,
.error-content::-webkit-scrollbar-track {
  background: transparent;
}

.file-list::-webkit-scrollbar-thumb,
.result-list::-webkit-scrollbar-thumb,
.error-content::-webkit-scrollbar-thumb {
  background: var(--md-sys-color-on-surface-variant);
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: content-box;
}

.file-list::-webkit-scrollbar-thumb:hover,
.result-list::-webkit-scrollbar-thumb:hover,
.error-content::-webkit-scrollbar-thumb:hover {
  background: var(--md-sys-color-on-surface);
  background-clip: content-box;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-radius: var(--md-sys-shape-corner-medium);
  transition: all 0.3s cubic-bezier(0.2, 0, 0, 1);
  font-family: var(--md-sys-typescale-body-large-font-family);
  font-size: var(--md-sys-typescale-body-large-font-size);
  font-weight: var(--md-sys-typescale-body-large-font-weight);
  line-height: var(--md-sys-typescale-body-large-line-height);
  letter-spacing: var(--md-sys-typescale-body-large-letter-spacing);
  box-shadow: var(--md-sys-elevation-level1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.result-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: currentColor;
  opacity: 0;
  transition: opacity 0.2s cubic-bezier(0.2, 0, 0, 1);
}

.result-item:hover {
  transform: translateY(-1px);
}

.result-item:hover::before {
  opacity: 0.04; /* 更微妙的状态层效果 */
}

.result-item:active {
  transform: translateY(0px) scale(0.98);
}

.result-item.success {
  background: var(--md-sys-color-success-container);
  border: 1px solid var(--md-sys-color-success);
  color: var(--md-sys-color-on-success-container);
}

.result-item.error {
  background: var(--md-sys-color-error-container);
  border: 1px solid var(--md-sys-color-error);
  color: var(--md-sys-color-on-error-container);
}

.result-icon {
  font-size: 20px;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: currentColor;
  position: relative;
  z-index: 1;
}

.result-icon::after {
  content: attr(data-icon);
  color: inherit;
  background: inherit;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: bold;
}

.result-message {
  flex: 1;
  color: inherit;
  position: relative;
  z-index: 1;
  font-weight: 500;
}

.open-folder-icon {
  font-size: 20px;
  opacity: 0.7;
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
  margin-left: 8px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--md-sys-shape-corner-small);
  background: rgba(255, 255, 255, 0.08);
  position: relative;
  z-index: 1;
}

.result-item:hover .open-folder-icon {
  opacity: 1;
  transform: scale(1.05);
  background: rgba(255, 255, 255, 0.12);
}

.result-item.success .result-icon {
  color: var(--md-sys-color-success);
}

.result-item.error .result-icon {
  color: var(--md-sys-color-error);
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
  background: var(--md-sys-color-surface);
  border-radius: var(--md-sys-shape-corner-extra-large);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: var(--md-sys-elevation-level3);
  animation: dialogSlideIn 0.3s cubic-bezier(0.2, 0, 0, 1);
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
  background: var(--md-sys-color-error);
  color: var(--md-sys-color-on-error);
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-header h3 {
  margin: 0;
  color: var(--md-sys-color-on-error);
  font-family: var(--md-sys-typescale-headline-small-font-family);
  font-size: var(--md-sys-typescale-headline-small-font-size);
  font-weight: var(--md-sys-typescale-headline-small-font-weight);
  line-height: var(--md-sys-typescale-headline-small-line-height);
  letter-spacing: var(--md-sys-typescale-headline-small-letter-spacing);
}

.close-btn {
  background: none;
  border: none;
  color: var(--md-sys-color-on-error);
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 40px;
  height: 40px;
  border-radius: var(--md-sys-shape-corner-medium);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.05);
}

.error-content {
  padding: 24px;
  max-height: 300px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--gray-400) transparent;
}

.version-content {
  padding: 24px;
}

.error-item {
  padding: 16px;
  margin-bottom: 16px;
  background: var(--md-sys-color-error-container);
  border-radius: var(--md-sys-shape-corner-small);
  border-left: 4px solid var(--md-sys-color-error);
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  color: var(--md-sys-color-on-error-container);
  line-height: 1.5;
  border: 1px solid var(--md-sys-color-outline);
}

/* 版本信息容器样式 */
.version-info-container {
  background: var(--md-sys-color-surface-variant);
  border-radius: var(--md-sys-shape-corner-medium);
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid var(--md-sys-color-outline-variant);
}

.version-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  font-family: var(--md-sys-typescale-body-large-font-family);
  font-size: var(--md-sys-typescale-body-large-font-size);
  color: var(--md-sys-color-on-surface);
}

.version-item strong {
  color: var(--md-sys-color-primary);
  font-weight: 500;
}

.version-value {
  font-family: 'Consolas', 'Monaco', monospace;
  color: var(--md-sys-color-on-surface-variant);
  background: var(--md-sys-color-surface);
  padding: 4px 12px;
  border-radius: var(--md-sys-shape-corner-small);
  border: 1px solid var(--md-sys-color-outline-variant);
}

.version-loading {
  font-style: italic;
  color: var(--md-sys-color-on-surface-variant);
  opacity: 0.7;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

.version-divider {
  height: 1px;
  background: var(--md-sys-color-outline-variant);
  margin: 8px 0;
  opacity: 0.5;
}

.version-notice {
  padding: 12px;
  background: var(--md-sys-color-surface);
  border-radius: var(--md-sys-shape-corner-small);
  border-left: 3px solid var(--md-sys-color-primary);
  font-size: 14px;
  color: var(--md-sys-color-on-surface-variant);
  line-height: 1.6;
}

/* 处理选项样式 */
.process-options {
  background: var(--md-sys-color-surface-variant);
  border-radius: var(--md-sys-shape-corner-medium);
  padding: 16px;
  border: 1px solid var(--md-sys-color-outline);
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
  box-shadow: var(--md-sys-elevation-level1);
}

.process-options:hover {
  box-shadow: var(--md-sys-elevation-level2);
}

.option-item {
  margin-bottom: 10px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-family: var(--md-sys-typescale-body-large-font-family);
  font-size: var(--md-sys-typescale-body-large-font-size);
  font-weight: var(--md-sys-typescale-body-large-font-weight);
  line-height: var(--md-sys-typescale-body-large-line-height);
  letter-spacing: var(--md-sys-typescale-body-large-letter-spacing);
  color: var(--md-sys-color-on-surface);
  transition: color 0.2s cubic-bezier(0.2, 0, 0, 1);
}

.checkbox-label:hover {
  color: var(--md-sys-color-primary);
}

.checkbox-input {
  display: none;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid var(--md-sys-color-outline);
  border-radius: var(--md-sys-shape-corner-extra-small);
  margin-right: 12px;
  position: relative;
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
  background: var(--md-sys-color-surface);
  flex-shrink: 0;
}

.checkbox-input:checked + .checkbox-custom {
  background: var(--md-sys-color-primary);
  border-color: var(--md-sys-color-primary);
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--md-sys-color-on-primary);
  font-size: 14px;
  font-weight: 500;
}

.checkbox-custom:hover {
  border-color: var(--md-sys-color-on-surface);
}

.checkbox-text {
  font-family: var(--md-sys-typescale-body-large-font-family);
  font-size: var(--md-sys-typescale-body-large-font-size);
  font-weight: var(--md-sys-typescale-body-large-font-weight);
  line-height: var(--md-sys-typescale-body-large-line-height);
  letter-spacing: var(--md-sys-typescale-body-large-letter-spacing);
  color: var(--md-sys-color-on-surface);
}

.option-description {
  margin: 8px 0 0 32px;
  font-family: var(--md-sys-typescale-body-medium-font-family);
  font-size: var(--md-sys-typescale-body-medium-font-size);
  font-weight: var(--md-sys-typescale-body-medium-font-weight);
  line-height: var(--md-sys-typescale-body-medium-line-height);
  letter-spacing: var(--md-sys-typescale-body-medium-letter-spacing);
  color: var(--md-sys-color-on-surface-variant);
}

/* 文本输入框样式 */
.input-label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-family: var(--md-sys-typescale-label-large-font-family);
  font-size: var(--md-sys-typescale-label-large-font-size);
  font-weight: var(--md-sys-typescale-label-large-font-weight);
  line-height: var(--md-sys-typescale-label-large-line-height);
  letter-spacing: var(--md-sys-typescale-label-large-letter-spacing);
  color: var(--md-sys-color-on-surface);
}

.input-text {
  font-family: var(--md-sys-typescale-label-large-font-family);
  font-size: var(--md-sys-typescale-label-large-font-size);
  font-weight: var(--md-sys-typescale-label-large-font-weight);
  line-height: var(--md-sys-typescale-label-large-line-height);
  letter-spacing: var(--md-sys-typescale-label-large-letter-spacing);
  color: var(--md-sys-color-on-surface);
}

.text-input {
  padding: 16px;
  border: 1px solid var(--md-sys-color-outline);
  border-radius: var(--md-sys-shape-corner-small);
  background: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  font-family: var(--md-sys-typescale-body-large-font-family);
  font-size: var(--md-sys-typescale-body-large-font-size);
  font-weight: var(--md-sys-typescale-body-large-font-weight);
  line-height: var(--md-sys-typescale-body-large-line-height);
  letter-spacing: var(--md-sys-typescale-body-large-letter-spacing);
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
  outline: none;
}

.text-input:focus {
  border-color: var(--md-sys-color-primary);
  box-shadow: 0 0 0 1px var(--md-sys-color-primary);
}

.text-input:hover:not(:focus) {
  border-color: var(--md-sys-color-on-surface);
}

.text-input::placeholder {
  color: var(--md-sys-color-on-surface-variant);
}

.error-footer {
  padding: 24px;
  text-align: center;
  border-top: 1px solid var(--md-sys-color-outline-variant);
  background: var(--md-sys-color-surface-variant);
}

.ok-btn {
  padding: 12px 32px;
  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  border: none;
  border-radius: var(--md-sys-shape-corner-large);
  cursor: pointer;
  font-family: var(--md-sys-typescale-label-large-font-family);
  font-size: var(--md-sys-typescale-label-large-font-size);
  font-weight: var(--md-sys-typescale-label-large-font-weight);
  line-height: var(--md-sys-typescale-label-large-line-height);
  letter-spacing: var(--md-sys-typescale-label-large-letter-spacing);
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
  box-shadow: var(--md-sys-elevation-level1);
  min-width: 120px;
  position: relative;
  overflow: hidden;
}

.ok-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--md-sys-color-on-primary);
  opacity: 0;
  transition: opacity 0.2s cubic-bezier(0.2, 0, 0, 1);
}

.ok-btn:hover {
  box-shadow: var(--md-sys-elevation-level2);
}

.ok-btn:hover::before {
  opacity: var(--md-sys-state-hover);
}

.ok-btn:active {
  box-shadow: var(--md-sys-elevation-level0);
  transform: scale(0.98);
}

.ok-btn span {
  position: relative;
  z-index: 1;
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
    padding: 16px 0 0 0;
    margin-bottom: 16px;
  }
  
  .header-controls {
    top: 12px;
    left: 12px;
    right: 12px;
    gap: 8px;
  }
  
  .control-group-left,
  .control-group-right {
    gap: 8px;
  }
  
  .control-button {
    padding: 6px 12px;
    min-width: 48px;
    font-size: 12px;
  }
  
  .main-content {
    margin: 0 12px 24px 12px;
    padding: 16px;
    border-radius: var(--md-sys-shape-corner-medium);
  }
  
  .tool-buttons {
    flex-direction: column;
    gap: 8px;
  }
  
  .file-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .header h1 {
    font-size: var(--md-sys-typescale-headline-medium-font-size);
    margin: 8px 0 4px 0;
  }
  
  .subtitle {
    font-size: var(--md-sys-typescale-body-medium-font-size);
  }
  
  .process-btn {
    padding: 12px 24px;
    font-size: var(--md-sys-typescale-label-large-font-size);
    min-width: 120px;
  }
  
  .error-dialog {
    margin: 12px;
    width: calc(100% - 24px);
  }
  
  h3 {
    font-size: var(--md-sys-typescale-title-medium-font-size);
    margin-bottom: 12px;
  }
  
  .tool-selection,
  .file-selection,
  .process-section,
  .results {
    margin-bottom: 16px;
  }
  
  .process-section {
    margin-top: 20px;
  }
}
</style>
