import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Header from "@/components/header";
import { useRouter } from "next/router";
import { api } from "@/utils/trpc/api";
import { Toaster } from "sonner";

function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  const routesWithoutHeader = new Set([
    "/login",
    "/signup",
    "/resetpassword",
    "/changepassword",
    "/cohort-access",
  ]);

  const shouldShowHeader = !routesWithoutHeader.has(router.pathname);
  const routesWithoutMutedBackground = new Set([
    "/login",
    "/signup",
    "/resetpassword",
    "/changepassword",
    "/cohort-access",
    "/signout",
  ]);
  const shouldUseMutedBackground = !routesWithoutMutedBackground.has(
    router.pathname,
  );
  const shouldHideTealPanel =
    router.pathname === "/cohorts/[cohort_slug]/profile";

  return (
    <div
      className={
        shouldUseMutedBackground
          ? `app-shell-bg min-h-screen app-muted-bg ${
              shouldHideTealPanel ? "app-shell-bg-no-teal" : ""
            }`
          : ""
      }
    >
      {shouldUseMutedBackground ? (
        <span aria-hidden="true" className="app-shell-panel" />
      ) : null}
      {shouldShowHeader ? <Header /> : null}
      <Component {...pageProps} />
      <Toaster position="bottom-right" />
    </div>
  );
}

export default api.withTRPC(App);
