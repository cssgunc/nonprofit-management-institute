import { useRouter } from "next/router";
import CohortAccessGuard from "@/components/CohortAccessGuard";
import ModuleGrid from "@/components/ModuleGrid";
import { api } from "@/utils/trpc/api";
import { toast } from "sonner";

export default function DashboardPage() {
  const router = useRouter();
  const { cohort_slug } = router.query;
  const profileQuery = api.profiles.me.useQuery(undefined, {
    retry: false,
  });
  const isAdmin = profileQuery.isSuccess && profileQuery.data.role === "admin";
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
    <CohortAccessGuard cohortSlug={cohort_slug as string}>
      <div className="min-h-screen w-full bg-[#f5f5f5]">
        <div className="mx-auto max-w-7xl px-6 py-8 md:px-10">
          <ModuleGrid
            cohortSlug={cohort_slug as string}
            isAdmin={isAdmin}
            onToggleStatus={
              isAdmin
                ? (slug, isActive) =>
                    updateStatus.mutate({
                      slug,
                      cohortSlug: cohort_slug as string,
                      isActive,
                    })
                : undefined
            }
            isToggling={updateStatus.isPending}
          />
        </div>
      </div>
    </CohortAccessGuard>
  );
}
