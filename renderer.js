/**
 * Renderer Process Script
 * 
 * This script runs in the renderer process and handles the UI interactions.
 * It communicates with the main process through the exposed APIs in the preload script.
 * Primarily responsible for theme switching functionality and UI updates.
 */
console.log('renderer.js loaded and executing');

// Ensure DOM is fully loaded before binding event listeners
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM content loaded, binding event listeners');
  
  // Get the selected tool information from localStorage
  const getSelectedTool = () => {
    try {
      const toolData = localStorage.getItem('selectedTool');
      return toolData ? JSON.parse(toolData) : null;
    } catch (error) {
      console.error('[CMTools] Error getting selected tool:', error);
      return null;
    }
  };
  
  // Update the UI with the selected tool information
  const updateToolInfo = () => {
    const toolNameElement = document.getElementById('tool-name');
    const selectedTool = getSelectedTool();
    
    if (selectedTool && toolNameElement) {
      toolNameElement.textContent = selectedTool.displayName;
      document.title = `CMTools - ${selectedTool.displayName}`;
      console.log(`[CMTools] Using tool: ${selectedTool.displayName}`);
      
      // 根据选择的工具隐藏相应的选项
      const stdNameOption = document.querySelector('.option label[for="std-name"]').parentElement;
      const gbkOption = document.querySelector('.option label[for="use-gbk"]').parentElement;
      
      if (selectedTool.id === 'aneu23') {
        // Aneu23不接受-GBK参数，隐藏Windows系统优化选项
        if (gbkOption) gbkOption.style.display = 'none';
        if (stdNameOption) stdNameOption.style.display = 'block';
      } else if (selectedTool.id === 'aneuFiler') {
        // AneuFiler不接受-GBK和-STD参数，隐藏Windows系统优化和标准品样本名称选项
        if (gbkOption) gbkOption.style.display = 'none';
        if (stdNameOption) stdNameOption.style.display = 'none';
      } else {
        // SHCarrier接受所有参数，显示所有选项
        if (gbkOption) gbkOption.style.display = 'block';
        if (stdNameOption) stdNameOption.style.display = 'block';
      }
    } else {
      // If no tool is selected, redirect to tool selector
      window.location.href = 'tool-selector.html';
    }
  };
  
  // Handle change tool button click
  const handleChangeToolClick = () => {
    window.location.href = 'tool-selector.html';
  };
  
  // Set up change tool button event listener
  const changeToolButton = document.getElementById('change-tool-button');
  if (changeToolButton) {
    changeToolButton.addEventListener('click', handleChangeToolClick);
  } else {
    console.error('change-tool-button element not found');
  }
  
  // Update the UI with the selected tool information
  updateToolInfo();

  // Theme is now automatically managed based on system preferences
  console.log('Theme is now automatically managed based on system preferences');

  /**
   * Initialize the application theme
   * Uses stored theme preference from tool selector
   */
  const initializeTheme = async () => {
    console.log('Initializing theme from stored preference...');
    try {
      // Get stored theme preference
      const storedTheme = localStorage.getItem('appTheme');
      let isDarkMode;
      
      if (storedTheme !== null) {
        // Use stored theme preference
        isDarkMode = storedTheme === 'dark';
        console.log('Using stored theme preference:', isDarkMode ? 'Dark' : 'Light');
      } else {
        // Fallback to system theme if no preference stored
        try {
          // Check if matchMedia is available and working
          if (window.matchMedia && typeof window.matchMedia === 'function') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            isDarkMode = mediaQuery.matches;
            console.log('No stored theme found, using system theme via matchMedia:', isDarkMode ? 'Dark' : 'Light');
          } else {
            // Fallback to light mode if matchMedia is not available
            console.warn('matchMedia not available, defaulting to light mode');
            isDarkMode = false;
          }
        } catch (mediaError) {
          console.warn('Error detecting system theme, defaulting to light mode:', mediaError);
          isDarkMode = false;
        }
        
        // Store the detected or default theme
        localStorage.setItem('appTheme', isDarkMode ? 'dark' : 'light');
      }
      
      // Ensure updateThemeClass is called after a short delay to ensure DOM is ready
      setTimeout(() => {
        updateThemeClass(isDarkMode);
      }, 10);
    } catch (error) {
      console.error('Theme initialization failed:', error);
      // Fallback to light mode
      setTimeout(() => {
        updateThemeClass(false);
      }, 10);
    }
  };

  /**
   * Updates the body class to reflect the current theme
   * @param {boolean} isDarkMode - Whether dark mode is active
   */
  const updateThemeClass = (isDarkMode) => {
    console.log('Updating theme style:', isDarkMode);
    document.body.classList.toggle('dark-mode', isDarkMode);
    document.body.classList.toggle('light-mode', !isDarkMode);
  };

  // Theme control buttons have been removed - theme now automatically follows system preferences

  /**
   * Listen for theme update events from the main process
   * from outside the renderer (e.g., system theme changes)
   */
  try {
    window.darkMode.onUpdate((isDarkMode) => {
      console.log('[Dark Mode] Theme update notification received:', isDarkMode ? 'Dark' : 'Light');
      updateThemeClass(isDarkMode);
    });
    console.log('Theme update event listener registered');
  } catch (error) {
    console.error('Failed to register theme update event:', error);
  }

  // Initialize theme when the application starts
  initializeTheme();

  // Get references to file upload DOM elements
  const fileInput = document.getElementById('file-input');
  const selectFileButton = document.getElementById('select-file-button');
  const selectedFilesCount = document.getElementById('selected-file-count');
  const selectedFilesList = document.getElementById('selected-files-list');
  const processFileBtn = document.getElementById('process-file');
  const processingStatus = document.getElementById('processing-status');
  const processingProgress = document.getElementById('processing-progress');
  const progressBar = document.getElementById('progress-bar');
  const processedCount = document.getElementById('processed-count');
  const totalCount = document.getElementById('total-count');
  
  // Get references to processing options DOM elements
  const useAreaCheckbox = document.getElementById('use-area');
  const stdNameInput = document.getElementById('std-name');
  const useGBKCheckbox = document.getElementById('use-gbk');
  // Ensure GBK checkbox is checked by default (Windows system optimization)
  if (useGBKCheckbox && !useGBKCheckbox.checked) {
    useGBKCheckbox.checked = true;
  }
  // Development mode is now hidden from UI and disabled by default
  const devModeCheckbox = { checked: false }; // Simulate checkbox element with dev mode disabled

  // Variable to store the currently selected file paths
  let selectedFilePaths = [];
  let maxConcurrentProcesses = 1; // Default to 1, will be updated based on CPU count

  /**
   * Initialize CPU information
   */
  const initCpuInfo = async () => {
    try {
      const cpuInfo = await window.fileProcessor.getCpuInfo();
      maxConcurrentProcesses = cpuInfo.cpuCount || 1;
      console.log('[CPU Info] Available CPU threads:', maxConcurrentProcesses);
    } catch (error) {
      console.error('[CPU Info] Failed to get CPU info:', error);
      maxConcurrentProcesses = 1; // Fallback to 1 thread
    }
  };

  /**
   * Updates the UI to reflect the selected files
   * @param {Array<string>} filePaths - Paths to the selected files
   */
  const updateSelectedFiles = (filePaths) => {
    selectedFilePaths = filePaths || [];
    selectedFilesCount.textContent = selectedFilePaths.length;
    processFileBtn.disabled = selectedFilePaths.length === 0;
    
    // Clear any previous processing status
    processingStatus.textContent = '';
    processingStatus.classList.remove('success', 'error');
    processingProgress.style.display = 'none';
    
    // Update the files list
    selectedFilesList.innerHTML = '';
    
    if (selectedFilePaths.length > 0) {
      selectedFilePaths.forEach((filePath, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const fileName = document.createElement('div');
        fileName.className = 'file-name';
        fileName.title = filePath;
        fileName.textContent = path.basename(filePath);
        
        const removeButton = document.createElement('button');
        removeButton.className = 'remove-file';
        removeButton.textContent = '×';
        removeButton.title = '移除文件';
        removeButton.addEventListener('click', () => removeFile(index));
        
        fileItem.appendChild(fileName);
        fileItem.appendChild(removeButton);
        selectedFilesList.appendChild(fileItem);
      });
    }
    
    console.log('[File Upload] Selected files:', selectedFilePaths);
  };

  /**
   * Remove a file from the selected files list
   * @param {number} index - Index of the file to remove
   */
  const removeFile = (index) => {
    if (index >= 0 && index < selectedFilePaths.length) {
      const newFilePaths = [...selectedFilePaths];
      newFilePaths.splice(index, 1);
      updateSelectedFiles(newFilePaths);
    }
  };

  /**
   * Handle file select button click
   */
  const handleSelectFileButtonClick = () => {
    // Directly open the file dialog without using the input element
    openFileDialog();
  };

  /**
   * Handle file input change events - this is now unused as we're using openFileDialog directly
   * @param {Event} event - The change event
   */
  const handleFileInputChange = (event) => {
    // This function is now unused, but we'll keep it for compatibility
    // and clear the input value so it doesn't interfere with our new approach
    if (event.target) {
      event.target.value = '';
    }
  };

  /**
   * Open file dialog to select files
   */
  const openFileDialog = async () => {
    try {
      const result = await window.fileProcessor.openFileDialog();
      
      if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
        updateSelectedFiles(result.filePaths);
      }
    } catch (error) {
      console.error('[File Upload] Failed to open file dialog:', error);
    }
  };

  /**
   * Process the selected files using the selected executable
   */
  const processFiles = async () => {
    if (selectedFilePaths.length === 0) {
      processingStatus.textContent = 'Error: No files selected.';
      processingStatus.classList.add('error');
      return;
    }
    
    // Get the selected tool information
    const selectedTool = getSelectedTool();
    if (!selectedTool) {
      processingStatus.textContent = 'Error: No tool selected.';
      processingStatus.classList.add('error');
      return;
    }
    
    // Disable the process button during processing
    processFileBtn.disabled = true;
    
    // Clear previous status and show processing message
    processingStatus.textContent = 'Processing files...';
    processingStatus.classList.remove('success', 'error');
    
    // Show progress bar
    processingProgress.style.display = 'block';
    progressBar.style.width = '0%';
    processedCount.textContent = '0';
    totalCount.textContent = selectedFilePaths.length;
    
    // Get processing options and add the selected executable name
    const options = {
      useArea: useAreaCheckbox.checked,
      stdName: stdNameInput.value.trim(),
      useGBK: useGBKCheckbox.checked,
      devMode: devModeCheckbox.checked,
      exeName: selectedTool.exeName,  // Add the selected executable name
      toolId: selectedTool.id         // Add the tool ID for reference
    };
    
    console.log(`[CMTools] Processing files with ${selectedTool.displayName}:`, options);
    console.log('[CMTools] Max concurrent processes:', maxConcurrentProcesses);
    
    try {
      const result = await window.fileProcessor.processFiles(
        selectedFilePaths, 
        options, 
        maxConcurrentProcesses
      );
      
      handleProcessResult(result);
    } catch (error) {
      processingStatus.textContent = `Error: ${error.message || 'Unknown error occurred.'}`;
      processingStatus.classList.add('error');
      console.error('[CMTools] Processing error:', error);
      // Re-enable the process button
      processFileBtn.disabled = selectedFilePaths.length === 0;
    }
  };
  
  /**
   * Handle the processing result
   * @param {Object} result - The processing result
   */
  const handleProcessResult = (result) => {
    // 更新处理状态
    processingStatus.textContent = '处理完成';
    processingStatus.classList.remove('processing');
    
    // 根据处理结果设置不同的状态样式
    if (result.successCount === result.totalFiles) {
      // 全部成功 - 绿色
      processingStatus.classList.add('success');
      progressBar.classList.add('success');
    } else if (result.successCount === 0) {
      // 全部失败 - 红色
      processingStatus.classList.add('error');
      progressBar.classList.add('error');
    } else {
      // 部分成功部分失败 - 橙色
      processingStatus.classList.add('warning');
      progressBar.classList.add('warning');
    }
    
    // 更新进度条
    progressBar.style.width = '100%';
    
    // 显示处理结果统计
    const resultMessage = `处理完成: 共 ${result.totalFiles} 个文件，成功 ${result.successCount} 个，失败 ${result.failureCount} 个`;
    processingStatus.textContent = resultMessage;
    
    // 启用处理按钮
    processFileBtn.disabled = selectedFilePaths.length === 0;
    
    // 如果有错误信息，显示错误信息
    if (result.failureCount > 0 && result.error) {
      console.error('[CMTools] Processing failed:', result.error);
      processingStatus.textContent = `${resultMessage}. ${result.error || ''}`;
    }
  };

  /**
   * Register progress update handler
   */
  const registerProgressHandler = () => {
    try {
      // Handle progress updates
      window.fileProcessor.onProgress((data) => {
        if (data.type === 'init') {
          // Initialize progress bar
          processedCount.textContent = '0';
          totalCount.textContent = data.total;
          progressBar.style.width = '0%';
        } else if (data.type === 'update') {
          // Update progress bar
          const percent = (data.completed / data.total) * 100;
          progressBar.style.width = `${percent}%`;
          processedCount.textContent = data.completed;
        } else if (data.output) {
          console.log('[CMTools] Progress:', data.output);
        }
      });
      
      // Handle error updates
      window.fileProcessor.onError((data) => {
        if (data.error) {
          console.error('[CMTools] Error:', data.error);
        }
      });
      
      // Handle file completion
      window.fileProcessor.onFileComplete((data) => {
        console.log('[CMTools] File completed:', data.filePath, 'Success:', data.success);
        
        // Could update a per-file status indicator here if needed
      });
      
      console.log('[CMTools] Progress handlers registered');
    } catch (error) {
      console.error('[CMTools] Failed to register progress handlers:', error);
    }
  };

  // Set up file input event listener
  if (fileInput) {
    fileInput.addEventListener('change', handleFileInputChange);
  } else {
    console.error('file-input element not found');
  }

  // Set up select file button event listener
  if (selectFileButton) {
    selectFileButton.addEventListener('click', handleSelectFileButtonClick);
  } else {
    console.error('select-file-button element not found');
  }

  // Set up process file button event listener
  if (processFileBtn) {
    processFileBtn.addEventListener('click', processFiles);
  } else {
    console.error('process-file button not found');
  }

  // Initialize CPU information
  initCpuInfo();
  
  // Register progress handlers
  registerProgressHandler();
  
  // 窗口大小自适应功能已简化，不再需要监听内容变化
});
