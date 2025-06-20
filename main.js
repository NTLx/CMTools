/**
 * Main process file for the Electron application.
 * This file handles the application lifecycle, window creation, and IPC communication.
 */
console.log('Hello from Electron')

// Import required Electron modules and Node.js path module
const { app, BrowserWindow, ipcMain, Menu, nativeTheme, dialog, screen } = require('electron')
const path = require('node:path')
const { spawn } = require('child_process')
const fs = require('fs')

/**
 * Creates the main application window with appropriate settings
 * Sets up the preload script and loads the tool selector HTML file
 */
const createWindow = () => {
  // 获取当前屏幕信息
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  
  // 计算初始窗口大小，不超过屏幕可用区域的100%，使用更合适的宽高比
  const initialWidth = Math.min(800, screenWidth);
  const initialHeight = Math.min(800, screenHeight);
  
  // Create a new browser window with auto-sizing capabilities
  const win = new BrowserWindow({
    width: initialWidth,
    height: initialHeight,
    resizable: true,
    autoHideMenuBar: true,
    useContentSize: true,
    backgroundColor: '#121212',
    webPreferences: {
      // Preload script runs before the renderer process starts
      preload: path.join(__dirname, 'preload.js')
    }
  })
  
  // 设置窗口最小尺寸，防止内容被挤压
  win.setMinimumSize(600, 500)

  // Load the tool selector HTML file first
  win.loadFile('tool-selector.html')
  // Open DevTools for debugging (can be removed in production)
  // win.webContents.openDevTools()
}

