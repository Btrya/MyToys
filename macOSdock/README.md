## 模仿macOS dock的动画效果

主要实现两个功能
1. 鼠标滑过图标有放大效果，且相邻图标要根据鼠标指针在当前图标的偏移量放大图标。
2. 点击图标又一个条约loading的效果

核心功能在第一个功能：
主要是利用css变量，通过js修改变量值来引发图标放大效果，当然transform属性也能实现。
还有就是计算偏移量的一个算法
```javascript     
  let item = e.target
  let itemRect = item.getBoundingClientRect()
  let offset = Math.abs(e.clientX - itemRect.left) / itemRect.width
```
这样offset随着鼠标指针在图标上的位置变化，越接近左边则趋向于0，越接近右边则趋向于1
关于相邻节点，左节点offset需要注意就是利用```Math.abs(offset - 1)```来计算最后的放大倍数