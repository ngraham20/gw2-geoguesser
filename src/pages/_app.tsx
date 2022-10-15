import '~/styles/main.css'
import Head from 'next/head'
import { AppProps } from 'next/app'
import { DefaultSeo } from 'next-seo'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import useFathom from '~/components/hooks/useFathom'
import SEO from '~/../next-seo.config'
import Header from '~/components/primitives/Header'

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, refetchInterval: false } },
})

function App({ Component, pageProps: { session, ...pageProps } }: AppProps & { pageProps: { session: any } }) {
  const fathom = useFathom()
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <DefaultSeo {...SEO} />
      <SessionProvider session={session}>
        <div className="flex flex-col h-full bg-fixed">
          <QueryClientProvider client={queryClient}>
            <Header />
            <Component {...pageProps} fathom={fathom} />
          </QueryClientProvider>
        </div>
      </SessionProvider>
    </>
  )
}

export default App
