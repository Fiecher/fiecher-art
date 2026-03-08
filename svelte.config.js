import process from 'node:process'
import adapter from '@sveltejs/adapter-static'
import { mdsvex } from 'mdsvex'

const dev = process.argv.includes('dev')

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      fallback: '404.html',
    }),
    paths: {
      base: dev ? '' : '/fiecher-art',
    },
    prerender: {
      handleUnseenRoutes: 'ignore',
      entries: ['*', '/reel', '/works', '/info'],
    },
  },
  preprocess: [mdsvex()],
  extensions: ['.svelte', '.svx'],
}

export default config
