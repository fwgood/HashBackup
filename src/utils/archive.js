const fs = require("fs")
const path = require("path")
const archiver = require("archiver")

/**
 *
 * @param {string} source
 * @param {string} destination
 * @param {number} compressionLevel
 */
async function archiveFile(source, destination,compressionLevel ) {
  return new Promise(((resolve, reject) => {
    const output = fs.createWriteStream(destination)
    const archive = archiver('zip', {
      zlib: {
        level: compressionLevel
      }
    })
    output.on('close',function (){
      resolve()
    })
    archive.on('warning', function(err) {
      reject(err)
    });
    archive.on('error', function(err) {
      reject(err)
    });
    archive.pipe(output)

    archive.append(fs.createReadStream(source),{
      name: path.basename(source)
    })
    archive.finalize()
  }))
}

module.exports = {
  archiveFile
}