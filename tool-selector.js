/**
 * Tool Selector Script
 * 
 * This script handles the tool selection UI interactions.
 * It allows users to select which executable they want to use for processing files.
 */
console.log('tool-selector.js loaded and executing');

// Ensure DOM is fully loaded before binding event listeners
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM content loaded, binding tool selection event listeners');

  // Get references to tool selection buttons
  const aneuFilerBtn = document.getElementById('aneuFiler');
  const aneu23Btn = document.getElementById('aneu23');
  const shCarrierBtn = document.getElementById('shCarrier');
  
  // Tool configuration with executable names and display names
  const tools = {
    aneuFiler: {
      exeName: 'AneuFiler.exe',
      displayName: 'AneuFiler'
    },
    aneu23: {
      exeName: 'Aneu23.exe',
      displayName: 'Aneu23'
    },
    shCarrier: {
      exeName: 'SHCarrier.exe',
      displayName: 'SHCarrier'
    }
  };

  /**
   * Handle tool selection
   * @param {string} toolId - The ID of the selected tool
   */
  const selectTool = (toolId) => {
    if (tools[toolId]) {
      console.log(`Selected tool: ${toolId}`);
      
      // Store the selected tool information in localStorage
      localStorage.setItem('selectedTool', JSON.stringify({
        id: toolId,
        exeName: tools[toolId].exeName,
        displayName: tools[toolId].displayName
      }));
      
      // Navigate to the main application page
      window.location.href = 'index.html';
    } else {
      console.error(`Invalid tool ID: ${toolId}`);
    }
  };

  // Add click event listeners to tool buttons
  if (aneuFilerBtn) {
    aneuFilerBtn.addEventListener('click', () => selectTool('aneuFiler'));
  }

  if (aneu23Btn) {
    aneu23Btn.addEventListener('click', () => selectTool('aneu23'));
  }

  if (shCarrierBtn) {
    shCarrierBtn.addEventListener('click', () => selectTool('shCarrier'));
  }
  
  // Get reference to help button
  const helpBtn = document.getElementById('helpButton');
  
  // Add click event listener to help button
  if (helpBtn) {
    helpBtn.addEventListener('click', () => {
      // Open the help documentation URL
      window.open('https://alidocs.dingtalk.com/i/spaces/b6Vz6Rg8EE383zZ9/overview', '_blank');
    });
  }
  
  // Get reference to theme button
  const themeBtn = document.getElementById('themeButton');
  
  // Add click event listener to theme button
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      toggleTheme();
    });
  }

  // Initialize theme to match system preferences or stored preference
  const initializeTheme = async () => {
    console.log('Initializing theme...');
    try {
      // Check if there's a stored theme preference
      const storedTheme = localStorage.getItem('appTheme');
      let isDarkMode;
      
      if (storedTheme !== null) {
        // Use stored theme preference
        isDarkMode = storedTheme === 'dark';
        console.log('Using stored theme preference:', isDarkMode ? 'Dark' : 'Light');
      } else {
        // Use system theme preference and store it
        try {
          // Check if matchMedia is available and working
          if (window.matchMedia && typeof window.matchMedia === 'function') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            isDarkMode = mediaQuery.matches;
            console.log('System theme detected via matchMedia:', isDarkMode ? 'Dark' : 'Light');
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
   * Toggle between light and dark themes
   */
  const toggleTheme = () => {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const newTheme = isDarkMode ? 'light' : 'dark';
    
    console.log('Toggling theme to:', newTheme);
    
    // Update theme class
    updateThemeClass(!isDarkMode);
    
    // Store theme preference
    localStorage.setItem('appTheme', newTheme);
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

  // Initialize theme when the application starts
  initializeTheme();
});