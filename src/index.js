const fs = require('fs/promises')
const {constants} = require("fs")
const path = require('path')
const uuid = require("uuid")
const {getHash} = require("./utils/hash");
const {archiveFile} = require("./utils/archive");

require('dotenv').config()

/**
 *
 * @param {string[]} files
 * @param {string} currentDir
 * @returns {Promise<void>}
 */

let stats = {
  processed: 0,
  skipped: 0,
  total: 0
}

async function processFiles(files, origin, currentDir, paths) {
  const {HashFiles} = paths
  for (const file of files) {
    const originFile = path.resolve(origin, file)
    try {
      const stat = await fs.stat(originFile)
      if (stat.isDirectory()) {
        const targetDir = path.resolve(currentDir, file)
        await fs.mkdir(targetDir)
        const subFiles = await fs.readdir(originFile)
        await processFiles(subFiles, originFile, targetDir, paths)
      } else if (stat.isFile()) {
        const hash = await getHash('sha1', originFile)
        const dest = path.resolve(
          HashFiles,
          hash.substr(0, 2),
          hash.substr(2, 2),
          `${hash}.zip`
        )
        try {
          await fs.access(dest, constants.F_OK)
          stats.skipped++
          stats.total++
          console.log(hash, '  skipped', `  ${stat.size.toString().padStart(20, ' ')}`,
            `   |   processed:  ${stats.processed.toString().padStart(10, ' ')}  skipped:  ${stats.skipped.toString().padStart(10, ' ')}  total:  ${stats.total.toString().padStart(10, ' ')}`)
        } catch {
          await archiveFile(originFile, dest, process.env.COMPRESSION_LEVEL)
          const targetFile = path.resolve(currentDir, file)
          await fs.writeFile(targetFile + '.sha1', hash)
          stats.processed++
          stats.total++
          console.log(hash, '     done', `  ${stat.size.toString().padStart(20, ' ')}`,
            `   |   processed:  ${stats.processed.toString().padStart(10, ' ')}  skipped:  ${stats.skipped.toString().padStart(10, ' ')}  total:  ${stats.total.toString().padStart(10, ' ')}`)
        }
      }
    } catch (e) {
    }
  }
}

async function prepare() {
  const target = process.env.TARGET_PATH
  const HashFiles = path.resolve(target, 'HashFiles')
  const OriginFiles = path.resolve(target, 'OriginFiles')
  try {
    await fs.access(HashFiles, constants.F_OK)
  } catch (e) {
    console.log("Preparing directories...")
    await fs.mkdir(HashFiles)
    await fs.mkdir(OriginFiles)
    for (let i = 0; i <= 0xf; i++) {
      for (let j = 0; j <= 0xf; j++) {
        await fs.mkdir(path.resolve(HashFiles, `${i.toString(16)}${j.toString(16)}`))
        for (let k = 0; k <= 0xf; k++) {
          for (let l = 0; l <= 0xf; l++) {
            await fs.mkdir(path.resolve(HashFiles, `${i.toString(16)}${j.toString(16)}/${k.toString(16)}${l.toString(16)}`))
          }
        }
      }
    }
  }
  return {
    HashFiles,
    OriginFiles
  }
}

async function main(source) {
  // const source = process.env.SOURCE_PATH
  const id = uuid.v1()
  const {OriginFiles, HashFiles} = await prepare()
  const current = path.resolve(OriginFiles, id)
  await fs.mkdir(current)
  const files = await fs.readdir(source)
  await processFiles(files, source, current, {OriginFiles, HashFiles})
}

main(process.argv[2]).then(() => {
  console.log("done")
})
