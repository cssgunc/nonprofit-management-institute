import { FormEvent, useState } from "react";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import Link from "next/link";
import { api } from "@/utils/trpc/api";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
);

export default function SignUp() {
  const apiUtils = api.useUtils();
  const supabase = createSupabaseComponentClient();

  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [full_name, setFullName] = useState("");
  const [role, setRole] = useState<"admin" | "student">("student");
  const [organization, setOrganization] = useState("");

  // for handle new user
  const { mutate: handleNewUser } = api.profiles.handleNewUser.useMutation();

  const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setMessage("Account created successfully!");
    }

    // Now tRPC should have access to the auth cookie
    handleNewUser({ full_name, role, organization });
    apiUtils.invalidate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-black text-center mb-2">
          Create Account
        </h1>

        <form onSubmit={handleSignUp} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 
                       text-black placeholder-black caret-black
                       focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          />

          <input
            type="password"
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 
                       text-black placeholder-black caret-black
                       focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          />

          <input
            placeholder="Enter your full name"
            value={full_name}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 
                       text-black placeholder-black caret-black
                       focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          />

          <input
            placeholder="Enter your organization name"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 
                       text-black placeholder-black caret-black
                       focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold text-white transition ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-4 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg">
            {message}
          </div>
        )}

        <div className="mt-6 text-center text-sm">
          <Link href="/login" className="text-blue-600 hover:underline">
            Already have an account? Login
          </Link>
        </div>
      </div>
    </div>
  );
}
