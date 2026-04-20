import { FormEvent, useState } from "react";
import { useRouter } from "next/router";
import { api } from "@/utils/trpc/api";
import { createBrowserClient } from "@supabase/ssr";
import Image from "next/image";
import Link from "next/link";

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

      // Wait for session to be set
      await new Promise((resolve) => setTimeout(resolve, 500));

      const profileResult = await profileQuery.refetch();
      if (profileResult.data?.role === "admin") {
        router.push("/admin/cohorts");
        setLoading(false);
        return;
      }

      const result = await checkMembership.refetch();
      const cohort = result.data;

      if (cohort) {
        router.push(`/cohorts/${cohort.slug}/dashboard`);
      } else {
        router.push("/cohort-access");
      }
    } catch {
      router.push("/cohort-access");
    }

    setLoading(false);
  };

  return (
    <div className="auth-brand-bg h-screen w-screen overflow-hidden flex items-center justify-center p-6 lg:p-10 box-border">
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

        <div className="w-full md:w-1/2 p-6 lg:p-10 bg-[#BEE3EE] flex flex-col justify-center">
          <h1 className="text-xl lg:text-2xl font-bold text-black text-center mb-6 lg:mb-10">
            Login
          </h1>

          <form
            onSubmit={handleLogin}
            className="space-y-4 lg:space-y-5 w-full max-w-sm mx-auto"
          >
            <div>
              <label className="block text-black text-xs lg:text-sm mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-1.5 lg:px-4 lg:py-2 text-xs lg:text-sm rounded-sm border border-[#74B1C6] bg-[#DBF0F6] text-black 
                           focus:ring-2 focus:ring-[#3192B3] focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-black text-xs lg:text-sm mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-1.5 lg:px-4 lg:py-2 text-xs lg:text-sm rounded-sm border border-[#74B1C6] bg-[#DBF0F6] text-black 
                           focus:ring-2 focus:ring-[#3192B3] focus:outline-none transition"
              />
              <div className="text-right mt-1 lg:mt-1.5">
                <Link
                  href="/resetpassword"
                  className="text-[10px] lg:text-xs text-gray-500 hover:text-gray-700 transition"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            <div className="flex justify-center pt-4 lg:pt-6">
              <button
                type="submit"
                disabled={loading}
                className={`px-10 py-2 lg:px-12 lg:py-2.5 text-sm lg:text-base rounded-full font-medium text-white transition ${
                  loading
                    ? "bg-[#28819D] cursor-not-allowed opacity-80"
                    : "bg-[#3192B3] hover:bg-[#257A95]"
                }`}
              >
                {loading ? "Signing in..." : "Login"}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 lg:mt-5 p-2 lg:p-3 text-xs lg:text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg max-w-sm mx-auto w-full">
              {error}
            </div>
          )}

          <div className="mt-8 lg:mt-12 text-center text-xs lg:text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[#3192B3] hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
