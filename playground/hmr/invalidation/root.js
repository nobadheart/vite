import './parent.js'
1
if (import.meta.hot) {
  console.log('import.meta.hot', import.meta.hot)
  // Need to accept, to register a callback for HMR
  import.meta.hot.accept(() => {
    console.log('accept1111111111111')
    // Triggers full page reload because no importers
    import.meta.hot.invalidate()
  })
}

const root = document.querySelector('.invalidation-root')
// Non HMR-able behaviour
if (!root.innerHTML) {
  root.innerHTML = 'Init'
}
