const crypto = require("crypto")
const fs = require("fs")


/**
 *
 * @param {'sha1'|'md5'} algorithm
 * @param {string} file
 * @returns {Promise<string>}
 */
async function getHash(algorithm,file) {
  return new Promise(((resolve, reject) => {
    const stream = fs.createReadStream(file)
    const fsHash = crypto.createHash(algorithm)

    stream.on("data",function (d){
      fsHash.update(d)
    })
    stream.on('end',function (){
      const hash = fsHash.digest('hex')
      resolve(hash)
    })
    stream.on('error',function (e){
      reject(e)
    })
  }))
}

module.exports = {
  getHash
}