// When Electron has finished initializing
app.whenReady().then(() => {
  // Initialize theme to follow system preferences
  nativeTheme.themeSource = 'system';
  const systemIsDarkMode = nativeTheme.shouldUseDarkColors;
  console.log('[Theme] Detected system theme:', systemIsDarkMode ? 'Dark' : 'Light');
  
  // Store the detected system theme to localStorage for all renderer processes
  // This ensures consistent theme across all windows
  const themeValue = systemIsDarkMode ? 'dark' : 'light';
  
  // We need to set this in a way that's accessible to renderer processes
  // Store it as a global that can be accessed via IPC
  global.initialTheme = themeValue;
  console.log('[Theme] Initial theme stored globally:', themeValue);
  
  // Create the main application window
  createWindow()
  
  // Remove the default application menu
  Menu.setApplicationMenu(null)
  
  // 已移除 resize-window IPC 处理程序，改用 content-changed 事件
  
  // Handle ping IPC message for testing communication
  ipcMain.handle('ping', () => 'pong')
  
  /**
   * Get initial theme state set during app startup
   * Returns the initial theme preference detected from system
   */
  ipcMain.handle('theme:get-initial', () => {
    const initialTheme = global.initialTheme || 'light';
    console.log('[Theme] Initial theme requested:', initialTheme);
    return initialTheme === 'dark';
  });
  
  /**
   * Get current theme state
   * Returns the current dark mode state
   */
  ipcMain.handle('dark-mode:get', () => {
    const isDarkMode = nativeTheme.shouldUseDarkColors;
    console.log('[Theme] Current theme state requested:', isDarkMode ? 'Dark' : 'Light');
    return isDarkMode;
  });
  
  /**
   * Toggle between dark and light mode
   * Returns the current dark mode state after toggling
   */
  ipcMain.handle('dark-mode:toggle', () => {
    console.log('[Dark Mode] Toggle theme: Current mode =', nativeTheme.shouldUseDarkColors ? 'Dark' : 'Light');
    // Switch to opposite theme
    if (nativeTheme.shouldUseDarkColors) {
      nativeTheme.themeSource = 'light';
    } else {
      nativeTheme.themeSource = 'dark';
    }
    const newMode = nativeTheme.shouldUseDarkColors ? 'Dark' : 'Light';
    console.log('[Dark Mode] Theme switched to:', newMode);
    
    // Notify all windows that theme has been updated
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('dark-mode:updated', nativeTheme.shouldUseDarkColors);
    });
    return nativeTheme.shouldUseDarkColors;
  })
})

  /**
   * Reset theme to follow system preferences
   */
  ipcMain.handle('dark-mode:system', () => {
    console.log('[Dark Mode] Reset to system theme');
    nativeTheme.themeSource = 'system';
    const systemMode = nativeTheme.shouldUseDarkColors ? 'Dark' : 'Light';
    console.log('[Dark Mode] Current system mode:', systemMode);
    
    // Notify all windows that theme has been updated
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('dark-mode:updated', nativeTheme.shouldUseDarkColors);
    });
  });

  /**
   * Force light mode regardless of system preferences
   * Returns false to indicate light mode is active
   */
  ipcMain.handle('dark-mode:light', () => {
    console.log('[Light Mode] Switch to light mode');
    nativeTheme.themeSource = 'light';
    
    // Notify all windows that theme has been updated
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('dark-mode:updated', nativeTheme.shouldUseDarkColors);
    });
    return false;
  });

  /**
   * Process a file using the selected executable
   * @param {string} filePath - Path to the input file
   * @param {Object} options - Processing options
   * @returns {Object} - Processing result
   */
  ipcMain.handle('process-file', async (event, { filePath, options }) => {
    console.log('[CMTools] Processing file:', filePath);
    console.log('[CMTools] Options:', options);
    
    // Validate file exists
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'File does not exist' };
    }
    
    // Build command arguments
    const args = ['-i', filePath];
    
    // Add options based on user selections and tool type
    if (options.useArea) {
      args.push('-Area');
    }
    
    // 根据工具ID决定是否添加-STD参数
    if (options.toolId !== 'aneuFiler' && options.stdName && options.stdName !== 'STD') {
      args.push('-STD', options.stdName);
    }
    
    // 根据工具ID决定是否添加-GBK参数
    if (options.toolId === 'shCarrier' && options.useGBK) {
      args.push('-GBK');
    }
    
    if (options.devMode) {
      args.push('-dev');
    }
    
    // Get the selected executable name from options
    const exeName = options.exeName || 'SHCarrier.exe';
    console.log(`[CMTools] Using executable: ${exeName}`);
    console.log(`[CMTools] Command arguments: ${args.join(' ')}`);

    // Get the correct path to the executable based on the environment
    // In development mode (or when not explicitly in production), use __dirname
    // In production build, use process.resourcesPath
    const isProduction = process.env.NODE_ENV === 'production';
    const isPackaged = app.isPackaged;
    
    // If either NODE_ENV is explicitly set to 'production' OR the app is packaged,
    // consider it production mode
    let exePath;
    if (isProduction || isPackaged) {
      // 在打包环境中，可执行文件被设置为 asarUnpack，会被解压到 app.asar.unpacked 目录
      if (app.isPackaged) {
        const appPath = path.dirname(app.getAppPath());
        exePath = path.join(appPath, 'app.asar.unpacked', exeName);
        
        // 调试日志
        console.log('[CMTools] App path:', appPath);
        console.log('[CMTools] Checking unpacked path:', exePath);
        console.log('[CMTools] Unpacked path exists:', fs.existsSync(exePath));
        
        // 如果上面的路径不存在，尝试从 resources 目录加载（作为 extraResource）
        if (!fs.existsSync(exePath)) {
          exePath = path.join(process.resourcesPath, exeName);
          console.log('[CMTools] Using resources path:', exePath);
          console.log('[CMTools] Resources path exists:', fs.existsSync(exePath));
        }
      } else {
        // 兼容旧的逻辑
        exePath = path.join(process.resourcesPath, exeName);
      }
    } else {
      // 开发环境
      exePath = path.join(__dirname, exeName);
    }
    
    // Verify the executable exists
    if (!fs.existsSync(exePath)) {
      console.error('[CMTools] Executable not found at path:', exePath);
      return { 
        success: false, 
        error: `Executable not found: ${exePath}. Please ensure ${exeName} is present in the application directory.` 
      };
    }
    
    // Execute SHCarrier.exe with the provided arguments
    try {
      return new Promise((resolve, reject) => {
        console.log('[CMTools] Spawning process with working directory:', path.dirname(filePath));
        
        // Use try-catch around spawn to catch any immediate errors
        let shCarrier;
        try {
          shCarrier = spawn(exePath, args, { 
            cwd: path.dirname(filePath),
            shell: false,  // Don't use shell to avoid command injection
            windowsHide: false  // Allow window to show for debugging purposes
          });
        } catch (spawnError) {
          console.error('[CMTools] Error during spawn:', spawnError);
          return reject({ success: false, error: `Failed to launch process: ${spawnError.message}` });
        }
        
        let stdout = '';
        let stderr = '';
        
        shCarrier.stdout.on('data', (data) => {
          const output = data.toString();
          stdout += output;
          console.log('[CMTools] Output:', output);
          
          // Send progress updates to the renderer
          BrowserWindow.getAllWindows().forEach(window => {
            window.webContents.send('process-file:progress', { output });
          });
        });
        
        shCarrier.stderr.on('data', (data) => {
          const error = data.toString();
          stderr += error;
          console.error('[CMTools] Error:', error);
          
          // Send error updates to the renderer
          BrowserWindow.getAllWindows().forEach(window => {
            window.webContents.send('process-file:error', { error });
          });
        });
        
        shCarrier.on('close', (code) => {
          console.log('[CMTools] Process exited with code:', code);
          
          if (code === 0) {
            // Get the output file paths
            const inputBaseName = path.basename(filePath, path.extname(filePath));
            const inputDirName = path.dirname(filePath);
            const summaryFilePath = path.join(inputDirName, `${inputBaseName}-summary.tsv`);
            const calculationFilePath = path.join(inputDirName, `${inputBaseName}-cal.tsv`);
            
            // Check if output files were created
            const summaryExists = fs.existsSync(summaryFilePath);
            const calculationExists = fs.existsSync(calculationFilePath);
            
            resolve({ 
              success: true, 
              code, 
              stdout, 
              stderr,
              outputFiles: {
                summary: summaryExists ? summaryFilePath : null,
                calculation: calculationExists ? calculationFilePath : null
              }
            });
          } else {
            resolve({ success: false, code, stdout, stderr });
          }
        });
        
        shCarrier.on('error', (error) => {
          console.error('[CMTools] Failed to start process:', error);
          reject({ 
            filePath,
            success: false, 
            error: error.message 
          });
        });
      });
    } catch (error) {
      console.error('[CMTools] Exception:', error);
      return { success: false, error: error.message };
    }
  });

