/**
 * Preload Script
 * 
 * This script runs in a privileged context before the renderer process starts.
 * It can access both Node.js APIs and a limited set of Electron APIs.
 * Used to expose specific functionality from the main process to the renderer process.
 */
const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose the darkMode API to the renderer process
 * This allows the renderer to communicate with the main process
 * for theme-related functionality while maintaining security context isolation
 */
contextBridge.exposeInMainWorld('darkMode', {
  // Toggle between dark and light mode
  toggle: () => ipcRenderer.invoke('dark-mode:toggle'),
  
  // Force light mode
  light: () => ipcRenderer.invoke('dark-mode:light'),
  
  // Reset to system theme preferences
  system: () => ipcRenderer.invoke('dark-mode:system'),
  
  // Register a callback to be notified when the theme changes
  onUpdate: (callback) => ipcRenderer.on('dark-mode:updated', (event, isDarkMode) => callback(isDarkMode))
});

// Expose tool selection methods
contextBridge.exposeInMainWorld('toolSelector', {
  // Get the selected tool from localStorage
  getSelectedTool: () => {
    try {
      const toolData = localStorage.getItem('selectedTool');
      return toolData ? JSON.parse(toolData) : null;
    } catch (error) {
      console.error('Error getting selected tool:', error);
      return null;
    }
  },
  // Set the selected tool in localStorage
  setSelectedTool: (toolData) => {
    try {
      localStorage.setItem('selectedTool', JSON.stringify(toolData));
      return true;
    } catch (error) {
      console.error('Error setting selected tool:', error);
      return false;
    }
  }
})

/**
 * Expose the fileProcessor API to the renderer process
 * This allows the renderer to communicate with the main process
 * for file processing functionality
 */
contextBridge.exposeInMainWorld('fileProcessor', {
  // Process a file using CMTools.exe
  processFile: (filePath, options) => ipcRenderer.invoke('process-file', { filePath, options }),
  
  // Process multiple files using CMTools.exe
  processFiles: (filePaths, options, maxConcurrent) => ipcRenderer.invoke('process-files', { filePaths, options, maxConcurrent }),
  
  // Open a file dialog to select input files
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  
  // Get CPU information
  getCpuInfo: () => ipcRenderer.invoke('get-cpu-info'),
  
  // Open a file in the system's default application
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
  
  // Register a callback to be notified of processing progress
  onProgress: (callback) => ipcRenderer.on('process-file:progress', (event, data) => callback(data)),
  
  // Register a callback to be notified of processing errors
  onError: (callback) => ipcRenderer.on('process-file:error', (event, data) => callback(data)),
  
  // Register a callback to be notified of file completion
  onFileComplete: (callback) => ipcRenderer.on('process-file:complete', (event, data) => callback(data))
});

/**
 * Expose the errorReport API to the renderer process
 * This allows the renderer to receive error report data from the main process
 */
contextBridge.exposeInMainWorld('errorReport', {
  // Register a callback to receive error report data
  onData: (callback) => ipcRenderer.on('error-report:data', (event, data) => callback(data))
});

// 窗口管理功能已简化，不再需要 windowManager API