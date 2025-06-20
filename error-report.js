// Theme management functions
const updateThemeClass = (isDarkMode) => {
  document.body.classList.toggle('dark-mode', isDarkMode);
  document.body.classList.toggle('light-mode', !isDarkMode);
};

// Initialize theme based on stored preference from tool selector
const initializeTheme = () => {
  console.log('Initializing theme from stored preference...');
  try {
    // Get stored theme preference set by tool selector
    const storedTheme = localStorage.getItem('appTheme');
    let isDarkMode;
    
    if (storedTheme !== null) {
      isDarkMode = storedTheme === 'dark';
      console.log('Using stored theme preference:', isDarkMode ? 'Dark' : 'Light');
    } else {
      // Default to light mode if no preference is stored
      console.log('No stored theme preference found, defaulting to light mode');
      isDarkMode = false;
      localStorage.setItem('appTheme', 'light');
    }
    
    // Apply the theme
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

// Error report functionality
const initializeErrorReport = () => {
  // Listen for theme updates
  window.darkMode.onUpdate((isDarkMode) => {
    document.body.classList.toggle('dark-mode', isDarkMode);
    document.body.classList.toggle('light-mode', !isDarkMode);
  });
  
  // Initialize theme
  initializeTheme();
  
  // Get error content container
  const errorContent = document.getElementById('error-content');
  
  // Listen for error report data
  window.errorReport.onData((data) => {
    const { errorResults } = data;
    
    if (!errorResults || errorResults.length === 0) {
      errorContent.innerHTML = '<p class="no-errors">没有发现处理错误</p>';
      return;
    }
    
    // Create error list
    const errorList = document.createElement('ul');
    errorList.className = 'error-list';
    
    // Add each error item
    errorResults.forEach(result => {
      const errorItem = document.createElement('li');
      errorItem.className = 'error-item';
      
      const filePath = document.createElement('div');
      filePath.className = 'file-path';
      filePath.textContent = `文件: ${result.filePath}`;
      
      const errorStatus = document.createElement('div');
      errorStatus.className = 'error-status';
      errorStatus.innerHTML = `状态: 处理失败 <span class="error-code">错误码: ${result.code || 'N/A'}</span>`;
      
      const errorMessage = document.createElement('div');
      errorMessage.className = 'error-message';
      errorMessage.textContent = result.error || result.stderr || '未知错误';
      
      errorItem.appendChild(filePath);
      errorItem.appendChild(errorStatus);
      errorItem.appendChild(errorMessage);
      errorList.appendChild(errorItem);
    });
    
    // Update content
    errorContent.innerHTML = '';
    errorContent.appendChild(errorList);
  });
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeErrorReport);

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeErrorReport);
} else {
  initializeErrorReport();
}