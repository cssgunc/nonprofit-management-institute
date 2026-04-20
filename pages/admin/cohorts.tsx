import { useRouter } from "next/router";
import { api } from "@/utils/trpc/api";
import CohortRow from "@/components/CohortRow";

export default function AdminCohortsPage() {
  const router = useRouter();
  const { data: cohorts, isLoading, refetch } = api.cohorts.getAllCohorts.useQuery();

  const handleCreateCohort = () => {
    router.push("/admin/cohorts/new");
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-white px-4 py-12">
      <h1 className="mb-10 text-3xl font-semibold text-gray-900">
        Select a cohort
      </h1>

      <div className="w-full max-w-3xl rounded-lg border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="px-6 py-8 text-center text-sm text-gray-400">
            Loading cohorts...
          </div>
        ) : !cohorts || cohorts.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-400">
            No cohorts found.
          </div>
        ) : (
          cohorts.map((cohort) => (
            <CohortRow
              key={cohort.id}
              id={cohort.id}
              name={cohort.name}
              slug={cohort.slug}
              is_active={cohort.is_active}
              member_count={cohort.member_count}
              recent_logins={cohort.recent_logins}
              onDeleted={() => refetch()}
              onToggled={() => refetch()}
            />
          ))
        )}

        <div className="flex justify-center px-6 py-6">
          <button
            type="button"
            onClick={handleCreateCohort}
            className="w-80 rounded-full bg-gray-200 px-8 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-300"
          >
            Create New Cohort
          </button>
        </div>
      </div>
    </div>
  );
}
