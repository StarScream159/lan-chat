# LAN Chat

![lan chat icon](https://lab.robertmeyer.ca/robert.meyer/lan-chat/-/raw/master/src/img/icons/png/512x512.png)

[![verison 0.1.0](https://img.shields.io/badge/version-0.1.0-lightgray)](https://lab.robertmeyer.ca/robert.meyer/lan-chat/) [![Electron](https://img.shields.io/badge/electron-8.2.5-9feaf9)](https://www.electronjs.org/) [![size 108 MB](https://img.shields.io/badge/size-108%20MB-blue](https://lab.robertmeyer.ca/robert.meyer/lan-chat/)

A modern server-less, database-less, login-less simple peer-to-peer LAN messaging application. Useful for sending links and other simple messages to other comptuers on the local area network without the need for setting up accounts and logging into a service.

![screenshot](https://lab.robertmeyer.ca/robert.meyer/lan-chat/-/raw/master/src/img/screenshots/screenshot1.png)

# Features
- [x] Cross platform: windows, mac, linux
- [x] No login required
- [x] No central server
- [x] Completely local area network
- [x] No chat history
- [x] Auto start with system
- [x] Minimize app to tray and run in background
- [x] Open links in external browser
- [x] Auto copy incoming message links to clipboard
- [x] Responsive
- [x] Modern UI

### Tech

LAN Chat uses a number of open source projects to work properly:

* [ElectronJS](https://www.electronjs.org) - Build cross-platform desktop apps with JavaScript, HTML, and CSS 
* [Electron Settings](https://www.npmjs.com/package/electron-settings) - Stores app settings in json flat-file
* [evilscan](https://www.npmjs.com/package/evilscan) - Network scanner to scan for other LAN Chat clients
* [node-portfinder](https://www.npmjs.com/package/portfinder) - Get open open on host OS for listening for incoming communications
* [validurl](https://www.npmjs.com/package/valid-url) - Detect if incoming message is a URL and if so copy to clipboard (if enabled)
* [custom-electron-titlebar](https://www.npmjs.com/package/custom-electron-titlebar) - A modern looking app title bar (Windows)
* [node-auto-launch](https://www.npmjs.com/package/auto-launch) - Register and launch the application on system login (if enabled)
* [jQuery](https://jquery.com/) - DOM management and manipulation

### Installation

You can use the installer package for your platform, or build from source if you'd like.

### Development/Building

LAN Chat uses ElectronJS and standard HTML + JS + CSS. Make sure your system has Electron installed, and then pull the repo. into a folder of your choosing. Next install all dependencies:

```sh
$ npm install
```

With all the dependencies installed you now have the following commands avaiable:

#### Running for developement:
```sh
$ npm run start
```
There is no hot-reload, so if you make changes to the source after the application has started you can sometimes use the developer tools to reload the application Window. Or you can break (Ctrl+C / Command+C twice) the npm command and re-run.

#### Building for release:
```sh
$ npm run make
```
Check the `./out/make/` folder for the installer package, or the `./out/lan-chat-win32-x64/` (or platform specific) folder for the compiled portable binary and library files.

## Todos

 - Maybe add message history and persistance?
 - Add dark theme
 - Incoming message notifications (with setting to disable)
 - Suggest a feature

License
----
[MIT](https://lab.robertmeyer.ca/robert.meyer/lan-chat/-/raw/master/LICENSE)