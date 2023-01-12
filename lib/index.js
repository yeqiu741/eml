const path = require('path')
const fs = require('fs-extra')
const { exec } = require('child_process')
const log = console.log
const chalk = require('chalk')
const spinner = require('ora')()
const os = require('os')
module.exports = function(size) {
  const platform = os.platform()
  if (platform !== 'win32') {
    log(chalk.red('该插件只适用于windows环境'))
    return
  }
  const osTotalmen = os.totalmem()/(1024*1024)
  if (size > osTotalmen) {
    log('')
    log(chalk.red('设置V8引擎可用内存大小不能超过本机总内存大小'))
    log(chalk.red(`本地总内存大小为：${ (os.totalmen()/(1024*1024*1024)).toFixed(0) }G`))
    log('')
    return
  }
  const cwd = process.cwd()
  const targetDir = path.resolve(cwd, './package.json')
  const ispackageJson = fs.existsSync(targetDir)
  if (!ispackageJson) {
    log('')
    log(chalk.red('当前目录下不存在package.json文件，请在真是目录下执行该命令。'))
    log('')
    return
  }
  spinner.text = chalk.green(' 开始检测当前环境是否存在increase-memory-limit cross-env npm 包\n')
  spinner.color = 'green'
  spinner.start()
  exec('npm ls -g -dep0', (error, stdout, stderr) => {
    if (error) {
      spinner.fail(chalk.red(`执行出错：${ error }`))
      return
    }
    spinner.succeed(chalk.green('查询完毕'))
    if (stdout.indexOf('increase-memory-limit') === -1) {
      spinner.warn(chalk.green('increase-memory-limit 不存在，开始下载...'))
      exec('npm i increase-memory-limit -g', (error, stdout, stderr) => {
        if (error) {
          spinner.fail(chalk.red(`执行出错： ${ error }`))
          return
        }
        spinner.succeed(chalk.green('increase-memory-limit 安装完成\n'))
      })
    } else {
      spinner.succeed(chalk.green('increase-memory-limit 已存在'))
    }
    if (stdout.indexOf('cross-env') === -1) {
      spinner.warn(chalk.green('cross-env 不存在，开始下载...'))
      exec('npm i cross-env -g', (error, stdout, stderr) => {
        if (error) {
          spinner.fail(chalk.red(`执行出错： ${ error }`))
          return
        }
        spinner.succeed(chalk.green('cross-env 安装完成\n'))
      })
    } else {
      spinner.succeed(chalk.green('cross-env 已存在'))
    }
    spinner.stop()
    spinner.text = chalk.green('开始给V8引擎扩容')
    spinner.start()
    exec(`cross-env LIMIT=${ size } increase-memory-limit`, (error, stdout, stderr) => {
      if (error) {
        spinner.fail(`扩容失败, 错误信息：${ error }`)
        spinner.stop()
        return
      }
      spinner.succeed(chalk.green(`V8引擎内存扩容成功，扩容后V8引擎可使用内存大小为：${ (size/1024).toFixed(2) }G`))
      spinner.succeed(chalk.green(`本地总内存大小为：${ (os.totalmem()/(1024*1024*1024)).toFixed(0) }G`))
      spinner.succeed(chalk.green(`当前本地闲置内存大小为：${ (os.freemem()/(1024*1024*1024)).toFixed(0) }G`))
      spinner.stop()
      spinner.text = chalk.green('开始搜索并修改.cmd文件\n')
      spinner.start()
      fs.readFile(path.resolve(cwd, './node_modules/.bin'), (err, files) => {
        let count = 0
        let tag = 0
        let failState = false
        if (err) {
          spinner.fail(chalk.red('文件读取异常，.bin目录可能不存在。'))
          return
        }
        const arr = files.filter((item) => /.cmd$/.test(item))
        arr.forEach((item) => {
          const targetPath = path.resolve(cwd, './node_modules/.bin', `./${ item }`)
          fs.readFile(targetPath, (err, detail) => {
            if (err) {
              spinner.fail(chalk.red(`${ item }  文件读取失败`))
              failState = true
              return
            }
            const fileDetail = detail.toString()
            const newContent = fileDetail.replace(/\"%_prog%\"/, '%_prog%')
            if (fileDetail === newContent) {
              spinner.succeed(chalk.gray(`  ${ chalk.green(item) }  文件未发生变化，不执行更新操作`))
              return
            }
            fs.outputFile(targetPath, newContent, (err) => {
              if (err) {
                spinner.fail(chalk.red(`${ item } 文件写入失败`))
                failState = true
                return
              }
              count += 1
              spinner.succeed(chalk.green(`${ item } 修改成功`))
            })
          })
        })
        const interval = setInterval(() => {
          if (failState) {
            clearInterval(interval)
            spinner.fail(chalk.red('有文件修改失败，请删除node_modules文件夹，然后执行npm i重新安装所有的npm包。 \n'))
          }
          if (count === arr.length || tag === 20) {
            clearInterval(interval)
            log('\n')
            spinner.succeed(chalk.green('执行完毕，现在可以尝试重新启动项目了哦。 \n'))
          } else {
            tag += 1 
          }
        }, 100);
      })
    })
  })
}