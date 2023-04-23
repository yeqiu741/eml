const { exec } = require('child_process')
module.exports = function execPromise(directive) {
  return new Promise((resolve) => {
    exec(directive, (error, stdout, stderr) => {
      resolve({ error, data: { stdout, stderr } })
    })
  })
}