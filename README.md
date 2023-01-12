# @yyzq/eml
## npm包情况
[![npm version](https://img.shields.io/npm/v/@yyzq/eml.svg?style=flat-square)](https://www.npmjs.org/package/@yyzq/eml)[![npm downloads](https://img.shields.io/npm/dm/@yyzq/eml.svg?style=flat-square)](https://npm-stat.com/charts.html?package=@yyzq/eml)
## 简介
windows环境下自动化V8引擎内存设定工具 
## 安装
```
npm i @yyzq/eml -g
或者
yarn add @yyzq/eml -g
```
## 使用
`eml set <size>`: size为要设定的内存大小，单位是MB
## 流程
1. 检测当前系统是否是win系统，如果是则继续进行，如果不是则进行控制台打印信息提示，然后终止程序。（此处主要考虑该情况只在win环境下出现，所以便对机型做了筛选）
2. 获取当前本机的最大内存，并与用户输入的要设定的内存大大小进行比较，如果大于本机最大内存，则在控制台打印信息提示，然后终止程序。
3. 检测命令执行目录下是否含有package.json文件，如果没有则控制台提示信息，然后终止程序。（此处主要过滤非node项目的情况）
4. 开始检测当前全局环境是否存在increase-memory-limit cross-env npm包，缺哪个则在全局安装哪个。
5. 之后开始通过创建node子进程执行：`cross-env LIMIT=${ size } increase-memory-limit`, 执行成功后打印出扩容后的内存大小，本地的总内存大小，当前闲置内存大小。
6. 开始读取node_modules中所有的文件，然后筛选出.cmd格式的文件
7. 遍历读取所有.cmd文件，并将`“%_prog%”`进行正则匹配进而进行替换成：`%_prog%`
8. 检测经过替换，文件是否发生了变动，如果没有则不进行写入操作。
9. 每修改完成一个文件就在控制台打印出相关成功提示


