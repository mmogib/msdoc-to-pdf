'use strict'
import {
  app,
  protocol,
  BrowserWindow,
  ipcMain as ipc,
  dialog,
  Menu
} from 'electron'
import {
  createProtocol,
  installVueDevtools
} from 'vue-cli-plugin-electron-builder/lib'

import Datastore from 'nedb'
import axios from 'axios'
import fs, { createReadStream } from 'fs'

import * as rimraf from 'rimraf'
import path from 'path'
import { promisify } from 'util'
import {
  getFilePaths,
  getFileProps,
  getLastUpdatedFolder,
  getMSDocsPaths
} from './utilfns'

import { getBuffer, writeData } from './convert'
import { menu } from './menu'
const isDevelopment = process.env.NODE_ENV !== 'production'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
const dbFile = isDevelopment
  ? path.resolve(__dirname, 'database.db')
  : path.join(process.env['APPDATA'], '/.uploadtracker/database.db')
let db = new Datastore({
  filename: dbFile,
  autoload: true,
  timestampData: true
})
// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 960,
    height: 700,
    webPreferences: {
      nodeIntegration: true
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  win.on('closed', () => {
    win = null
  })
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installVueDevtools()
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
  Menu.setApplicationMenu(menu)
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

ipc.on('new-folder', (e, file) => {
  db.update(
    { id: 'lastFolder' },
    { $set: { id: 'lastFolder', folder: file.path, type: 'info' } },
    {
      upsert: true
    },
    err => {
      if (err) {
        showError(err)
      } else {
        e.sender.send('folder-saved')
      }
    }
  )
})

ipc.on('get-last-folder', e => {
  db.findOne({ id: 'lastFolder' }).exec((err, docs) => {
    if (!err) {
      const { folder = null } = docs || { folder: null }
      if (folder) {
        let data
        const lastUpdated = getLastUpdatedFolder(folder)
        if (lastUpdated) {
          const msFiles = getMSDocsPaths(lastUpdated)
          const files = msFiles.map(v => ({ ...v, ...getFileProps(v.path) }))
          data = { folder: folder, files }
        } else {
          data = { folder: folder, files: [] }
        }

        e.sender.send('got-folder', data)
      } else {
        e.sender.send('got-folder', {})
      }
    } else {
      showError(err)
    }
  })
})

ipc.on('update-file', (e, { id, files }) => {
  db.update(
    { _id: id },
    { $set: { files: files } },
    {
      upsert: false
    },
    err => {
      if (!err) {
        e.sender.send('folder-saved')
      }
    }
  )
})

ipc.on('upload-file', (e, file) => {
  axios
    .post(
      'https://content.dropboxapi.com/2/files/upload',
      fs.readFileSync(file.filePath),
      {
        headers: {
          Authorization: `Bearer ${process.env.VUE_APP_DBX_TOKEN}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify({
            path: `/${file.name}`,
            mode: 'add',
            autorename: true,
            mute: false,
            strict_conflict: false
          })
        }
      }
    )
    .then(res => e.sender.send('upload-finished'))
    .catch(err => showError(err.message))
})

const showError = err => {
  dialog.showMessageBox(win, {
    title: 'Error Message',
    type: 'error',
    buttons: [],
    message: err
  })
}

const showMsg = msg => {
  dialog.showMessageBox(win, {
    title: 'Message',
    type: 'info',
    buttons: [],
    message: msg
  })
}
ipc.on('start-converting', async (e, { baseFolder, files }) => {
  const [_, ...rest] = baseFolder.split('\\').reverse()
  const upOne = baseFolder === './' ? baseFolder : rest.reverse().join('\\')
  const source = `${upOne}/SOURCE`
  const natives = `${source}/NATIVE`
  const pdf = `${source}/PDF`
  const exist = async file =>
    promisify(fs.stat)(file)
      .then(() => true)
      .catch(() => false)
  const mkdir = promisify(fs.mkdir)
  const rmdir = promisify(rimraf)
  const cp = promisify(fs.copyFile)

  try {
    const sourceExist = await exist(source)
    if (sourceExist) {
      await rmdir(source)
    }
    await mkdir(source)
    await mkdir(natives)
    await mkdir(pdf)
    await Promise.all(
      files.map(
        async file => await cp(file.filePath, natives + '/' + file.name)
      )
    )
    showMsg(`Your recent MS files have been copied to ${natives}.`)
    e.sender.send('done-converting')
  } catch (error) {
    e.sender.send('done-converting')
    showError('Internal Error')
  }
})

/*
git fetch origin
git reset --hard origin/master

*/
