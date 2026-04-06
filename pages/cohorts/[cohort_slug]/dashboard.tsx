import { useRouter } from "next/router";
import ModuleGrid from "@/components/ModuleGrid";
import { api } from "@/utils/trpc/api";
import { toast } from "sonner";

export default function DashboardPage() {
  const router = useRouter();
  const { cohort_slug } = router.query;

  const profileQuery = api.profiles.me.useQuery(undefined, {
    retry: false,
  });
  const isAdmin = profileQuery.data?.role === "admin";

  const utils = api.useUtils();

  const updateStatus = api.modules.updateModuleStatus.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Module "${data.slug}" is now ${data.isActive ? "active" : "inactive"}`,
      );
      utils.modules.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update module status");
    },
  });

  return (
    <div className="h-full w-full bg-blue">
      {/* Header placeholder. Import /components/Header module here. */}
      <div className="h-25 w-full bg-white" />
      <ModuleGrid
        cohortSlug={cohort_slug as string}
        isAdmin={isAdmin}
        onToggleStatus={(slug, isActive) =>
          updateStatus.mutate({ slug, isActive })
        }
        isToggling={updateStatus.isPending}
      />
    </div>
  );
}
