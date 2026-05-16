import { FormEvent, useState } from "react";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import Link from "next/link";
import { api } from "@/utils/trpc/api";
import AuthPageShell from "@/components/AuthPageShell";
import { Loader2, UserPlus } from "lucide-react";

export default function SignUp() {
  const apiUtils = api.useUtils();
  const supabase = createSupabaseComponentClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [full_name, setFullName] = useState("");
  const [job_role, setJobRole] = useState("");
  const [organization, setOrganization] = useState("");
  const role = "student" as const;

  // for handle new user
  const { mutate: handleNewUser } = api.profiles.handleNewUser.useMutation();

  const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const emailRedirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/login`
        : `${process.env.NEXT_PUBLIC_SITE_URL}/login`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    } else {
      setMessage(
        "Please check your inbox and follow the confirmation link to complete your account setup.",
      );
      setLoading(false);
    }

    // Now tRPC should have access to the auth cookie
    handleNewUser({ full_name, role, organization, job_role, email });
    apiUtils.invalidate();
  };

  return (
    <AuthPageShell title="Create your account">
      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-zinc-700">
            Full name
          </label>
          <input
            type="text"
            value={full_name}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full rounded-xl border border-[rgba(40,132,164,0.18)] bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[var(--brand-teal)] focus:ring-2 focus:ring-[rgba(0,138,171,0.16)]"
          />
        </div>

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
          <label className="mb-1.5 block text-sm font-semibold text-zinc-700">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-[rgba(40,132,164,0.18)] bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[var(--brand-teal)] focus:ring-2 focus:ring-[rgba(0,138,171,0.16)]"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-zinc-700">
              Job title
            </label>
            <input
              type="text"
              value={job_role}
              onChange={(e) => setJobRole(e.target.value)}
              className="w-full rounded-xl border border-[rgba(40,132,164,0.18)] bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[var(--brand-teal)] focus:ring-2 focus:ring-[rgba(0,138,171,0.16)]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-zinc-700">
              Organization
            </label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="w-full rounded-xl border border-[rgba(40,132,164,0.18)] bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[var(--brand-teal)] focus:ring-2 focus:ring-[rgba(0,138,171,0.16)]"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
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
              Registering...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Register
            </>
          )}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-zinc-600">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-[var(--brand-teal)] transition hover:text-[#007997]"
        >
          Login
        </Link>
      </p>
    </AuthPageShell>
  );
}
