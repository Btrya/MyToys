# 实现一个自己的打包工具

webpack

本质上，webpack是一个现代js应用程序的静态模块打包器

当 webpack 处理应用程序的时候，它会递归的构建一个依赖关系图，其中包含应用程序需要的每个模块。然后将所有这些模块打包成一个或者多个bundle。

1. Esmodule

```js
import axios from 'axios';

export default axios;
```

## 概览

1. 找到一个入口文件
2. 解析这个入口文件，提起他的依赖
3. 解析入口文件依赖的依赖，递归的去创建一个文件间的依赖图，描述所有文件的依赖关系
4. 把所有文件打包成一个文件

## 开始开发

1. 新建几个js源文件
* name.js
* message.js
* entry.js

2. 肉眼观察三个文件的依赖关系

entry 依赖 message， message 依赖 name
entry.js => message.js => name.js

3. 开始编写自己的打包工具， mywebpack.js
```js
const fs = require('fs')

function createAsset(filename) {
  const content = fs.readFileSync(filename, 'utf-8')
  console.log(content)
}

createAsset('./source/entry.js')
```

4. 分析`ast`，思考如何能够解析出entry.js的依赖

4.1 File -> program
4.2 program -> body 里面是我们各种语法的描述
4.3 ImportDeclaration 引入的声明
4.4 ImportDeclaration source 属性，souce.value 就是引入文件的地址 './message.js'

5. 生成 entry.js 的 ast

babylon 一个基于babel的js解析工具。

```js
const fs = require('fs')
const babylon = require('babylon')

function createAsset(filename) {
  const content = fs.readFileSync(filename, 'utf-8')

  const ast = babylon.parse(content, {
    sourceType: "module"
  })

  console.log(ast)
}

createAsset('./source/entry.js')
```

6. 基于 AST ，找到entry.js的 ImportDeclaration Node
```js
const fs = require('fs')
const babylon = require('babylon') // 获得ast树
const traverse = require('babel-traverse').default

function createAsset(filename) {
  const content = fs.readFileSync(filename, 'utf-8')

  const ast = babylon.parse(content, {
    sourceType: "module"
  })

  traverse(ast, {
    ImportDeclaration: ({
      node
    }) => {
      console.log(node)
    }
  })
}

createAsset('./source/entry.js')
```

7. 获取 entry.js 的依赖
```js
const fs = require('fs')
const babylon = require('babylon') // 获得ast树
const traverse = require('babel-traverse').default

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
      // console.log(node)
    }
  })
  
  console.log(dependencies)
}

createAsset('./source/entry.js')
```

8. 优化 createAsset，使其能够区分文件 

因为要获取所有文件的依赖，所以我们需要一个id来标识所有文件。
这里直接使用一个自增 number，这样遍历的每个文件id就唯一了。

先获取到 entry.js 的 id filename 以及 dependencies
```js
const fs = require('fs')
const babylon = require('babylon') // 获得ast树
const traverse = require('babel-traverse').default

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
  return  {
    id,
    filename,
    dependencies
  }
}

const mainAsset = createAsset('./source/entry.js')

console.log(mainAsset)
```

9. 获取到单个文件的依赖了，接下来尝试建立依赖图

新增一个函数 createGraph， 把 createAsset 调用移入 createGraph

entry的路径需要是动态的，所以 createGraph 接收一个参数 entry

```js
function createGraph(entry) {
  const mainAsset = createAsset(entry)
  return mainAsset
}

const graph = createGraph('./source/entry.js')

console.log(graph)
```

10. 上面存储的都是相对路径，想办法把他们转为绝对路径

有了绝对路径，在任何地方才能获取到各个文件的 asset 

```js
function createGraph(entry) {
  const mainAsset = createAsset(entry)
  const allAsset = [mainAsset]

  for (let asset of allAsset) {
    const dirname = path.dirname(asset.filename) // 获取当前ast的目录名

    asset.dependencies.forEach((relativePath) => {
      const absolutePath = path.join(dirname, relativePath) // 生成绝对路径
      const childAsset = createAsset(absolutePath)
    })
  }
}
```

11. 我们需要一个map，记录 depend 中的相对路径和 childAsset 的对应关系

后续依赖关系的引入需要这样的对应关系

```js
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
    })
  }
}
```

12. 接下来就要开始遍历所有文件了
```js
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
```
这里拿到依赖图了。

13. 新增一个方法 bundle
```js
function bundle(graph) {

}

const graph = createGraph('./source/entry.js')
const result = bundle(graph)


console.log(result)
```

14. 创建整体的结果代码， 因为最后打包出来的东西需要一个参数且需要立即执行， 所以写一个自执行函数来包裹

自执行函数接收的参数是?  是 module ，是每一个文件模块

```js
function bundle(graph) {
  let modules = ''

  graph.forEach((module) => {
    modules += `${module.id}: [

    ],`
  })

  const result = `
    (function() {

    })({${modules}})
  `
}
```

15. 编译所有源代码
```js
  const { code } = babel.transformFromAst(ast, null, {
    presets: ['env']
  })
```

16. 把编译后的代码，假如我们的result中

CommonJS的规范要求：

1. module变量代表当前模块

这个变量是一个对象，它的exports属性是对外的接口。 module.exports,加载某个模块，其实就是加载该模块的 module.exports 属性

2. require  

3. 最后return 一个 module.exports