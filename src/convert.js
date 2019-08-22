const fs = require('fs')
const { promisify } = require('util')
const getBuffer = async filePath => {
  try {
    const raw = await promisify(fs.readFile)(filePath)
    return Promise.resolve(Buffer.from(raw.buffer))
  } catch (error) {
    return Promise.reject(error)
  }
}

const writeData = async (dist, data) => {
  console.log(typeof data)
  return new Promise((resolve, reject) => {
    const wstream = fs.createWriteStream(dist)
    wstream.on('close', () => console.log(`closing ${dist}...`))
    wstream.on('open', () => console.log(`opening ${dist}...`))
    wstream.write(data, 'binary', error => {
      if (error) {
        wstream.end()
        reject(error)
      } else {
        wstream.end()
        resolve(true)
      }
    })
  })
}

module.exports = {
  getBuffer,
  writeData
}
