import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'dotenv'
import { type DotenvPopulateInput, expand } from 'dotenv-expand'
import { arraify, createDebugger, normalizePath, tryStatSync } from './utils'
import type { UserConfig } from './config'

const debug = createDebugger('vite:env')

// 根据mode 获取环境变量文件列表
export function getEnvFilesForMode(
  mode: string,
  envDir: string | false,
): string[] {
  if (envDir !== false) {
    return [
      /** default file */ `.env`, // 默认的
      /** local file */ `.env.local`, // 本地的
      /** mode file */ `.env.${mode}`, // 根据mode的
      /** mode local file */ `.env.${mode}.local`, // 根据mode的本地
    ].map((file) => normalizePath(path.join(envDir, file)))
  }

  return []
}

// 加载环境变量 根据mode 路径 前缀
export function loadEnv(
  mode: string,
  envDir: string | false,
  prefixes: string | string[] = 'VITE_',
): Record<string, string> {
  const start = performance.now()
  const getTime = () => `${(performance.now() - start).toFixed(2)}ms`

  if (mode === 'local') {
    throw new Error(
      `"local" cannot be used as a mode name because it conflicts with ` +
        `the .local postfix for .env files.`,
    )
  }
  prefixes = arraify(prefixes)
  const env: Record<string, string> = {}
  const envFiles = getEnvFilesForMode(mode, envDir) // 获取环境变量文件列表

  debug?.(`loading env files: %O`, envFiles)
  // Object.entries  const obj = { foo: 'bar', baz: 42 }; Object.entries(obj); // [['foo', 'bar'], ['baz', 42]]
  // Object.fromEntries  const entries = [['name', 'Tom'], ['age', 18]]; Object.fromEntries(entries); // { name: 'Tom', age: 18 }
  const parsed = Object.fromEntries(
    envFiles.flatMap((filePath) => {
      if (!tryStatSync(filePath)?.isFile()) return []

      return Object.entries(parse(fs.readFileSync(filePath))) // [['name', 'Tom'], ['age', 18]]
    }),
  )
  debug?.(`env files loaded in ${getTime()}`)

  // test NODE_ENV override before expand as otherwise process.env.NODE_ENV would override this
  if (parsed.NODE_ENV && process.env.VITE_USER_NODE_ENV === undefined) {
    process.env.VITE_USER_NODE_ENV = parsed.NODE_ENV
  }
  // support BROWSER and BROWSER_ARGS env variables
  if (parsed.BROWSER && process.env.BROWSER === undefined) {
    process.env.BROWSER = parsed.BROWSER
  }
  if (parsed.BROWSER_ARGS && process.env.BROWSER_ARGS === undefined) {
    process.env.BROWSER_ARGS = parsed.BROWSER_ARGS
  }

  // let environment variables use each other. make a copy of `process.env` so that `dotenv-expand`
  // doesn't re-assign the expanded values to the global `process.env`.
  const processEnv = { ...process.env } as DotenvPopulateInput
  expand({ parsed, processEnv })

  // only keys that start with prefix are exposed to client
  for (const [key, value] of Object.entries(parsed)) {
    // 过滤前缀
    if (prefixes.some((prefix) => key.startsWith(prefix))) {
      env[key] = value
    }
  }

  // check if there are actual env variables starting with VITE_*
  // these are typically provided inline and should be prioritized // 通常
  for (const key in process.env) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) {
      env[key] = process.env[key] as string
    }
  }

  debug?.(`using resolved env: %O`, env)

  return env
}

// 解析环境变量前缀 转为一个数组
export function resolveEnvPrefix({
  envPrefix = 'VITE_',
}: UserConfig): string[] {
  envPrefix = arraify(envPrefix)
  if (envPrefix.includes('')) {
    throw new Error(
      `envPrefix option contains value '', which could lead unexpected exposure of sensitive information.`,
    )
  }
  return envPrefix
}
