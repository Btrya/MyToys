document.querySelectorAll(".dock li").forEach((li, index) => {
  li.addEventListener('mousemove', (e) => {
    let item = e.target
    let itemRect = item.getBoundingClientRect()
    let offset = Math.abs(e.clientX - itemRect.left) / itemRect.width
    let prev = item.previousElementSibling || null
    let next = item.nextElementSibling || null

    let scale = 0.6
    resetScale()
    if (prev) prev.style.setProperty("--scale", 1 + scale * Math.abs(offset - 1))
    item.style.setProperty("--scale", 1 + scale)
    if (next) next.style.setProperty("--scale", 1 + scale * offset)
  })
  li.addEventListener('mouseleave', (e) => {
    resetScale()
  })
  li.addEventListener('click', (e) => {
    e.currentTarget.classList.add('loading')
  })
})

function resetScale() {
  document.querySelectorAll(".dock li").forEach((li, index) => {
    li.style.setProperty("--scale", 1)
  })
}