import Link from "next/link";
import type { ReactNode } from "react";
import { api } from "@/utils/trpc/api";

type CohortAccessGuardProps = {
  cohortSlug: string;
  children: ReactNode;
};

export default function CohortAccessGuard({
  cohortSlug,
  children,
}: CohortAccessGuardProps) {
  const profileQuery = api.profiles.me.useQuery(undefined, {
    retry: false,
  });
  const membershipQuery = api.cohorts.hasCohortMembership.useQuery(
    {},
    {
      retry: false,
    },
  );

  if (!cohortSlug) {
    return (
      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center bg-[#f5f5f5] px-6">
        <div className="w-full max-w-xl rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-black">
            Loading cohort...
          </h1>
        </div>
      </div>
    );
  }

  if (membershipQuery.isLoading || profileQuery.isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center bg-[#f5f5f5] px-6">
        <div className="w-full max-w-xl rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-black">
            Checking access...
          </h1>
          <p className="mt-3 text-black">
            We&apos;re confirming your cohort membership.
          </p>
        </div>
      </div>
    );
  }

  if (membershipQuery.error || profileQuery.error) {
    return (
      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center bg-[#f5f5f5] px-6">
        <div className="w-full max-w-xl rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-black">
            We couldn&apos;t verify your cohort access
          </h1>
          <p className="mt-3 text-black">
            Please refresh the page or try again in a moment.
          </p>
        </div>
      </div>
    );
  }

  if (profileQuery.data?.role === "admin") {
    return <>{children}</>;
  }

  const membership = membershipQuery.data;
  const hasAccess = membership?.slug === cohortSlug;

  if (!hasAccess) {
    return (
      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center bg-[#f5f5f5] px-6">
        <div className="w-full max-w-xl rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-3xl font-semibold text-black">
            You don&apos;t have access to this cohort
          </h1>
          <p className="mt-3 text-black">
            This cohort isn&apos;t part of your current membership, so this page
            can&apos;t be opened.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            {membership?.slug ? (
              <Link
                href={`/cohorts/${membership.slug}/dashboard`}
                className="rounded-full bg-[#1098bd] px-6 py-3 text-lg font-medium text-white transition-colors hover:bg-[#0e87a8]"
              >
                Go to My Cohort
              </Link>
            ) : (
              <Link
                href="/cohort-access"
                className="rounded-full bg-[#1098bd] px-6 py-3 text-lg font-medium text-white transition-colors hover:bg-[#0e87a8]"
              >
                Enter a Cohort Code
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
