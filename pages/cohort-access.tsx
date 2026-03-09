import { useState } from "react";
import { api } from "@/utils/trpc/api";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
);

export default function CohortAccessPage() {
  const [accessHash, setAccessHash] = useState("");
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

    const trimmed = accessHash.trim();

    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;

    if (!userId) {
      setError("User not authenticated");
      return;
    }

    joinMutation.mutate({
      accessHash: trimmed,
      userId,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-black text-center mb-2">
          Join Cohort
        </h1>

        <p className="text-center text-gray-500 mb-6">
          Enter your cohort access code to continue
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-black">
          <input
            type="text"
            placeholder="Cohort access code"
            value={accessHash}
            onChange={(e) => setAccessHash(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          />

          <button
            type="submit"
            disabled={joinMutation.isPending}
            className={`w-full py-3 rounded-lg font-semibold text-white transition ${
              joinMutation.isPending
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {joinMutation.isPending ? "Joining..." : "Join Cohort"}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}