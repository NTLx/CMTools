// Theme management functions
const updateThemeClass = (isDarkMode) => {
  document.body.classList.toggle('dark-mode', isDarkMode);
  document.body.classList.toggle('light-mode', !isDarkMode);
};

// Initialize theme based on stored preference or system theme
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