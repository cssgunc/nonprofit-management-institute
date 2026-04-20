import { createClient } from "@supabase/supabase-js";
import { useState } from "react";
import { useRouter } from "next/router";

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        <h1 className="text-3xl text-black font-bold mb-4">Sign Out</h1>

        <button
          onClick={handleLogout}
          disabled={loading}
          className={`w-full py-3 rounded-lg font-semibold text-white transition ${
            loading
              ? "bg-red-400 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {loading ? "Signing out..." : "Sign Out"}
        </button>

        <button
          onClick={handleCancel}
          className="mt-4 w-full py-3 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
