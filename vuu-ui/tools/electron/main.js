// eslint-disable-next-line no-undef, @typescript-eslint/no-var-requires
const { app, BrowserWindow } = require("electron");

app.commandLine.appendSwitch("allow-insecure-localhost");

const createWindow = async () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 600,
    webPreferences: {
      webSecurity: true,
      plugins: true,
    },
  });

  //mainWindow.webContents.openDevTools();

  mainWindow.loadURL("https://localhost:8443/index.html");

  mainWindow.maximize();
};

app.on(
  "certificate-error",
  (event, webContents, url, error, cert, callback) => {
    // Do some verification based on the URL to not allow potentially malicious certs:
    //if (url.startsWith ("https://localhost:8443/index.html")) {
    // Hint: For more security, you may actually perform some checks against
    // the passed certificate (parameter "cert") right here
    event.preventDefault(); // Stop Chromium from rejecting the certificate
    callback(true); // Trust this certificate
    //} else callback (false);     // Let Chromium do its thing
  }
);

app.whenReady().then(() => {
  createWindow();
});
