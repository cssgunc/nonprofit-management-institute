import { createClient } from "@supabase/supabase-js";
import { useState } from "react";
import { useRouter } from "next/router";
import { ArrowLeft, Loader2, LogOut } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
);

export default function SignOut() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCancel = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    const cohortSlug =
      typeof router.query.cohort_slug === "string"
        ? router.query.cohort_slug
        : "";

    router.push(cohortSlug ? `/cohorts/${cohortSlug}/dashboard` : "/");
  };

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="auth-brand-bg flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
      <section className="motion-rise relative w-full max-w-md overflow-hidden rounded-[1.5rem] border border-[rgba(40,132,164,0.1)] bg-[rgba(255,253,248,0.88)] px-6 py-8 text-center shadow-[0_18px_48px_rgba(61,52,45,0.08)] backdrop-blur-md sm:px-8">
        <div className="absolute inset-x-0 top-0 flex h-1">
          <span className="flex-1 bg-[var(--brand-lime)]" />
          <span className="flex-1 bg-[var(--brand-plum)]" />
          <span className="flex-1 bg-[var(--brand-teal)]" />
        </div>

        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(94,13,139,0.08)] text-[var(--brand-plum)]">
          <LogOut className="h-5 w-5" />
        </div>

        <h1 className="text-2xl font-bold text-zinc-950">Sign out?</h1>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loading}
          className="mt-7 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--brand-plum)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(94,13,139,0.16)] transition hover:bg-[#4f0a76] hover:shadow-[0_14px_28px_rgba(94,13,139,0.22)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing out...
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4" />
              Sign out
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleCancel}
          className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[rgba(40,132,164,0.18)] bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:border-[rgba(40,132,164,0.28)] hover:bg-[rgba(0,138,171,0.05)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Stay signed in
        </button>
      </section>
    </div>
  );
}
