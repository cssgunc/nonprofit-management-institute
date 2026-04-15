import { FormEvent, useState } from "react";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import Link from "next/link";
import { api } from "@/utils/trpc/api";
import Image from "next/image";

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
  const [job_role, setJobRole] = useState("");
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
    handleNewUser({ full_name, role, organization, job_role, email });
    apiUtils.invalidate();
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#2884A4] via-[#7D328C] to-[#A27A4A] p-6 lg:p-10 box-border">
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
          <h1 className="text-xl lg:text-2xl font-bold text-black text-center mb-4 lg:mb-5">
            Sign Up
          </h1>

          <form
            onSubmit={handleSignUp}
            className="space-y-2 lg:space-y-3 w-full max-w-sm mx-auto"
          >
            <div>
              <label className="block text-black text-xs lg:text-sm mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={full_name}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-3 py-1.5 lg:px-4 lg:py-2 text-xs lg:text-sm rounded-sm border border-[#74B1C6] bg-[#DBF0F6] text-black 
                           focus:ring-2 focus:ring-[#3192B3] focus:outline-none transition"
              />
            </div>

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
            </div>

            <div>
              <label className="block text-black text-xs lg:text-sm mb-1">
                Job Title
              </label>
              <input
                type="text"
                value={job_role}
                onChange={(e) => setJobRole(e.target.value)}
                className="w-full px-3 py-1.5 lg:px-4 lg:py-2 text-xs lg:text-sm rounded-sm border border-[#74B1C6] bg-[#DBF0F6] text-black 
                           focus:ring-2 focus:ring-[#3192B3] focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-black text-xs lg:text-sm mb-1">
                Organization
              </label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full px-3 py-1.5 lg:px-4 lg:py-2 text-xs lg:text-sm rounded-sm border border-[#74B1C6] bg-[#DBF0F6] text-black 
                           focus:ring-2 focus:ring-[#3192B3] focus:outline-none transition"
              />
            </div>

            <div className="flex justify-center pt-2 lg:pt-3">
              <button
                type="submit"
                disabled={loading}
                className={`px-10 py-2 lg:px-12 lg:py-2.5 text-sm lg:text-base rounded-full font-medium text-white transition ${
                  loading
                    ? "bg-[#28819D] cursor-not-allowed opacity-80"
                    : "bg-[#3192B3] hover:bg-[#257A95]"
                }`}
              >
                {loading ? "Registering..." : "Register"}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-3 lg:mt-4 p-2 text-xs lg:text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg max-w-sm mx-auto w-full">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-3 lg:mt-4 p-2 text-xs lg:text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg max-w-sm mx-auto w-full">
              {message}
            </div>
          )}

          <div className="mt-4 lg:mt-5 text-center text-xs lg:text-sm">
            <Link href="/login" className="text-[#3192B3] hover:underline">
              Already have an account? Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
