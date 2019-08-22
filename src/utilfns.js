const fs = require('fs')
const path = require('path')
const msExtensions = ['.docx', '.xlsx', '.pptx']

/** Retrieve file paths from a given folder and its subfolders. */
export const getFilePaths = folderPath => {
  const entryPaths = fs
    .readdirSync(folderPath)
    .map(entry => path.join(folderPath, entry))
  const filePaths = entryPaths.filter(entryPath =>
    fs.statSync(entryPath).isFile()
  )
  const dirPaths = entryPaths.filter(
    entryPath => !filePaths.includes(entryPath)
  )
  const dirFiles = dirPaths.reduce(
    (prev, curr) => prev.concat(getFilePaths(curr)),
    []
  )
  return [...filePaths, ...dirFiles]
}

export const getLastUpdatedFolder = folderPath => {
  const entryPaths = fs
    .readdirSync(folderPath)
    .map(entry => path.join(folderPath, entry))
  const folderPaths = entryPaths
    .filter(entryPath => fs.statSync(entryPath).isDirectory())
    .filter(
      folder =>
        path.basename(folder) !== 'natives' && path.basename(folder) !== 'pdf'
    )
    .map(folder => getFileProps(folder))
    .sort((folderA, folderB) => {
      return folderA.updated > folderB.updated ? -1 : 1
    })
    .map(folder => folder.filePath)
  return folderPaths[0]
}

export const getMSDocsPaths = folderPath => {
  const entryPaths = fs
    .readdirSync(folderPath)
    .map(entry => path.join(folderPath, entry))
  const filePaths = entryPaths
    .filter(
      entryPath =>
        fs.statSync(entryPath).isFile() &&
        msExtensions.includes(path.extname(entryPath))
    )
    .map(flPath => ({
      basename: path.basename(flPath, path.extname(flPath)),
      ext: path.extname(flPath),
      path: flPath,
      parent: folderPath
    }))

  return filePaths
}
export const getFileProps = filePath => {
  const name = path.basename(filePath)
  const ext = path.extname(filePath)
  const size = formatBytes(fs.statSync(filePath).size)
  const updated = new Date(fs.statSync(filePath).mtime).getTime()
  return {
    id: new String(filePath).replace(/\\/g, '-') + '-' + name,
    filePath,
    name,
    ext,
    size,
    updated,
    data: {
      status: 'Not Converted'
    }
  }
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}
