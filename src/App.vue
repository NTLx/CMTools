<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, watch } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import ConsentModal from './components/ConsentModal.vue';
import {
  initAnalytics,
  trackToolSelected,
  trackFilesSelected,
  trackProcessingStarted,
  trackProcessingCompleted,
  trackProcessingFailed,
  cleanup,
  getConsentStatus,
  setConsentStatus,
  onConsentChange,
} from './utils/analytics';

// 工具类型枚举
enum ToolType {
  AneuFiler = 'AneuFiler',
  Aneu23 = 'Aneu23',
  SMNFiler_v1 = 'SMNFiler_v1',
  SMNFiler_v2 = 'SMNFiler_v2',
  SHCarrier = 'SHCarrier',
  UPDFiler_v1 = 'UPDFiler_v1',
  UPDFiler_v2 = 'UPDFiler_v2',
  STRMatcher = 'STR-Matcher',
}

// 工具配置接口
interface ToolConfig {
  name: ToolType;
  label: string;
  supportsStdSample: boolean;
  supportsWindowsOptimization: boolean;
  supportsAreaData: boolean; // 新增：是否支持峰面积数据选项
  supportsTolerance: boolean; // 新增：是否支持 Tolerance 参数
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
  tolerance?: number; // 新增：Tolerance 参数
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
const appVersion = (globalThis as any).__APP_VERSION__ || '2.8.6';

const selectedFiles = ref<string[]>([]);
const selectedTool = ref<ToolType>(ToolType.AneuFiler);
const useAreaData = ref<boolean>(false);
const stdSampleName = ref<string>("STD");
const windowsOptimization = ref<boolean>(true); // Windows系统优化，默认选中
const verboseLog = ref<boolean>(false); // 输出详细运行日志文件，默认不选中
const tolerance = ref<number | undefined>(undefined); // Tolerance 参数，默认未定义
const processing = ref<boolean>(false);
const results = ref<ProcessResult[]>([]);
const showErrorDialog = ref<boolean>(false);
const errorMessages = ref<string[]>([]);
const showVersionDialog = ref<boolean>(false);
const toolVersion = ref<string>('');
const loadingToolVersion = ref<boolean>(false);

// Toast 状态
const showToast = ref<boolean>(false);
const toastMessage = ref<string>('');
let toastTimer: number | null = null;
const isDarkMode = ref<boolean>(false);

// 隐私授权弹窗状态
const showConsentModal = ref<boolean>(false);

// 遥测开关状态
const telemetryEnabled = ref(getConsentStatus() === 'granted');

// 授权状态变化清理函数
let cleanupConsentListener: (() => void) | null = null;

// 显示 Toast
function displayToast(message: string) {
  toastMessage.value = message;
  showToast.value = true;
  
  if (toastTimer) {
    clearTimeout(toastTimer);
  }
  
  toastTimer = window.setTimeout(() => {
    showToast.value = false;
  }, 2000); // 2秒后自动消失
} 
const currentLanguage = ref<string>('zh'); // 默认中文

// 工具配置数组
const tools: ToolConfig[] = [
  {
    name: ToolType.AneuFiler,
    label: 'AneuFiler',
    supportsStdSample: false,
    supportsWindowsOptimization: false,
    supportsAreaData: true,
    supportsTolerance: false,
  },
  {
    name: ToolType.Aneu23,
    label: 'Aneu23',
    supportsStdSample: true,
    supportsWindowsOptimization: false,
    supportsAreaData: true,
    supportsTolerance: false,
  },
  {
    name: ToolType.SMNFiler_v1,
    label: 'SMNFiler_v1',
    supportsStdSample: true,
    supportsWindowsOptimization: true,
    supportsAreaData: true, // SMNFiler_v1 支持峰面积数据选项
    supportsTolerance: false,
  },
  {
    name: ToolType.SMNFiler_v2,
    label: 'SMNFiler_v2',
    supportsStdSample: true,
    supportsWindowsOptimization: true,
    supportsAreaData: false, // SMNFiler_v2 不支持峰面积数据选项
    supportsTolerance: false,
  },
  {
    name: ToolType.SHCarrier,
    label: 'SHCarrier',
    supportsStdSample: true,
    supportsWindowsOptimization: true,
    supportsAreaData: true,
    supportsTolerance: false,
  },
  {
    name: ToolType.UPDFiler_v1,
    label: 'UPDFiler_v1',
    supportsStdSample: false,
    supportsWindowsOptimization: true,
    supportsAreaData: false, // UPDFiler_v1 不支持峰面积数据选项
    supportsTolerance: false,
  },
  {
    name: ToolType.UPDFiler_v2,
    label: 'UPDFiler_v2',
    supportsStdSample: false,
    supportsWindowsOptimization: true,
    supportsAreaData: false, // UPDFiler_v2 不支持峰面积数据选项
    supportsTolerance: false,
  },
  {
    name: ToolType.STRMatcher,
    label: 'STR-Matcher',
    supportsStdSample: false,
    supportsWindowsOptimization: true,
    supportsAreaData: false,
    supportsTolerance: true,
  },
];

// 获取当前选中工具的配置
const getCurrentToolConfig = computed((): ToolConfig => {
  return tools.find(tool => tool.name === selectedTool.value) || tools[0];
});

// 翻译文本
const translations = {
  zh: {
    subtitle: '结果文件在各输入文件同目录下生成',
    selectTool: '选择工具',
    fileProcessing: '文件处理',
    selectFiles: '选择文件',
    selectFilesBtn: '选择文件',
    clearBtn: '清除',
    selectedFiles: '已选择的文件',
    processOptions: '处理选项',
    useAreaData: '使用峰面积数据进行计算',
    useAreaDataDesc: '选中此选项将使用峰面积数据而非峰高数据进行计算',
    stdSampleName: '标准品样本名称',
    stdSampleNameDesc: '指定标准品样本的名称，用于数据处理时的标准品识别',
    windowsOptimization: 'Windows 系统优化',
    windowsOptimizationDesc: '针对Windows系统进行编码优化，建议在Windows环境下保持选中状态',
    verboseLog: '输出详细运行日志文件',
    verboseLogDesc: '选中此选项将在调用UPDFiler_v2时输出详细运行日志文件',
    processing: '处理中...',
    startProcess: '开始处理',
    processResults: '处理结果',
    processError: '处理错误',
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
    telemetrySwitch: '收集软件运行性能数据',
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
    clearConsole: '清除结果',
    copyLog: '复制日志',
    waitingForTask: '等待新的任务...',
    successProcessed: '成功处理文件',
    failedProcessed: '处理文件失败',

    clearSuccess: '已清除所有结果',
    copySuccess: '日志已复制到剪贴板',
    copyFailed: '复制失败',
  },
  en: {
    subtitle: 'Result files are generated in the same directory as input files',
    selectTool: 'Select Processing Tool',
    fileProcessing: 'File Processing',
    selectFiles: 'Select Files',
    selectFilesBtn: 'Select Files',
    clearBtn: 'Clear',
    selectedFiles: 'Selected Files',
    processOptions: 'Processing Options',
    useAreaData: 'Use peak area data for calculation',
    useAreaDataDesc: 'Check this option to use peak area data instead of peak height data for calculation',
    stdSampleName: 'Standard Sample Name',
    stdSampleNameDesc: 'Specify the name of the standard sample for standard identification during data processing',
    windowsOptimization: 'Windows System Optimization',
    windowsOptimizationDesc: 'Optimize encoding for Windows systems, recommended to keep checked in Windows environment',
    verboseLog: 'Output detailed runtime log file',
    verboseLogDesc: 'Check this option to output detailed runtime log file when calling UPDFiler_v2',
    processing: 'Processing...',
    startProcess: 'Start Processing',
    processResults: 'Processing Results',
    processError: 'Processing Error',
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
    telemetrySwitch: 'Telemetry Settings',
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
    clearConsole: 'Clear Console',
    copyLog: 'Copy Log',
    waitingForTask: 'Waiting for next task...',
    successProcessed: 'Successfully processed file',
    failedProcessed: 'Failed to process file',

    clearSuccess: 'All results cleared',
    copySuccess: 'Log copied to clipboard',
    copyFailed: 'Copy failed',
  },
};

// 获取翻译文本
function t(key: string): string {
  return translations[currentLanguage.value as keyof typeof translations]?.[key as keyof typeof translations.zh] || key;
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

// 语言切换
function toggleLanguage() {
  const newLanguage = currentLanguage.value === 'zh' ? 'en' : 'zh';
  currentLanguage.value = newLanguage;
  localStorage.setItem('language', newLanguage);
}

// 切换遥测
function toggleTelemetry() {
  const newState = !telemetryEnabled.value;
  telemetryEnabled.value = newState;
  setConsentStatus(newState ? 'granted' : 'declined');

  if (newState) {
    initAnalytics(() => {
      showConsentModal.value = true;
    });
  }
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
    return;
  }

  processing.value = true;
  results.value = [];
  errorMessages.value = [];

  // 追踪处理开始
  const startTime = Date.now();
  const currentTool = getCurrentToolConfig.value;

  trackFilesSelected(selectedFiles.value.length, selectedTool.value);
  trackProcessingStarted(selectedTool.value, selectedFiles.value.length, {
    useAreaData: currentTool.supportsAreaData ? useAreaData.value : false,
    windowsOptimization: currentTool.supportsWindowsOptimization ? windowsOptimization.value : false,
    language: currentLanguage.value,
  });

  try {
    // 构建处理选项
    const options: ProcessOptions = {
      toolName: selectedTool.value,
      filePaths: selectedFiles.value,
      useAreaData: currentTool.supportsAreaData ? useAreaData.value : false,
      stdSampleName: currentTool.supportsStdSample ? stdSampleName.value : undefined,
      windowsOptimization: currentTool.supportsWindowsOptimization ? windowsOptimization.value : undefined,
      verboseLog: selectedTool.value === ToolType.UPDFiler_v2 ? verboseLog.value : undefined,
      language: currentLanguage.value,
      tolerance: currentTool.supportsTolerance ? tolerance.value : undefined,
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

    // 追踪处理完成
    const durationMs = Date.now() - startTime;
    const successCount = processResults.filter(r => r.success).length;

    if (successCount === processResults.length) {
      trackProcessingCompleted(selectedTool.value, selectedFiles.value.length, durationMs, successCount);
    } else {
      // 部分失败
      const errorTypes = processResults
        .filter(r => !r.success)
        .map(r => r.originalMessage || 'unknown')
        .join(',');
      trackProcessingFailed(selectedTool.value, errorTypes, 'partial_failure');
    }

  } catch (error) {
    console.error(t('processFilesError'), error);
    errorMessages.value = [String(error)];
    showErrorDialog.value = true;

    // 追踪处理失败
    trackProcessingFailed(selectedTool.value, 'exception', String(error));
  } finally {
    processing.value = false;
  }
}

// 清除选择的文件
function clearFiles() {
  selectedFiles.value = [];
  // results.value = []; // 清除文件不一定要清除结果，保持灵活性
}

// 移除单个文件
function removeFile(index: number) {
  selectedFiles.value.splice(index, 1);
}

// 清除结果控制台
function clearConsole() {
  if (results.value.length === 0) return;
  results.value = [];
  displayToast(t('clearSuccess'));
}

// 复制日志 (这里简单实现为复制所有结果文本)
async function copyLog() {
  if (results.value.length === 0) return;
  
  const logText = results.value.map(r => {
    return `[${r.success ? 'SUCCESS' : 'ERROR'}] ${getLocalizedResultMessage(r)} ${r.error ? `(${r.error})` : ''} - ${r.file_path || ''}`;
  }).join('\n');
  
  try {
    await navigator.clipboard.writeText(logText);
    displayToast(t('copySuccess'));
  } catch (err) {
    console.error('Failed to copy log', err);
    displayToast(t('copyFailed'));
  }
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

// 更新主题类名 - 适配 Tailwind CSS dark mode
function updateThemeClass() {
  const html = document.documentElement;
  if (isDarkMode.value) {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
}

// 打开帮助中心
async function openHelpCenter() {
  try {
    const { openUrl } = await import('@tauri-apps/plugin-opener');
    await openUrl('https://docs.dingtalk.com/i/nodes/mExel2BLV5xvg52YSErl4LvbWgk9rpMq');
  } catch (error) {
    console.error(t('openHelpError'), error);
    window.open('https://docs.dingtalk.com/i/nodes/mExel2BLV5xvg52YSErl4LvbWgk9rpMq', '_blank');
  }
}

// 初始化主题和语言
onMounted(() => {
  // 初始化主题
  const savedTheme = localStorage.getItem('theme');
  // 如果没有保存的主题，检查系统偏好
  if (!savedTheme) {
    isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
  } else {
    isDarkMode.value = savedTheme === 'dark';
  }
  updateThemeClass();

  // 初始化语言
  const savedLanguage = localStorage.getItem('language');
  currentLanguage.value = savedLanguage || 'zh';

  // 初始化分析服务（非阻塞，异步执行）
  initAnalytics(() => {
    showConsentModal.value = true;
  });

  // 监听授权状态变化，实时更新遥测按钮状态
  cleanupConsentListener = onConsentChange((status) => {
    telemetryEnabled.value = status === 'granted';
  });
});

// 清理资源
onUnmounted(() => {
  cleanup();
  if (cleanupConsentListener) {
    cleanupConsentListener();
  }
  if (toastTimer) {
    clearTimeout(toastTimer);
  }
});

// 追踪工具选择变化
let previousTool: ToolType | null = null;
watch(selectedTool, (newTool) => {
  if (previousTool !== null) {
    trackToolSelected(newTool, previousTool || undefined);
  }
  previousTool = newTool;
});
</script>

<template>
  <div class="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-200 min-h-screen flex flex-col transition-colors duration-300">
    <header class="w-full px-8 py-6 flex items-center justify-between z-10 animate-fadeInUp">
      <div class="flex items-center gap-3">
        <button 
          @click="openHelpCenter"
          class="p-2 rounded-lg bg-surface-light dark:bg-surface-dark shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center w-10 h-10"
          :title="t('helpBtn')"
        >
          <span class="material-icons-round text-xl">help_outline</span>
        </button>
        <button 
          @click="showVersionUpdateDialog"
          class="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer ml-1"
        >
          v{{ appVersion }}
        </button>
      </div>
      <div class="flex flex-col items-center">
        <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:from-sky-400 dark:to-blue-400">
          CMTools
        </h1>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {{ t('subtitle') }}
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="toggleTelemetry"
          class="p-2 rounded-lg bg-surface-light dark:bg-surface-dark shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center w-10 h-10"
          :class="telemetryEnabled ? 'text-slate-600 dark:text-slate-300' : 'text-slate-300 dark:text-slate-600'"
          :title="t('telemetrySwitch')"
        >
          <span class="material-icons-round text-xl">analytics</span>
        </button>
        <button
          @click="toggleLanguage"
          class="p-2 rounded-lg bg-surface-light dark:bg-surface-dark shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center w-10 h-10"
          :title="t('languageSwitch')"
        >
          <span class="material-icons-round text-xl">translate</span>
        </button>
        <button 
          @click="toggleTheme"
          class="p-2 rounded-lg bg-surface-light dark:bg-surface-dark shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center w-10 h-10" 
          :title="isDarkMode ? t('switchToLight') : t('switchToDark')"
        >
          <span class="material-icons-round text-xl">{{ isDarkMode ? 'light_mode' : 'dark_mode' }}</span>
        </button>
      </div>
    </header>

    <main class="flex-grow flex items-center justify-center p-6 w-full max-w-[1600px] mx-auto animate-page-load">
      <div class="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-[700px]">
        
        <!-- 左侧面板 -->
        <div class="lg:col-span-5 flex flex-col gap-6">
          
          <!-- 工具选择 -->
          <section class="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 shadow-soft border border-slate-200 dark:border-slate-700/50 flex flex-col gap-4">
            <h2 class="text-lg font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <span class="material-icons-round text-primary">handyman</span>
              {{ t('selectTool') }}
            </h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button 
                v-for="(tool, index) in tools" 
                :key="tool.name"
                @click="selectedTool = tool.name"
                :class="[
                  'px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200',
                  selectedTool === tool.name 
                    ? 'bg-primary text-white shadow-glow shadow-primary/40 border-primary transform scale-[1.02]' 
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-600 hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary',
                  index === tools.length - 1 ? 'col-span-2 sm:col-span-1' : ''
                ]"
              >
                {{ tool.label }}
              </button>
            </div>
          </section>

          <!-- 文件处理 -->
          <section class="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 shadow-soft border border-slate-200 dark:border-slate-700/50 flex flex-col gap-5 flex-grow">
            <h2 class="text-lg font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <span class="material-icons-round text-primary">folder_open</span>
              {{ t('fileProcessing') }}
            </h2>
            
            <div class="flex gap-3">
              <button 
                @click="selectFiles"
                class="flex-1 py-3 px-4 bg-success/10 text-success hover:bg-success hover:text-white border border-success/20 rounded-xl flex items-center justify-center gap-2 font-medium transition-all group"
              >
                <span class="material-icons-round group-hover:text-white">add</span>
                {{ t('selectFilesBtn') }}
              </button>
              <button 
                @click="clearFiles"
                class="flex-1 py-3 px-4 bg-danger/10 text-danger hover:bg-danger hover:text-white border border-danger/20 rounded-xl flex items-center justify-center gap-2 font-medium transition-all group"
                :disabled="selectedFiles.length === 0"
                :class="{ 'opacity-50 cursor-not-allowed': selectedFiles.length === 0 }"
              >
                <span class="material-icons-round group-hover:text-white">delete_outline</span>
                {{ t('clearBtn') }}
              </button>
            </div>

            <div class="bg-panel-light dark:bg-panel-dark rounded-xl p-4 border border-slate-200 dark:border-slate-600/50 flex flex-col gap-2 min-h-[120px] max-h-[300px] overflow-hidden flex-shrink-0">
              <div class="flex justify-between items-center text-sm text-slate-500 dark:text-slate-400 mb-2">
                <span>{{ t('selectedFiles') }} ({{ selectedFiles.length }})</span>
              </div>
              
              <div v-if="selectedFiles.length === 0" class="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-500">
                 <span class="material-icons-round text-4xl mb-2 opacity-50">description</span>
                 <p class="text-xs">{{ t('selectFilesFirst') }}</p>
              </div>

              <div class="overflow-y-auto pr-1 space-y-2 flex-grow scrollbar-thin">
                <div 
                  v-for="(file, index) in selectedFiles" 
                  :key="index"
                  class="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 group hover:border-primary/30 transition-colors"
                >
                  <span class="material-icons-round text-slate-400 text-xl group-hover:text-primary transition-colors">description</span>
                  <span class="text-sm font-mono text-slate-700 dark:text-slate-300 truncate flex-1" :title="file">
                    {{ file.split(/[\\/]/).pop() }}
                  </span>
                  <button @click="removeFile(index)" class="text-slate-400 hover:text-danger p-1 rounded transition-colors opacity-0 group-hover:opacity-100">
                    <span class="material-icons-round text-sm">close</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- 处理选项 -->
            <div class="bg-panel-light dark:bg-panel-dark rounded-xl p-4 border border-slate-200 dark:border-slate-600/50 space-y-4" v-if="selectedFiles.length > 0">
              <h3 class="text-sm font-semibold text-slate-600 dark:text-slate-300">{{ t('processOptions') }}</h3>
              
              <!-- Windows 系统优化 -->
              <div class="flex items-start gap-3 group cursor-pointer" v-if="getCurrentToolConfig.supportsWindowsOptimization">
                <div class="relative flex items-center justify-center w-5 h-5">
                  <input id="opt-win" type="checkbox" v-model="windowsOptimization" 
                    class="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-800 checked:bg-primary checked:border-transparent focus:ring-2 focus:ring-primary/20 transition-all" />
                  <span class="material-icons-round absolute text-white text-sm pointer-events-none opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">check</span>
                </div>
                <label for="opt-win" class="flex flex-col cursor-pointer select-none">
                  <span class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ t('windowsOptimization') }}</span>
                  <span class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{{ t('windowsOptimizationDesc') }}</span>
                </label>
              </div>

