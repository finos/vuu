var app = require('app');  // Module to control application life.
var BrowserWindow = require('browser-window');  // Module to create native browser window.

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;

app.commandLine.appendSwitch('allow-insecure-localhost');

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform != 'darwin') {
    app.quit();
  }
});



app.on ("certificate-error", (event, webContents, url, error, cert, callback) => {
  // Do some verification based on the URL to not allow potentially malicious certs:
  //if (url.startsWith ("https://localhost:8443/index.html")) {
    // Hint: For more security, you may actually perform some checks against
    // the passed certificate (parameter "cert") right here
    event.preventDefault (); // Stop Chromium from rejecting the certificate
    callback (true);         // Trust this certificate
  //} else callback (false);     // Let Chromium do its thing
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 900, height: 600});

  // and load the index.html of the app.
  mainWindow.loadURL('https://localhost:8443/index.html');

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
});