/**
 * Process multiple files using the selected executable with concurrency control
 * @param {Array<string>} filePaths - Paths to the input files
 * @param {Object} options - Processing options
 * @param {number} maxConcurrent - Maximum number of concurrent processes
 * @returns {Object} - Processing results
 */
ipcMain.handle('process-files', async (event, { filePaths, options, maxConcurrent }) => {
  console.log('[CMTools] Processing multiple files:', filePaths.length, 'files');
  console.log('[CMTools] Max concurrent processes:', maxConcurrent);
  console.log('[CMTools] Options:', options);
  
  // Validate files exist
  const validFiles = filePaths.filter(filePath => fs.existsSync(filePath));
  if (validFiles.length === 0) {
    return { success: false, error: 'No valid files to process' };
  }
  
  // Get the selected executable name from options
  const exeName = options.exeName || 'SHCarrier.exe';
  console.log(`[CMTools] Using executable: ${exeName}`);
  
  // Get the correct path to the executable
  const isProduction = process.env.NODE_ENV === 'production';
  const isPackaged = app.isPackaged;
  
  let exePath;
  if (isProduction || isPackaged) {
    // 在打包环境中，可执行文件被设置为 asarUnpack，会被解压到 app.asar.unpacked 目录
    if (app.isPackaged) {
      const appPath = path.dirname(app.getAppPath());
      exePath = path.join(appPath, 'app.asar.unpacked', exeName);
      
      // 调试日志
      console.log('[CMTools] App path:', appPath);
      console.log('[CMTools] Checking unpacked path:', exePath);
      console.log('[CMTools] Unpacked path exists:', fs.existsSync(exePath));
      
      // 如果上面的路径不存在，尝试从 resources 目录加载（作为 extraResource）
      if (!fs.existsSync(exePath)) {
        exePath = path.join(process.resourcesPath, exeName);
        console.log('[CMTools] Using resources path:', exePath);
        console.log('[CMTools] Resources path exists:', fs.existsSync(exePath));
      }
    } else {
      // 兼容旧的逻辑
      exePath = path.join(process.resourcesPath, exeName);
    }
  } else {
    // 开发环境
    exePath = path.join(__dirname, exeName);
  }
  
  // Verify the executable exists
  if (!fs.existsSync(exePath)) {
    console.error('[CMTools] Executable not found at path:', exePath);
    return { 
      success: false, 
      error: `Executable not found: ${exePath}. Please ensure ${exeName} is present in the application directory.` 
    };
  }
  
  // Process files with concurrency control
  const results = [];
  const queue = [...validFiles];
  const inProgress = new Set();
  let completed = 0;
  
  // Send initial progress update
  BrowserWindow.getAllWindows().forEach(window => {
    window.webContents.send('process-file:progress', { 
      type: 'init',
      total: validFiles.length,
      completed: 0
    });
  });
  
  // Process a single file
  const processFile = async (filePath) => {
    // Build command arguments
    const args = ['-i', filePath];
    
    // Add options based on user selections and tool type
    if (options.useArea) {
      args.push('-Area');
    }
    
    // 根据工具ID决定是否添加-STD参数
    if (options.toolId !== 'aneuFiler' && options.stdName && options.stdName !== 'STD') {
      args.push('-STD', options.stdName);
    }
    
    // 根据工具ID决定是否添加-GBK参数
    if (options.toolId === 'shCarrier' && options.useGBK) {
      args.push('-GBK');
    }
    
    if (options.devMode) {
      args.push('-dev');
    }
    
    // Execute SHCarrier.exe with the provided arguments
    return new Promise((resolve, reject) => {
      console.log('[CMTools] Processing file:', filePath);
      console.log(`[CMTools] Command arguments: ${args.join(' ')}`);

      let shCarrier;
      try {
        shCarrier = spawn(exePath, args, { 
          cwd: path.dirname(filePath),
          shell: false,  // Don't use shell to avoid command injection
          windowsHide: false  // Allow window to show for debugging purposes
        });
      } catch (spawnError) {
        console.error('[CMTools] Error during spawn:', spawnError);
        inProgress.delete(filePath);
        results.push({ filePath, success: false, error: `Failed to launch process: ${spawnError.message}` });
        return processNext();
      }
      
      let stdout = '';
      let stderr = '';
        
        shCarrier.stdout.on('data', (data) => {
          const output = data.toString();
          stdout += output;
          console.log('[CMTools] Output:', output);
          
          // Send progress updates to the renderer
          BrowserWindow.getAllWindows().forEach(window => {
            window.webContents.send('process-file:progress', { 
              filePath,
              output 
            });
          });
        });
        
        shCarrier.stderr.on('data', (data) => {
          const error = data.toString();
          stderr += error;
          console.error('[CMTools] Error:', error);
          
          // Send error updates to the renderer
          BrowserWindow.getAllWindows().forEach(window => {
            window.webContents.send('process-file:error', { 
              filePath,
              error 
            });
          });
        });
        
        shCarrier.on('close', (code) => {
          console.log('[CMTools] Process exited with code:', code, 'for file:', filePath);
          
          if (code === 0) {
            // Get the output file paths
            const inputBaseName = path.basename(filePath, path.extname(filePath));
            const inputDirName = path.dirname(filePath);
            const summaryFilePath = path.join(inputDirName, `${inputBaseName}-summary.tsv`);
            const calculationFilePath = path.join(inputDirName, `${inputBaseName}-cal.tsv`);
            
            // Check if output files were created
            const summaryExists = fs.existsSync(summaryFilePath);
            const calculationExists = fs.existsSync(calculationFilePath);
            
            resolve({ 
              filePath,
              success: true, 
              code, 
              stdout, 
              stderr,
              outputFiles: {
                summary: summaryExists ? summaryFilePath : null,
                calculation: calculationExists ? calculationFilePath : null
              }
            });
          } else {
            resolve({ 
              filePath,
              success: false, 
              code, 
              stdout, 
              stderr 
            });
          }
        });
        
        shCarrier.on('error', (error) => {
          console.error('[CMTools] Failed to start process:', error);
          reject({ 
            filePath,
            success: false, 
            error: error.message 
          });
        });
      });
  };
  
  // Process next file in queue
  const processNext = async () => {
    if (queue.length === 0) return;
    
    const filePath = queue.shift();
    inProgress.add(filePath);
    
    try {
      const result = await processFile(filePath);
      results.push(result);
      
      // Send file completion notification
      BrowserWindow.getAllWindows().forEach(window => {
        window.webContents.send('process-file:complete', { 
          filePath,
          success: result.success,
          outputFiles: result.outputFiles
        });
      });
    } catch (error) {
      results.push({
        filePath,
        success: false,
        error: error.message || 'Unknown error'
      });
      
      // Send file completion notification with error
      BrowserWindow.getAllWindows().forEach(window => {
        window.webContents.send('process-file:complete', { 
          filePath,
          success: false,
          error: error.message || 'Unknown error'
        });
      });
    }
    
    inProgress.delete(filePath);
    completed++;
    
    // Send progress update
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('process-file:progress', { 
        type: 'update',
        total: validFiles.length,
        completed
      });
    });
    
    // Process next file
    processNext();
  };
  
  // Start initial batch of processes
  const initialBatch = Math.min(maxConcurrent, queue.length);
  const initialPromises = [];
  
  for (let i = 0; i < initialBatch; i++) {
    initialPromises.push(processNext());
  }
  
  // Wait for all files to be processed
  await Promise.all(initialPromises);
  while (inProgress.size > 0) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Calculate overall success
  const successCount = results.filter(r => r.success).length;
  const success = successCount > 0;
  
  // 检查是否有处理错误的文件
  const errorResults = results.filter(r => !r.success);
  if (errorResults.length > 0) {
    // 创建错误报告窗口
    createErrorReportWindow(errorResults);
  }
  
  return {
    success,
    totalFiles: validFiles.length,
    successCount,
    failureCount: validFiles.length - successCount,
    results
  };
});