               <!-- 峰面积数据 -->
               <div class="flex items-start gap-3 group cursor-pointer" v-if="getCurrentToolConfig.supportsAreaData">
                <div class="relative flex items-center justify-center w-5 h-5">
                  <input id="opt-area" type="checkbox" v-model="useAreaData" 
                    class="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-800 checked:bg-primary checked:border-transparent focus:ring-2 focus:ring-primary/20 transition-all" />
                  <span class="material-icons-round absolute text-white text-sm pointer-events-none opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">check</span>
                </div>
                <label for="opt-area" class="flex flex-col cursor-pointer select-none">
                  <span class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ t('useAreaData') }}</span>
                  <span class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{{ t('useAreaDataDesc') }}</span>
                </label>
              </div>
              
              <!-- 详细日志 -->
              <div class="flex items-start gap-3 group cursor-pointer" v-if="selectedTool === ToolType.UPDFiler_v2">
                <div class="relative flex items-center justify-center w-5 h-5">
                  <input id="opt-verbose" type="checkbox" v-model="verboseLog" 
                    class="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-800 checked:bg-primary checked:border-transparent focus:ring-2 focus:ring-primary/20 transition-all" />
                  <span class="material-icons-round absolute text-white text-sm pointer-events-none opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">check</span>
                </div>
                <label for="opt-verbose" class="flex flex-col cursor-pointer select-none">
                  <span class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ t('verboseLog') }}</span>
                  <span class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{{ t('verboseLogDesc') }}</span>
                </label>
              </div>

              <!-- 标准品样本名称 -->
              <div class="flex flex-col gap-2" v-if="getCurrentToolConfig.supportsStdSample">
                 <label for="std-name" class="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {{ t('stdSampleName') }}
                 </label>
                 <input
                   id="std-name"
                   type="text"
                   v-model="stdSampleName"
                   class="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                   placeholder="STD"
                 />
                 <span class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{{ t('stdSampleNameDesc') }}</span>
              </div>

              <!-- Tolerance 配置（仅 STR-Matcher 显示） -->
              <div class="flex flex-col gap-2" v-if="getCurrentToolConfig.supportsTolerance">
                <label for="tolerance-input" class="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Tolerance
                </label>
                <input
                  id="tolerance-input"
                  v-model.number="tolerance"
                  type="number"
                  step="0.01"
                  min="0"
                  class="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                  :placeholder="currentLanguage === 'zh' ? '可选，留空则不传递此参数' : 'Optional, leave blank to skip this parameter'"
                />
                <span class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {{ currentLanguage === 'zh' ? '设置 Tolerance 数值（需大于 0）' : 'Set Tolerance value (must be greater than 0)' }}
                </span>
              </div>
            </div>

            <button 
              @click="processFiles"
              :disabled="selectedFiles.length === 0 || processing"
              class="w-full mt-auto py-4 rounded-xl bg-gradient-to-r from-primary to-blue-600 hover:from-primary-dark hover:to-blue-700 text-white font-semibold shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transform transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <span class="material-icons-round" :class="{ 'animate-spin': processing, 'animate-pulse': !processing }">
                {{ processing ? 'sync' : 'rocket_launch' }}
              </span>
              {{ processing ? t('processing') : t('startProcess') }}
            </button>
          </section>
        </div>

        <!-- 右侧处理结果 -->
        <div class="lg:col-span-7 h-full flex flex-col">
          <section class="h-full bg-surface-light dark:bg-surface-dark rounded-2xl p-6 shadow-soft border border-slate-200 dark:border-slate-700/50 flex flex-col relative overflow-hidden">
            <div class="flex items-center justify-between mb-6 z-10">
              <h2 class="text-lg font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <span class="material-icons-round text-primary">terminal</span>
                {{ t('processResults') }}
              </h2>
              <div class="flex gap-2">
                <button 
                  @click="clearConsole"
                  class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors" 
                  :title="t('clearConsole')"
                >
                  <span class="material-icons-round text-sm">cleaning_services</span>
                </button>
                <button 
                  @click="copyLog"
                  class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors" 
                  :title="t('copyLog')"
                >
                  <span class="material-icons-round text-sm">content_copy</span>
                </button>
              </div>
            </div>
            
            <div class="flex-grow bg-panel-light dark:bg-panel-dark rounded-xl border border-slate-200 dark:border-slate-600/50 p-4 font-mono text-sm overflow-auto relative z-10 scrollbar-thin">
              
              <div v-if="results.length === 0" class="text-slate-400 dark:text-slate-500 italic text-xs mt-4 pl-2 border-l-2 border-slate-300 dark:border-slate-600">
                <p>{{ t('waitingForTask') }}</p>
              </div>

              <div 
                v-for="(result, index) in results" 
                :key="index"
                class="rounded-lg p-4 flex items-center justify-between group transition-colors cursor-pointer mb-3 animate-slideInRight"
                :class="[
                  result.success 
                    ? 'bg-success/5 border border-success/20 hover:bg-success/10' 
                    : 'bg-danger/5 border border-danger/20 hover:bg-danger/10'
                ]"
                @click="openFileDirectory(result.file_path)"
              >
                <div class="flex items-center gap-3 overflow-hidden">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    :class="result.success ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'"
                  >
                    <span class="material-icons-round text-lg">{{ result.success ? 'check_circle' : 'error' }}</span>
                  </div>
                  <div class="flex-grow min-w-0">
                    <p class="font-semibold text-slate-700 dark:text-slate-200 truncate" :title="getLocalizedResultMessage(result)">
                      {{ getLocalizedResultMessage(result) }}
                    </p>
                    <p v-if="result.error" class="text-xs text-danger mt-0.5 truncate" :title="result.error">
                      {{ result.error }}
                    </p>
                  </div>
                </div>
                <button class="p-2 rounded-lg bg-white dark:bg-slate-800 text-primary shadow-sm opacity-0 group-hover:opacity-100 transition-opacity border border-slate-100 dark:border-slate-700 hidden sm:block">
                  <span class="material-icons-round">folder_open</span>
                </button>
              </div>
            </div>
            
            <div class="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-primary/5 to-transparent rounded-tl-full pointer-events-none"></div>
          </section>
        </div>

      </div>

      <!-- 错误对话框 -->
      <Teleport to="body">
        <div v-if="showErrorDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-overlayFadeIn" @click="closeErrorDialog">
          <div class="bg-surface-light dark:bg-surface-dark rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-dialogSlideIn" @click.stop>
            <div class="bg-danger text-white px-6 py-4 flex justify-between items-center">
              <h3 class="font-semibold text-lg flex items-center gap-2">
                <span class="material-icons-round">warning</span>
                {{ t('processError') }}
              </h3>
              <button @click="closeErrorDialog" class="text-white hover:bg-white/20 rounded-lg p-1 transition-colors">
                <span class="material-icons-round">close</span>
              </button>
            </div>
            <div class="p-6 max-h-[60vh] overflow-y-auto">
              <div v-for="(error, index) in errorMessages" :key="index" class="p-3 mb-2 bg-danger/5 text-danger border border-danger/20 rounded-lg text-sm font-mono break-all">
                {{ error }}
              </div>
            </div>
            <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
              <button @click="closeErrorDialog" class="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors shadow-lg shadow-primary/30">
                {{ t('confirm') }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>

       <!-- 版本信息对话框 -->
       <Teleport to="body">
        <div v-if="showVersionDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-overlayFadeIn" @click="closeVersionDialog">
          <div class="bg-surface-light dark:bg-surface-dark rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-dialogSlideIn" @click.stop>
            <div class="bg-primary text-white px-6 py-4 flex justify-between items-center">
              <h3 class="font-semibold text-lg flex items-center gap-2">
                <span class="material-icons-round">info</span>
                {{ t('versionUpdateTitle') }}
              </h3>
              <button @click="closeVersionDialog" class="text-white hover:bg-white/20 rounded-lg p-1 transition-colors">
                <span class="material-icons-round">close</span>
              </button>
            </div>
            <div class="p-6">
              <div class="bg-panel-light dark:bg-panel-dark rounded-xl p-4 border border-slate-200 dark:border-slate-700 mb-4 space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-slate-600 dark:text-slate-400 font-medium">{{ t('cmtoolsVersion') }}</span>
                  <span class="font-mono bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">v{{ appVersion }}</span>
                </div>
                <div class="h-px bg-slate-200 dark:bg-slate-700"></div>
                <div class="flex justify-between items-center">
                  <span class="text-slate-600 dark:text-slate-400 font-medium">{{ t('currentTool') }}</span>
                  <span class="text-slate-700 dark:text-slate-300 font-medium">{{ getCurrentToolConfig.label }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-slate-600 dark:text-slate-400 font-medium">{{ t('toolVersion') }}</span>
                  <span v-if="loadingToolVersion" class="text-slate-500 italic flex items-center gap-1">
                    <span class="inline-block w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                    {{ t('loadingVersion') }}
                  </span>
                  <span v-else class="font-mono bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">{{ toolVersion || (currentLanguage === 'zh' ? '未知' : 'Unknown') }}</span>
                </div>
              </div>
              <div class="text-sm text-slate-500 dark:text-slate-400 border-l-4 border-primary pl-3">
                {{ t('versionUpdateMessage') }}
              </div>
            </div>
            <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
              <button @click="closeVersionDialog" class="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors shadow-lg shadow-primary/30">
                {{ t('confirm') }}
              </button>
            </div>
          </div>
        </div>
       </Teleport>

       <!-- Toast 提示 -->
       <Teleport to="body">
         <div
           v-if="showToast"
           class="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[60] bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-fadeInUp"
         >
           <span class="material-icons-round text-sm">check_circle</span>
           <span class="text-sm font-medium">{{ toastMessage }}</span>
         </div>
       </Teleport>

       <!-- 隐私授权弹窗 -->
       <ConsentModal
         :visible="showConsentModal"
         :language="currentLanguage as 'zh' | 'en'"
         @close="showConsentModal = false"
       />
    </main>
  </div>
</template>
