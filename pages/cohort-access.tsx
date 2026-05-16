import { useState } from "react";
import { api } from "@/utils/trpc/api";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import AuthPageShell from "@/components/AuthPageShell";
import { ArrowLeft, HelpCircle, KeyRound, Loader2 } from "lucide-react";

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

export default function CohortAccessPage() {
  const [accessHash, setAccessHash] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const joinMutation = api.cohorts.joinCohort.useMutation({
    onSuccess: (cohort) => {
      router.push(`/cohorts/${cohort.slug}/dashboard`);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!agreedToTerms) {
      setError("Error: You must agree to the Terms and Conditions to proceed.");
      return;
    }

    const trimmed = accessHash.trim();
    if (!trimmed) {
      setError("Please enter an access code");
      return;
    }

    const { data } = await supabase.auth.getUser();
    const userId = data?.user?.id;
    if (!userId) {
      setError("User not authenticated");
      return;
    }

    try {
      await joinMutation.mutateAsync({
        accessHash: trimmed,
        userId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join cohort");
    }
  };

  return (
    <AuthPageShell
      title="Enter your cohort"
      subtitle="Use the access code you received to unlock your dashboard."
      accessory={
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-zinc-700">
            Cohort access code
            <span className="group relative inline-flex cursor-help text-[var(--brand-teal)]">
              <HelpCircle className="h-4 w-4" />
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded-lg bg-zinc-900 px-3 py-2 text-center text-xs font-medium leading-relaxed text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                Enter the cohort access code you received via email.
              </span>
            </span>
          </label>

          <input
            type="text"
            value={accessHash}
            onChange={(e) => setAccessHash(e.target.value)}
            required
            className="w-full rounded-xl border border-[rgba(40,132,164,0.18)] bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[var(--brand-teal)] focus:ring-2 focus:ring-[rgba(0,138,171,0.16)]"
          />
        </div>

        <div className="rounded-xl border border-[rgba(40,132,164,0.14)] bg-white/75 px-4 py-4">
          <label className="flex cursor-pointer items-start gap-3 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => {
                const checked = e.target.checked;
                setAgreedToTerms(checked);
                if (checked) {
                  setError("");
                }
              }}
              className="mt-0.5 h-4 w-4 rounded border-[rgba(40,132,164,0.3)] text-[var(--brand-teal)] focus:ring-[var(--brand-teal)]"
            />
            <span className="leading-relaxed">
              <span className="font-semibold text-zinc-800">
                I agree to the Terms and Conditions
              </span>{" "}
              <span className="text-zinc-500">
                [Lorem ipsum dolor sit amet]
              </span>
              <span className="ml-1 font-bold text-red-600">*</span>
            </span>
          </label>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={joinMutation.isPending}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--brand-teal)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(0,138,171,0.18)] transition hover:bg-[#007997] hover:shadow-[0_14px_28px_rgba(0,138,171,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {joinMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Entering...
            </>
          ) : (
            <>
              <KeyRound className="h-4 w-4" />
              Enter
            </>
          )}
        </button>
      </form>
    </AuthPageShell>
  );
}
