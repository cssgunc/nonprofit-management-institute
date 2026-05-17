import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Header from "@/components/header";
import AppFooter from "@/components/AppFooter";
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
    "/signout",
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
          ? `app-shell-bg flex min-h-screen flex-col app-muted-bg ${
              shouldHideTealPanel ? "app-shell-bg-no-teal" : ""
            }`
          : "flex min-h-screen flex-col"
      }
    >
      {shouldUseMutedBackground ? (
        <span aria-hidden="true" className="app-shell-panel" />
      ) : null}
      {shouldShowHeader ? <Header /> : null}
      <div className="flex-1">
        <Component {...pageProps} />
      </div>
      <AppFooter />
      <Toaster position="bottom-right" />
    </div>
  );
}

export default api.withTRPC(App);
