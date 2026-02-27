import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Header from "@/components/header";
import { useRouter } from "next/router";
import { api } from "@/utils/trpc/api";

function App({ Component, pageProps }: AppProps) {
  const router = useRouter();


  const routesWithoutHeader = new Set([
    "/login",
    "/signup",
    "/resetpassword",
    "/changepassword",
  ]);

  const shouldShowHeader = !routesWithoutHeader.has(router.pathname);

  return (
    <>
      {shouldShowHeader ? <Header /> : null}
      <Component {...pageProps} />
    </>
  );
}

export default api.withTRPC(App);