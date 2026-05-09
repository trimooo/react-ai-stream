import type { AppProps } from 'next/app'
import Script from 'next/script'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Script defer data-domain="react-ai-stream-docs.vercel.app" src="https://plausible.io/js/script.js" />
      <Component {...pageProps} />
    </>
  )
}
