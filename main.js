const {
    app,
    ipcMain,
    Menu,
    dialog
} = require('electron')
const isDev = require('electron-is-dev')
const {
    autoUpdater
} = require('electron-updater')
const path = require('path')
const menuTemplate = require('./src/menuTemplate')
const AppWindow = require('./src/AppWindow')
const Store = require('electron-store')
const QiniuManager = require('./src/utils/QiniuManager')
const settingsStore = new Store({
    name: 'Settings'
})
const fileStore = new Store({
    name: 'Files Data'
})
let mainWindow, settingsWindow

const createManager = () => {
    const accessKey = settingsStore.get('accessKey')
    const secretKey = settingsStore.get('secretKey')
    const bucketName = settingsStore.get('bucketName')
    return new QiniuManager(accessKey, secretKey, bucketName)
}

app.on('ready', () => {
    if (isDev) {
        autoUpdater.updateConfigPath = path.join(__dirname, 'dev-app-update.yml') // 本地调试自动更新
        autoUpdater.checkForUpdates() // 本地检查更新
    } else {
        autoUpdater.checkForUpdatesAndNotify() // 线上检查更新
    }
    autoUpdater.autoDownload = false
    autoUpdater.on('error', (error) => {
        dialog.showErrorBox('Error: ', error == null ? "unknown" : (error.stack || error).toString())
    })
    autoUpdater.on('checking-for-update', () => {
        console.info('Checking for update...');
    })
    autoUpdater.on('update-available', () => {
        dialog.showMessageBox({
            type: 'info',
            title: '应用有新的版本',
            message: '发现新版本，是否现在更新？',
            buttons: ['是', '否']
        }, (buttonIndex) => {
            if (buttonIndex === 0) {
                autoUpdater.downloadUpdate()
            }
        })
    })
    autoUpdater.on('update-not-available', () => {
        dialog.showMessageBox({
            title: '没有新的版本',
            message: '当前已经是最新版本'
        })
    })
    autoUpdater.on('download-progress', (progressObj) => {
        let log_message = "Download speed: " + progressObj.bytesPerSecond
        log_message = log_message + ' - Downloaded ' + progressObj.percent + '%'
        log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')'
        console.info(log_message)
    })

    autoUpdater.on('update-downloaded', () => {
        dialog.showMessageBox({
            title: '安装更新',
            message: '更新下载完毕，应用将重启并进行安装'
        }, () => {
            setImmediate(() => autoUpdater.quitAndInstall())
        })
    })
    const mainWindowConfig = {
        width: 1024,
        height: 680
    }
    const urlLocation = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, './index.html')}`
    mainWindow = new AppWindow(mainWindowConfig, urlLocation)
    mainWindow.on('close', () => {
        mainWindow = null
    })
    // hook up main events
    ipcMain.on('open-settings-window', () => {
        const settingsWindowConfig = {
            width: 500,
            height: 400,
            parent: mainWindow
        }
        const settingsFileLocation = `file://${path.join(__dirname, './settings/settings.html')}`
        settingsWindow = new AppWindow(settingsWindowConfig, settingsFileLocation)
        settingsWindow.removeMenu()
        settingsWindow.on('close', () => {
            mainWindow = null
        })
    })
    // 设置 menu
    let menu = Menu.buildFromTemplate(menuTemplate)
    Menu.setApplicationMenu(menu)

    ipcMain.on('upload-file', (event, data) => {
        const manager = createManager()
        manager.uploadFile(data.key, data.path)
            .then(data => {
                console.info('上传成功', data)
                mainWindow.webContents.send('active-file-uploaded')
            })
            .catch((err) => {
                console.info(err)
                dialog.showErrorBox('同步失败', '请检查七牛云参数是否正确')
            })
    })

    ipcMain.on('download-file', (event, data) => {
        const manager = createManager()
        const filesObj = fileStore.get('files')
        const {
            key,
            path,
            id
        } = data
        manager.getStat(data.key)
            .then((resp) => {
                const serverUpdatedTime = Math.round(resp.putTime / 10000)
                const localUpdatedTime = filesObj[id].updatedAt
                if (serverUpdatedTime > localUpdatedTime || !localUpdatedTime) {
                    manager.downloadFile(key, path)
                        .then(() => {
                            mainWindow.webContents.send('file-downloaded', {
                                status: 'download-success',
                                id
                            })
                        })
                } else {
                    mainWindow.webContents.send('file-downloaded', {
                        status: 'no-new-file',
                        id
                    })
                }
            })
            .catch((err) => {
                if (err.statusCode === 612) {
                    mainWindow.webContents.send('file-downloaded', {
                        status: 'no-file',
                        id
                    })
                }
            })
    })

    ipcMain.on('upload-all-to-qiniu', () => {
        mainWindow.webContents.send('loading-status', true)
        const manager = createManager()
        const filesObj = fileStore.get('files') || {}

        // 可以用来实现图片上传（spm）
        const uploadPromiseArr = Object.keys(filesObj).map(key => {
            const file = filesObj[key]
            return manager.uploadFile(`${file.title}.md`, file.path)
        })
        Promise.all(uploadPromiseArr)
            .then(result => {
                console.info(result)
                dialog.showMessageBox({
                    type: 'info',
                    title: `成功上传${result.length}个文件`,
                    message: `成功上传${result.length}个文件`,
                })
                mainWindow.webContents.send('files-uploaded')
            })
            .catch(err => {
                dialog.showErrorBox('同步失败', '请检查七牛云参数是否正确')
            })
            .finally(() => {
                mainWindow.webContents.send('loading-status', false)
            })
    })

    ipcMain.on('config-is-saved', () => {
        // watch out menu items index for mac and windows
        let qiniuMenu = process.platform === 'darwin' ? menu.items[3] : menu.items[2]
        const switchItems = (toggle) => {
            [1, 2, 3].forEach(number => {
                qiniuMenu.submenu.items[number].enabled = toggle
            })
        }
        const qiniuIsConfiged = ['accessKey', 'secretKey', 'bucketName'].every(key => !!settingsStore.get(key))
        if (qiniuIsConfiged) {
            switchItems(true)
        } else {
            switchItems(false)
        }
    })
})