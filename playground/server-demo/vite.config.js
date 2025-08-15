import { defineConfig } from 'vite'
let config = null
export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    // {
    //   name: 'vite-plugin-test',
    //   configResolved(resolvedConfig) {
    //     debugger
    //     console.log('resolvedConfig', resolvedConfig)
    //     config = resolvedConfig
    //   },
    // },
  ],
})
