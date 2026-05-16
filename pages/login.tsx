import { FormEvent, useState } from "react";
import { useRouter } from "next/router";
import { api } from "@/utils/trpc/api";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import AuthPageShell from "@/components/AuthPageShell";
import { Loader2, LogIn } from "lucide-react";

type CookieOptions = { maxAge?: number };

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  {
    cookies: {
      get(name: string) {
        if (typeof window === "undefined") return "";
        return (
          document.cookie
            .split("; ")
            .find((row) => row.startsWith(name + "="))
            ?.split("=")[1] || ""
        );
      },
      set(name: string, value: string, options: CookieOptions) {
        if (typeof window === "undefined") return;
        const secure = window.location.protocol === "https:" ? "; secure" : "";
        document.cookie = `${name}=${value}; path=/; max-age=${options.maxAge || 31536000}; samesite=lax${secure}`;
      },
      remove(name: string) {
        if (typeof window === "undefined") return;
        document.cookie = `${name}=; path=/; max-age=0`;
      },
    },
  },
);

export default function Login() {
  const router = useRouter();
  const apiUtils = api.useUtils();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const checkMembership = api.cohorts.hasCohortMembership.useQuery(
    {},
    { enabled: false },
  );
  const profileQuery = api.profiles.me.useQuery(undefined, {
    enabled: false,
    retry: false,
  });

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError("Login failed");
        setLoading(false);
        return;
      }

      await supabase.auth.getSession();
      await apiUtils.profiles.me.invalidate();
      await apiUtils.cohorts.hasCohortMembership.invalidate();

      const profileResult = await profileQuery.refetch();

      if (profileResult.error || !profileResult.data) {
        setError(
          "We could not find a dashboard profile for this account. Please contact an administrator.",
        );
        setLoading(false);
        return;
      }

      if (profileResult.data?.role === "admin") {
        router.push("/admin/cohorts");
        setLoading(false);
        return;
      }

      const result = await checkMembership.refetch();
      if (result.error) {
        setError("We could not verify your cohort access. Please try again.");
        setLoading(false);
        return;
      }

      const cohort = result.data;

      if (cohort) {
        router.push(`/cohorts/${cohort.slug}/dashboard`);
      } else {
        router.push("/cohort-access");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to finish login. Please try again.",
      );
    }

    setLoading(false);
  };

  return (
    <AuthPageShell title="Welcome back">
      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-zinc-700">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-[rgba(40,132,164,0.18)] bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[var(--brand-teal)] focus:ring-2 focus:ring-[rgba(0,138,171,0.16)]"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label className="block text-sm font-semibold text-zinc-700">
              Password
            </label>
            <Link
              href="/resetpassword"
              className="text-xs font-semibold text-[var(--brand-teal)] transition hover:text-[#007997]"
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-[rgba(40,132,164,0.18)] bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[var(--brand-teal)] focus:ring-2 focus:ring-[rgba(0,138,171,0.16)]"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--brand-teal)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(0,138,171,0.18)] transition hover:bg-[#007997] hover:shadow-[0_14px_28px_rgba(0,138,171,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              Login
            </>
          )}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-zinc-600">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-semibold text-[var(--brand-teal)] transition hover:text-[#007997]"
        >
          Sign up
        </Link>
      </p>
    </AuthPageShell>
  );
}
