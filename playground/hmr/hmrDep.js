export const foo = 2222222222
export { foo as nestedFoo } from './hmrNestedDep'
if (import.meta.hot) {
  const data = import.meta.hot.data
  console.log('data', data)
  if ('fromDispose' in data) {
    console.log(`(dep) foo from dispose: ${data.fromDispose}`)
  }
  // import.meta.hot.accept((modules) => {
  //   debugger

  //   console.log('modules', modules)
  // })
  import.meta.hot.dispose((data) => {
    console.log(`(dep) foo was: ${foo}`)
    data.fromDispose = foo
  })
}
