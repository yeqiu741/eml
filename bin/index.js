#! /usr/bin/env node
const { Command } = require('commander')
const program = new Command()
const index = require('../lib/index.js')
program
  .version(require('../package.json').version, '-v, --version')
  .description('获取当前工具的版本号')
  .usage('-v, --version')
program
  .command('set <size>')
  .description('扩大引擎内存大小')
  .action((size) => {
    index(size)
  })
program.parse(process.argv)