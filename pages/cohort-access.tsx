import { useState } from "react";
import { api } from "@/utils/trpc/api";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Image from "next/image";

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
    <div className="app-muted-bg flex h-screen w-screen items-center justify-center overflow-hidden p-6 box-border lg:p-10">
      <div className="w-full h-full max-h-[850px] max-w-7xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 p-6 lg:p-10 flex flex-col items-center justify-between bg-white relative">
          <h2
            className="text-[#5B2983] text-2xl lg:text-4xl font-bold tracking-wide text-center pt-2 lg:pt-4"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            Nonprofit Management Institute Participant Dashboard
          </h2>

          <div className="flex-grow flex items-center justify-center w-full my-4">
            <Image
              src="/assets/NCCNonProfit_LOGO.png"
              alt="Center for Nonprofits Logo"
              width={320}
              height={150}
              priority
              className="w-[60%] lg:w-[70%] max-w-[280px] object-contain"
            />
          </div>

          <p className="text-xs lg:text-sm italic text-black text-center max-w-[250px] pb-2 lg:pb-4">
            “To educate, connect, and advocate for nonprofits across the state.”
          </p>
        </div>

        <div className="w-full md:w-1/2 p-6 lg:p-10 bg-[#BEE3EE] flex flex-col justify-center relative">
          <button
            onClick={() => router.back()}
            className="absolute top-6 left-6 lg:top-8 lg:left-8 flex items-center text-black font-medium text-sm hover:opacity-70 transition"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>

          <h1 className="text-xl lg:text-3xl font-bold text-black text-center mb-8 lg:mb-12">
            Cohort
          </h1>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 lg:space-y-5 w-full max-w-sm mx-auto"
          >
            <div>
              <label className="flex items-center text-black text-xs lg:text-sm mb-1">
                Cohort Access Code
                <span className="relative ml-1 text-[#3192B3] group cursor-help">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>

                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-[10px] lg:text-xs text-center rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none">
                    Enter the cohort access code you received via email
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                  </div>
                </span>
              </label>

              <input
                type="text"
                value={accessHash}
                onChange={(e) => setAccessHash(e.target.value)}
                required
                className="w-full px-3 py-1.5 lg:px-4 lg:py-2 text-xs lg:text-sm rounded-sm border border-[#74B1C6] bg-[#DBF0F6] text-black 
                           focus:ring-2 focus:ring-[#3192B3] focus:outline-none transition"
              />
            </div>

            <div className="rounded-lg border border-[#74B1C6] bg-white/60 px-3 py-3 lg:px-4 lg:py-4">
              <label className="flex items-start gap-3 text-xs lg:text-sm text-black cursor-pointer">
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
                  className="mt-0.5 h-4 w-4 rounded border-[#74B1C6] text-[#3192B3] focus:ring-[#3192B3]"
                />
                <span className="leading-snug">
                  <span className="font-medium text-black">
                    I agree to the Terms and Conditions
                  </span>{" "}
                  <span className="text-black/80">
                    [Lorem ipsum dolor sit amet]
                  </span>
                  <span className="ml-1 font-bold text-red-600">*</span>
                </span>
              </label>
            </div>

            <div className="flex justify-center pt-2 lg:pt-4">
              <button
                type="submit"
                disabled={joinMutation.isPending}
                className={`px-10 py-2 lg:px-12 lg:py-2.5 text-sm lg:text-base rounded-full font-medium text-white transition ${
                  joinMutation.isPending
                    ? "bg-[#28819D] cursor-not-allowed opacity-80"
                    : "bg-[#3192B3] hover:bg-[#257A95]"
                }`}
              >
                {joinMutation.isPending ? "Entering..." : "Enter"}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 lg:mt-5 p-3 lg:p-4 text-xs lg:text-sm text-red-700 bg-red-50 border border-red-300 rounded-lg max-w-sm mx-auto w-full font-medium shadow-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
