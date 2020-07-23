const {
	contextBridge,
	ipcRenderer
} = require("electron");
const net = require('net');

function init() {
  // add global variables to your web page
  window.isElectron = true;
  window.net = net;
}

init();