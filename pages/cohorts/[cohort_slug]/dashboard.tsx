import Link from "next/link";
import { useRouter } from "next/router";
import CohortAccessGuard from "@/components/CohortAccessGuard";
import ModuleGrid from "@/components/ModuleGrid";
import { api } from "@/utils/trpc/api";
import { toast } from "sonner";

export default function DashboardPage() {
  const router = useRouter();
  const { cohort_slug } = router.query;
  const cohortSlug = typeof cohort_slug === "string" ? cohort_slug : "";
  const profileQuery = api.profiles.me.useQuery(undefined, {
    retry: false,
  });
  const isAdmin = profileQuery.isSuccess && profileQuery.data.role === "admin";
  const firstName =
    profileQuery.data?.full_name?.trim().split(/\s+/)[0] ?? "there";
  const cohortBasePath = cohortSlug ? `/cohorts/${cohortSlug}` : "";
  const utils = api.useUtils();

  const updateStatus = api.modules.updateModuleStatus.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Module "${data.slug}" is now ${data.is_active ? "active" : "inactive"}`,
      );
      utils.modules.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update module status");
    },
  });

  return (
    <CohortAccessGuard cohortSlug={cohortSlug}>
      <div className="app-muted-bg relative min-h-[calc(100vh-7rem)] w-full overflow-hidden">
        <div className="motion-fade relative mx-auto max-w-[1500px] px-3 py-5 md:px-5 lg:px-7 lg:py-7">
          <section className="motion-rise relative overflow-hidden rounded-[1.5rem] border border-[rgba(40,132,164,0.1)] bg-[rgba(255,253,248,0.84)] shadow-[0_24px_70px_rgba(61,52,45,0.1)]">
            <div className="absolute inset-x-0 top-0 flex h-1">
              <span className="flex-1 bg-[var(--brand-plum)]" />
              <span className="flex-1 bg-[var(--brand-lime)]" />
              <span className="flex-1 bg-[var(--brand-teal)]" />
            </div>
            <div className="grid gap-7 px-5 py-6 md:px-7 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:px-8 lg:py-8">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--brand-plum)]">
                  Welcome back, {firstName}
                </p>
                <h1 className="mt-3 text-[2.25rem] font-semibold tracking-tight text-[#1f2b34] md:text-[2.75rem]">
                  Participant Dashboard
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-[#62636a]">
                  Review active course modules, upcoming learning materials, and
                  discussions for this cohort.
                </p>
              </div>
              <div className="rounded-[1.15rem] border border-[rgba(94,13,139,0.08)] bg-white/58 px-5 py-5 shadow-[0_12px_30px_rgba(61,52,45,0.06)]">
                <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em]">
                  <span className="text-[var(--brand-plum)]">Many missions</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-lime)]" />
                  <span className="text-[var(--brand-teal)]">100 counties</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-lime)]" />
                  <span className="text-[var(--brand-plum)]">One voice</span>
                </div>
                <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <Link
                    href={
                      cohortBasePath ? `${cohortBasePath}/discussion` : "#"
                    }
                    className="inline-flex items-center justify-center rounded-full bg-[var(--brand-plum)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4f0b75]"
                  >
                    Open Discussions
                  </Link>
                  <Link
                    href={cohortBasePath ? `${cohortBasePath}/contact` : "#"}
                    className="inline-flex items-center justify-center rounded-full border border-[rgba(0,138,171,0.26)] bg-white/65 px-4 py-2.5 text-sm font-semibold text-[var(--brand-teal)] transition hover:bg-white"
                  >
                    View Cohort
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="motion-rise motion-delay-1 mt-5 rounded-[1.5rem] border border-[rgba(40,132,164,0.08)] bg-[rgba(255,253,248,0.72)] px-3 py-4 shadow-[0_18px_48px_rgba(61,52,45,0.07)] md:px-4 md:py-5">
            <div className="flex flex-col gap-2 px-2 pb-3 md:flex-row md:items-end md:justify-between md:px-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-teal)]">
                  Curriculum
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#24262b]">
                  Course Modules
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-[#686970]">
                Move through the modules at your cohort&apos;s pace, then use
                discussions and materials to keep the work going.
              </p>
            </div>
            <div>
              <ModuleGrid
                cohortSlug={cohortSlug}
                className="pt-2 lg:grid-cols-3"
                isAdmin={isAdmin}
                onToggleStatus={
                  isAdmin
                    ? (slug, isActive) =>
                        updateStatus.mutate({
                          slug,
                          cohortSlug,
                          isActive,
                        })
                    : undefined
                }
                isToggling={updateStatus.isPending}
              />
            </div>
          </section>
        </div>
      </div>
    </CohortAccessGuard>
  );
}
