<script setup lang="ts">
import { computed } from 'vue';
import { setConsentStatus } from '../utils/analytics';

// Props
interface Props {
  visible: boolean;
  language?: 'zh' | 'en';
}

const props = withDefaults(defineProps<Props>(), {
  language: 'zh',
});

// Emits
const emit = defineEmits<{
  close: [];
}>();

// 翻译文本
const translations = {
  zh: {
    title: '隐私政策与数据收集',
    description:
      '我们会收集匿名使用数据以改进产品体验。这些数据不包含您的文件内容或个人身份信息。',
    details: [
      '收集应用版本、操作系统类型等基础信息',
      '记录功能使用频率，帮助我们优化产品',
      '所有数据通过加密连接发送，确保安全',
      '您可以随时在设置中更改此选项',
    ],
    accept: '同意并继续',
    decline: '拒绝',
    privacyNote: '拒绝不会影响应用的正常使用',
  },
  en: {
    title: 'Privacy Policy & Data Collection',
    description:
      'We collect anonymous usage data to improve the product experience. This data does not include your file contents or personal identity information.',
    details: [
      'Collect basic information such as app version and OS type',
      'Record feature usage frequency to help us optimize the product',
      'All data is sent via encrypted connection for security',
      'You can change this option in settings at any time',
    ],
    accept: 'Accept & Continue',
    decline: 'Decline',
    privacyNote: 'Declining will not affect normal app usage',
  },
};

const t = computed(() => translations[props.language]);

// 处理同意
function handleAccept(): void {
  setConsentStatus('granted');
  emit('close');
}

// 处理拒绝
function handleDecline(): void {
  setConsentStatus('declined');
  emit('close');
}

// 点击背景关闭
function handleBackdropClick(event: MouseEvent): void {
  if (event.target === event.currentTarget) {
    handleDecline();
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="visible"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        @click="handleBackdropClick"
      >
        <Transition
          enter-active-class="transition-all duration-300"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-200"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="visible"
            class="bg-surface-light dark:bg-surface-dark rounded-2xl w-full max-w-md shadow-2xl overflow-hidden mx-4"
            @click.stop
          >
            <!-- 头部 -->
            <div
              class="bg-gradient-to-r from-primary to-blue-600 text-white px-6 py-4"
            >
              <h3 class="font-semibold text-lg flex items-center gap-2">
                <span class="material-icons-round">shield</span>
                {{ t.title }}
              </h3>
            </div>

            <!-- 内容 -->
            <div class="p-6">
              <p class="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
                {{ t.description }}
              </p>

              <ul class="space-y-2 mb-6">
                <li
                  v-for="(detail, index) in t.details"
                  :key="index"
                  class="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400"
                >
                  <span class="material-icons-round text-primary text-base mt-0.5 flex-shrink-0">
                    check_circle
                  </span>
                  <span>{{ detail }}</span>
                </li>
              </ul>

              <p class="text-xs text-slate-500 dark:text-slate-500 italic mb-6">
                {{ t.privacyNote }}
              </p>

              <!-- 按钮 -->
              <div class="flex gap-3">
                <button
                  @click="handleDecline"
                  class="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-medium transition-all"
                >
                  {{ t.decline }}
                </button>
                <button
                  @click="handleAccept"
                  class="flex-1 py-3 px-4 bg-gradient-to-r from-primary to-blue-600 hover:from-primary-dark hover:to-blue-700 text-white rounded-xl font-medium shadow-lg shadow-primary/30 transition-all"
                >
                  {{ t.accept }}
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
