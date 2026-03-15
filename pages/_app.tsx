import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Header from "@/components/header";
import { useRouter } from "next/router";
import { api } from "@/utils/trpc/api";
import SidebarModules from "@/components/sidebarModules";

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
      <SidebarModules />
      {shouldShowHeader ? <Header /> : null}
      <Component {...pageProps} />
    </>
  );
}

export default api.withTRPC(App);