/**
 * Open a file dialog to select input files
 */
ipcMain.handle('open-file-dialog', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Data Files', extensions: ['txt', 'csv', 'tsv'] },
      { name: 'All Files', extensions: [] }
    ]
  });
  
  if (canceled || filePaths.length === 0) {
    return { canceled: true };
  }
  
  return { canceled: false, filePaths };
});

/**
 * Get system CPU information
 */
ipcMain.handle('get-cpu-info', () => {
  const os = require('os');
  const cpuCount = os.cpus().length;
  return { cpuCount };
});

/**
 * Open a file in the system's default application
 */
ipcMain.handle('open-file', (event, filePath) => {
  if (fs.existsSync(filePath)) {
    const { shell } = require('electron');
    shell.openPath(filePath);
    return { success: true };
  } else {
    return { success: false, error: 'File does not exist' };
  }
});

// On macOS, recreate the window when the dock icon is clicked and no windows are open
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
});

/**
 * Creates an error report window to display processing errors
 * @param {Array} errorResults - Array of file processing results with errors
 */
const createErrorReportWindow = (errorResults) => {
  // 获取当前屏幕信息
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  
  // 计算窗口大小
  const windowWidth = Math.min(600, screenWidth);
  const windowHeight = Math.min(500, screenHeight);
  
  // 创建新窗口
  const errorWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    title: '处理错误报告',
    autoHideMenuBar: true,
    backgroundColor: '#121212',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // 确保在打包环境中可以正确加载本地文件
      webSecurity: false
    }
  });
  
  // 调试信息
  console.log('[ErrorReport] Creating error report window');
  console.log('[ErrorReport] App is packaged:', app.isPackaged);
  console.log('[ErrorReport] __dirname:', __dirname);
  console.log('[ErrorReport] process.resourcesPath:', process.resourcesPath);
  console.log('[ErrorReport] app.getAppPath():', app.getAppPath());
  
  try {
    // 根据打包状态选择正确的HTML文件路径
    let htmlPath;
    if (app.isPackaged) {
      // 在打包环境中，首先尝试从app.asar目录加载
      const appPath = path.dirname(app.getAppPath());
      htmlPath = path.join(appPath, 'app.asar', 'error-report.html');
      
      // 调试日志
      console.log('[ErrorReport] App path:', appPath);
      console.log('[ErrorReport] Checking asar path:', htmlPath);
      console.log('[ErrorReport] Asar path exists:', fs.existsSync(htmlPath));
      
      // 检查文件是否存在
      if (!fs.existsSync(htmlPath)) {
        // 如果不存在，尝试从resources目录加载（作为extraResource）
        htmlPath = path.join(process.resourcesPath, 'error-report.html');
        console.log('[ErrorReport] Using resources path for HTML:', htmlPath);
        console.log('[ErrorReport] Resources path exists:', fs.existsSync(htmlPath));
      } else {
        console.log('[ErrorReport] Using app.asar path for HTML:', htmlPath);
      }
    } else {
      // 在开发环境中，使用相对路径
      htmlPath = 'error-report.html';
      console.log('[ErrorReport] Using relative path for HTML:', htmlPath);
    }
    
    // 使用loadFile加载HTML文件
    errorWindow.loadFile(htmlPath);
    
    // 等待页面加载完成后发送错误数据
    errorWindow.webContents.on('did-finish-load', () => {
      console.log('[ErrorReport] Page loaded, sending error data');
      errorWindow.webContents.send('error-report:data', { errorResults });
    });
    
    // 添加加载失败处理
    errorWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('[ErrorReport] Failed to load error report HTML:', errorCode, errorDescription);
      
      // 尝试使用其他可能的路径
      if (app.isPackaged) {
        // 尝试多种可能的路径
        const possiblePaths = [
          path.join(app.getAppPath(), 'error-report.html'),
          path.join(process.resourcesPath, 'app.asar', 'error-report.html'),
          path.join(process.resourcesPath, 'app', 'error-report.html'),
          path.join(app.getPath('exe'), '..', 'error-report.html'),
          path.join(app.getPath('exe'), '..', 'resources', 'error-report.html')
        ];
        
        console.log('[ErrorReport] Trying alternative paths:');
        possiblePaths.forEach(p => console.log(' - ' + p));
        
        // 尝试所有可能的路径
        let pathIndex = 0;
        const tryNextPath = () => {
          if (pathIndex < possiblePaths.length) {
            const nextPath = possiblePaths[pathIndex++];
            console.log(`[ErrorReport] Trying path ${pathIndex}:`, nextPath);
            
            // 检查文件是否存在
            if (fs.existsSync(nextPath)) {
              console.log('[ErrorReport] File exists, loading:', nextPath);
              errorWindow.loadFile(nextPath);
            } else {
              console.log('[ErrorReport] File does not exist:', nextPath);
              tryNextPath();
            }
          } else {
            console.error('[ErrorReport] All paths failed, showing error message');
            // 如果所有路径都失败，显示错误信息
            errorWindow.loadURL(`data:text/html,
              <html>
                <head>
                  <title>错误报告加载失败</title>
                  <style>
                    body { font-family: Arial, sans-serif; background-color: #121212; color: #ffffff; text-align: center; padding: 50px; }
                    h1 { color: #ff6b6b; }
                    pre { background-color: #1e1e1e; padding: 15px; border-radius: 5px; text-align: left; overflow: auto; }
                  </style>
                </head>
                <body>
                  <h1>错误报告加载失败</h1>
                  <p>无法加载错误报告HTML文件。请确保应用程序安装正确。</p>
                  <p>处理错误信息:</p>
                  <pre>${JSON.stringify(errorResults, null, 2)}</pre>
                </body>
              </html>
            `);
          }
        };
        
        tryNextPath();
      }
    });
  } catch (error) {
    console.error('[ErrorReport] Error creating error report window:', error);
  }
};

// Quit the application when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }}
);