import {
  server$,
  secret$,
  import$,
  preload$,
  getPreloaded,
} from '@tanstack/bling'
import fs from 'fs'
import { createSignal, lazy, Suspense, useContext } from 'solid-js'
import { HydrationScript, NoHydration } from 'solid-js/web'
import { manifestContext } from './manifest'

import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const fileUrl = secret$(
  join(dirname(fileURLToPath(import.meta.url)), 'index.txt'),
)
const write = server$((content: string) => fs.writeFileSync(fileUrl, content))
const read = server$(() => fs.readFileSync(fileUrl).toString())
const preloadedContent = preload$(() => fs.readFileSync(fileUrl).toString())

const Example = () => {
  const [content, setContent] = createSignal(preloadedContent)
  const [serverContent, setServerContent] = createSignal('')

  return (
    <>
      <input
        value={content()}
        onInput={(e) => setContent((e.target as any).value)}
      ></input>
      <br />
      <button onClick={async () => await write(content())}>
        Write that on the server file 'index.txt'
      </button>
      <br />
      <button onClick={async () => setServerContent((await read()).toString())}>
        Read from the file on the server
      </button>
      <p>{serverContent()}</p>
    </>
  )
}

const preloaded = getPreloaded()

export function App() {
  return (
    <html>
      <head>
        <title>Hello World</title>
        <PreloadedData />
      </head>
      <body>
        <Example />
        <Scripts />
      </body>
    </html>
  )
}

function PreloadedData() {
  return (
    <NoHydration>
      <script type="application/json" id="preloaded" $ServerOnly>
        {preloaded}
      </script>
    </NoHydration>
  )
}

function Scripts() {
  const manifest = useContext(manifestContext)
  return (
    <NoHydration>
      <HydrationScript />
      {import.meta.env.DEV ? (
        <>
          <script type="module" src="/@vite/client" $ServerOnly></script>
          <script
            type="module"
            src="/src/app/entry-client.tsx"
            $ServerOnly
          ></script>
        </>
      ) : (
        <>
          <script
            type="module"
            src={manifest['entry-client']}
            $ServerOnly
          ></script>
        </>
      )}
    </NoHydration>
  )
}
