import { useRouter } from "next/router";
import CohortAccessGuard from "@/components/CohortAccessGuard";
import MemberCard from "@/components/MemberCard";
import { api } from "@/utils/trpc/api";

export default function Contact() {
  const router = useRouter();
  const { cohort_slug } = router.query;
  const cohortSlug = typeof cohort_slug === "string" ? cohort_slug : "";

  const {
    data: members,
    isLoading,
    isError,
  } = api.profiles.getContactsBySlug.useQuery(
    { cohort_slug: cohortSlug },
    { enabled: !!cohortSlug },
  );

  return (
    <CohortAccessGuard cohortSlug={cohortSlug}>
      <div className="app-muted-bg min-h-[calc(100vh-7rem)] px-6 py-10">
        <div className="mx-auto w-full max-w-[1162px] rounded-[2rem] border border-[rgba(40,132,164,0.08)] bg-[rgba(255,252,248,0.78)] px-6 py-8 shadow-[0_22px_60px_rgba(61,52,45,0.06)] md:px-8">
          <div className="mb-8 border-b border-[rgba(40,132,164,0.08)] pb-5">
            <h1 className="text-4xl font-bold text-zinc-900">Cohort Members</h1>
            <p className="mt-2 text-sm text-[#6c6d72]">
              Everyone currently participating in this cohort.
            </p>
          </div>

          {isLoading && (
            <p className="mt-8 text-zinc-600">Loading contacts...</p>
          )}

          {isError && (
            <p className="mt-8 text-red-600">
              Unable to load contacts for this cohort right now.
            </p>
          )}

          {!isLoading && !isError && (members?.length ?? 0) === 0 && (
            <p className="mt-8 text-zinc-600">
              No members found for this cohort.
            </p>
          )}

          {!!members?.length && (
            <div className="mt-8 flex flex-col gap-4">
              <div className="hidden grid-cols-[minmax(0,2fr)_2fr_2fr_2fr] gap-6 rounded-xl border border-[rgba(40,132,164,0.08)] bg-[rgba(255,251,247,0.96)] px-4 py-3 text-[20px] font-bold text-zinc-900 md:grid">
                <h2>Name</h2>
                <h2>Contact</h2>
                <h2>Organization</h2>
                <h2>Job Position</h2>
              </div>

              {members.map((member) => (
                <MemberCard
                  key={member.id}
                  fullName={member.full_name}
                  profilePictureUrl={member.avatar_url}
                  email={member.email}
                  jobRole={member.job_role}
                  organization={member.organization}
                  role={member.role}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </CohortAccessGuard>
  );
}
