const { exec } = require('child_process')
const fse = require('fs-extra')
// 使用promise二次封装chid_process模块
function execPromise(directive) {
  return new Promise((resolve) => {
    exec(directive, (error, stdout, stderr) => {
      resolve({ error, data: { stdout, stderr } })
    })
  })
}

// 使用promise封装fs-extra相关api
function readdir(path) {
  return new Promise((resolve, reject) => {
    fse.readdir(path, (err, files) => {
      resolve([err, files])
    })
  })
}
function readFile(path) {
  return new Promise((resolve, reject) => {
    fse.readFile(path, (err, detail) => {
      resolve([err, detail])
    })
  })
}
function outputFile(path, content) {
  return new Promise((resolve, reject) => {
    fse.outputFile(path, content, (err) => {
      resolve(err)
    })
  })
}
module.exports = {
  execPromise,
  readdir,
  readFile,
  outputFile
}