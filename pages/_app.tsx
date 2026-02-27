import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { api } from "@/utils/trpc/api";
import Header from "@/components/header";

function App({ Component, pageProps }: AppProps) {
  return (
    <>
    <Header />
    <Component {...pageProps} />
    </>
  );
}

export default api.withTRPC(App);
