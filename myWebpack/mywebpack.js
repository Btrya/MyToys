// 1. 找到一个入口文件
// 2. 解析这个入口文件，提起他的依赖
// 3. 解析入口文件依赖的依赖，递归的去创建一个文件间的依赖图，描述所有文件的依赖关系
// 4. 把所有文件打包成一个文件

const fs = require('fs')
const babylon = require('babylon') // 获得ast树（语法树）
const traverse = require('babel-traverse').default // 遍历语法树的库
const path = require('path')
const babel = require('babel-core')

let ID = 0

function createAsset(filename) {
  const content = fs.readFileSync(filename, 'utf-8')

  const ast = babylon.parse(content, {
    sourceType: "module"
  })

  const dependencies = []

  traverse(ast, {
    ImportDeclaration: ({
      node
    }) => {
      dependencies.push(node.source.value)
    }
  })

  const id = ID++
  
  const { code } = babel.transformFromAst(ast, null, {
    presets: ['env']
  })

  return  {
    id,
    filename,
    dependencies,
    code
  }
}

function createGraph(entry) {
  const mainAsset = createAsset(entry)
  const allAsset = [mainAsset]

  for (let asset of allAsset) {
    const dirname = path.dirname(asset.filename) // 获取当前ast的目录名

    asset.mapping = {}

    asset.dependencies.forEach((relativePath) => {
      const absolutePath = path.join(dirname, relativePath) // 生成绝对路径
      const childAsset = createAsset(absolutePath)
      
      asset.mapping[relativePath] = childAsset.id
      allAsset.push(childAsset)
    })
  }
  return allAsset
}

function bundle(graph) {
  let modules = ''

  graph.forEach((module) => {
    modules += `${module.id}: [
      function(require, module, exports) {
        ${module.code}
      },
      ${JSON.stringify(module.mapping)},
    ],`
  })

  // 实现 require 方法
  const result = `
    (function(modules) {
      function require(id) {
        const [fn, mapping] = modules[id]
        function localRequire(relativePath) {
          return require(mapping[relativePath])
        }
        
        const module = { exports: {} }

        fn(localRequire, module, module.exports)

        return module.exports
      }
      require(0)
    })({${modules}})
  `
  return result
}

const graph = createGraph('./source/entry.js')
const result = bundle(graph)

console.log(result)