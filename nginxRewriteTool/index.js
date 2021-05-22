/**
 * 该脚本用于处理 nginx.conf 多个 rewrite 转发请求，又需要匹配代码去修改
 * 时间复杂度 O(n * m + k)， n 为 转发请求数量， m 为 读取的可能涉及修改的文件数量， k 为处理 conf 文件的时间，为固定值
 * @author Btrya 
 */
// 引入基本包
const fs = require('fs');
const readline = require('readline');
const path = require('path')

// 定义要读取的数据源 *.conf
const originDataPath = 'test.conf';
// 定义对应的 匹配 对象, 需要遵循 由 精确 到 广泛 的排序
const rewriteObj = {
  "/(.*)/(.*)": "/console/login2",
  "/(.*)": "/$1",
  "(.*)": "$1"
}
// 定义一个 全局变量 存储 读取源数据后并处理过的最终 二维数组，该数组会以json的形式打印到 apiData.json 中方便后续debug
let finalOriginData = null
// 定义 保护的目录 （读取文件路径时直接跳过）
let protectFilePath = ['static', 'node_modules', 'bower_components', 'webpack', 'gulp', 'dist', 'dest', 'dll', 'WEB-INF', 'mock']
// 定义 需要匹配的后缀文件 
let targetSuffix = ['.js']

// 定义读取方法
function read_file(path, callback) {
  let fRead = fs.createReadStream(path);
  let objReadline = readline.createInterface({
    input: fRead
  });
  let arr = new Array();
  objReadline.on('line', (line) => {
    const child = line.split(" ").filter((a) => a !== "").slice(1, 3) // 处理过滤 剩下两个
    if (child.length > 0) arr.push(fillterVar(child))  // 空数组不添加
  })
  objReadline.on('close', () => {
    generateJSONFIle(arr, callback)
  });
}

// 生成json文件
function generateJSONFIle(data, callback) {
  finalOriginData = data
  let str = JSON.stringify(data, "", "\t")
  fs.writeFile('apiData.json', str, (err) => {
    if (err) console.log('ERROR! generateJSONFIle error, the error msg is:', err)
    else {
      console.log('Generate apiData.JSON Successful!')
      callback('aledy generate apiData.json')
    }
  })
}

// 过滤(.*) 和 $1 等变量值
function fillterVar(arr) {
  let left = arr[0], right = arr[1] // 取到 nginx.conf 中对应关系的 目标值 为 left， 要转发到的 地址 为 right
  for (let key in rewriteObj) {
    const from = key, target = rewriteObj[key] // 需要变为空的对应 目标值 为 from， 要转发到的 地址 为 target
    if (left.indexOf(from) !== -1 && right.indexOf(target) !== -1) {
      left = left.replace(from, '')
      right = right.replace(target, '')
      break // 修改过了直接break掉，防止继续往下匹配
    }
  }
  return [left.substr(2), right.substr(1)] // 截取左边的 ^/ ，右边的 /
}

// 读取文件目录函数 这里需要过滤掉定义好的目录做剪枝 只查.js结尾的文件
function read_filePaths(dir) {
  let results = []
  let list = fs.readdirSync(dir)
  list.forEach((file) => {
    // 不允许访问的目录直接 return
    if (protectFilePath.includes(file)) return false
    file = dir + '/' + file
    let stat = fs.statSync(file)
    if (stat && stat.isDirectory()) {
      results = results.concat(read_filePaths(file)) // 回调继续找子目录
    } else {
      // 过滤后缀名
      if (targetSuffix.includes(path.extname(file))) {
        results.push(path.resolve(__dirname, file))
      }
    }
  })
  return results
}

// 匹配文件中对应的 api 改为要转发的 新api路径
function dealScri(arr) {
  arr.forEach((filePath) => {
    console.log('In the processing -----', filePath)
    let fileStr = fs.readFileSync(filePath, 'utf-8') // 根据文件路径读取对应的文件内容
    for (let item of finalOriginData) { // 文件内容匹配最终需要修改的内容，有则修改，此处无法剪枝
      const from = item[0], target = item[1]
      fileStr = fileStr.replace(from, target)
    }
    fs.writeFileSync(filePath, fileStr)
  })
  console.timeEnd('processing use time')
  console.log('Processing is complete!!!')
}

//调用方法
console.time('processing use time')
read_file(originDataPath, function (data) {
  console.log(data)
  dealScri(read_filePaths('./ConsoleStatic'))
});