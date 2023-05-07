const path = require('path')
const fs = require('fs-extra')
const utils = require('./utils')
const log = console.log
const chalk = require('chalk')
const spinner = require('ora')()
const os = require('os')
module.exports = async function(size) {
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
  const { error, data: { stdout, stderr } } = await utils.execPromise('npm ls -g -dep0')
  if (error) {
    spinner.fail(chalk.red(`执行出错：${ error }`))
    return
  }
  spinner.succeed(chalk.green('查询完毕'))
  if (stdout.indexOf('increase-memory-limit') === -1) {
    spinner.warn(chalk.green('increase-memory-limit 不存在\n'))
    spinner.stop()
    spinner.text = chalk.green('开始全局安装 increase-memoyr-limit 依赖包\n')
    spinner.start()
    const { error, data: { stdout, stderr } } = await utils.execPromise('npm i increase-memory-limit -g')
    if (error) {
      spinner.fail(chalk.red(`执行出错： ${ error }`))
      return
    }
    spinner.succeed(chalk.green('increase-memory-limit 安装完成\n'))
  } else {
    spinner.succeed(chalk.green('increase-memory-limit 已存在\n'))
  }
  if (stdout.indexOf('cross-env') === -1) {
    spinner.warn(chalk.green('cross-env 不存在'))
    spinner.stop()
    spinner.text = chalk.green('开始全局安装 cross-env 依赖包\n')
    spinner.start()
    const { error, data: { stdout, stderr } } = await utils.execPromise('npm i cross-env -g')
    if (error) {
      spinner.fail(chalk.red(`执行出错： ${ error }`))
      return
    }
    spinner.succeed(chalk.green('cross-env 安装完成\n'))
  } else {
    spinner.succeed(chalk.green('cross-env 已存在'))
  }
  spinner.stop()
  spinner.text = chalk.green('开始给V8引擎扩容')
  spinner.start()
  const { error: kerror } = await utils.execPromise(`cross-env LIMIT=${ size } increase-memory-limit`)
  if (kerror) {
    spinner.fail(`扩容失败, 错误信息：${ kerror }`)
    spinner.stop()
    return
  }
  spinner.succeed(chalk.green(`V8引擎内存扩容成功，扩容后V8引擎可使用内存大小为：${ (size/1024).toFixed(2) }G`))
  spinner.succeed(chalk.green(`本地总内存大小为：${ (os.totalmem()/(1024*1024*1024)).toFixed(0) }G`))
  spinner.succeed(chalk.green(`当前本地闲置内存大小为：${ (os.freemem()/(1024*1024*1024)).toFixed(0) }G`))
  spinner.stop()
  spinner.text = chalk.green('开始搜索并修改.cmd文件\n')
  spinner.start()

  const node_modules = path.resolve(cwd, './node_modules')
  const isNodeModules = fs.existsSync(node_modules)
  if (!isNodeModules) {
    spinner.warn(chalk.yellow('该项目还未下载依赖'))
    spinner.stop()
    spinner.text = chalk.green('开始下载依赖\n')
    spinner.start()
    const { error, data: { stdout, stderr } } = await utils.execPromise('npm i')
    if (error) {
      spinner.fail(chalk.red(`执行出错： ${ error }`))
      return
    }
    spinner.succeed(chalk.green('依赖安装完成\n'))
  }
  const nodeModulesDirPath = path.resolve(cwd, './node_modules/.bin')
  let [err, data] = await utils.readdir(nodeModulesDirPath)
  if (err) return spinner.fail(chalk.red(`node_modules文件夹读取失败，失败信息：${err}`))
  data = data.filter((item) => /.cmd$/.test(item))
  let isFail = false
  for(let value of data) {
    const targetPath = path.resolve(cwd, './node_modules/.bin', `./${ value }`)
    const [err, detail] = await utils.readFile(targetPath)
    if (err) return spinner.fail(chalk.red(`${ value } 文件读取失败，失败信息：${err}`))
    const fileDetail = detail.toString()
    const newContent = fileDetail.replace(/\"%_prog%\"/, '%_prog%')
    if (fileDetail === newContent) {
      spinner.succeed(chalk.gray(`  ${ chalk.green(value) }  文件未发生变化，不执行更新操作`))
    } else {
      const err = await utils.outputFile(targetPath, newContent)
      if (err) {
        spinner.fail(chalk.red(`${ value } 文件修改失败`))
        isFail = true
      } else {
        spinner.succeed(chalk.green(`${ value } 修改成功`))
      }
    } 
  }
  if (isFail) {
    spinner.fail(chalk.red('有文件修改失败，请删除node_modules文件夹，然后执行npm i重新安装所有的npm包。 \n'))
  } else {
    spinner.succeed(chalk.green('执行完毕，现在可以尝试重新启动项目了哦。 \n'))
  }
}