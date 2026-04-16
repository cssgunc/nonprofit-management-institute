import SidebarModules from "@/components/sidebarModules";
import type { SidebarNavItem } from "@/components/sidebarModules";
import SidebarDiscussions from "@/components/sidebarDiscussions";
import type { DiscussionNavItem } from "@/components/sidebarDiscussions";
import DiscussionPost, {
  type Post as DiscussionUiPost,
} from "@/components/DiscussionPost";
import CohortAccessGuard from "@/components/CohortAccessGuard";
import { getDiscussionSidebarContext } from "@/utils/sidebarContext";
import { api, type RouterOutputs } from "@/utils/trpc/api";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { useRouter } from "next/router";
import { useEffect, useLayoutEffect, useState } from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type ThreadNode = RouterOutputs["discussions"]["getThread"];
type ThreadListItem =
  RouterOutputs["discussions"]["listThreadsByModuleSlug"][number];
type DiscussionRenderablePost = DiscussionUiPost & {
  canManage: boolean;
  replies: DiscussionRenderablePost[];
};

function countReplies(node: ThreadNode): number {
  return node.children.reduce(
    (total, child) => total + 1 + countReplies(child),
    0,
  );
}

function getAuthorProfile(
  authorId: string | null,
  fullName: string | null,
  avatarPath: string | null,
  resolveAvatarUrl: (avatarPath: string | null) => string | null,
  currentUserId?: string,
) {
  const avatarUrl = resolveAvatarUrl(avatarPath);

  if (!authorId) {
    return {
      name: "Unknown member",
      avatarUrl,
      badge: undefined,
      colorIndex: 0,
    };
  }

  return {
    name: fullName?.trim() || `Member ${authorId.slice(0, 6)}`,
    avatarUrl,
    badge: authorId === currentUserId ? "You" : undefined,
    colorIndex:
      authorId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % 6,
  };
}

function mapThreadNodeToDiscussionPost(
  node: ThreadNode,
  resolveAvatarUrl: (avatarPath: string | null) => string | null,
  currentUserId?: string,
  isAdmin = false,
): DiscussionRenderablePost {
  const author = getAuthorProfile(
    node.author_id,
    node.author_full_name,
    node.author_avatar_url,
    resolveAvatarUrl,
    currentUserId,
  );

  return {
    id: node.id,
    author,
    content: node.body ?? "",
    createdAt: node.created_at ?? new Date(0),
    isDeleted: node.is_deleted,
    canManage: isAdmin || node.author_id === currentUserId,
    replies: node.children.map((child) =>
      mapThreadNodeToDiscussionPost(
        child,
        resolveAvatarUrl,
        currentUserId,
        isAdmin,
      ),
    ),
  };
}

function ThreadPreview({
  thread,
  postId,
  currentUserId,
  isAdmin,
  expanded,
  onToggleReplies,
  resolveAvatarUrl,
  onEdit,
  onDelete,
}: {
  thread: ThreadListItem;
  postId: number;
  currentUserId?: string;
  isAdmin: boolean;
  expanded: boolean;
  onToggleReplies: () => void;
  resolveAvatarUrl: (avatarPath: string | null) => string | null;
  onEdit: (id: string | number, newContent: string) => void;
  onDelete: (id: string | number) => void;
}) {
  const threadQuery = api.discussions.getThread.useQuery(
    { postId },
    { retry: false },
  );

  const topLevelPost: DiscussionUiPost = {
    id: thread.id,
    author: getAuthorProfile(
      thread.author_id,
      thread.author_full_name,
      thread.author_avatar_url,
      resolveAvatarUrl,
      currentUserId,
    ),
    content: thread.body ?? "",
    createdAt: thread.created_at ?? new Date(0),
    isDeleted: thread.is_deleted,
    replyCount: threadQuery.data ? countReplies(threadQuery.data) : 0,
    replies: [],
  };

  if (!expanded) {
    return (
      <DiscussionPost
        post={topLevelPost}
        canManage={isAdmin || thread.author_id === currentUserId}
        onReply={onToggleReplies}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
  }

  if (threadQuery.isLoading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-500">
        Loading replies...
      </div>
    );
  }

  if (threadQuery.error || !threadQuery.data) {
    return (
      <div className="rounded-xl border border-red-200 bg-white p-5 text-sm text-red-600">
        Unable to load replies for this thread right now.
      </div>
    );
  }

  const mappedThread = mapThreadNodeToDiscussionPost(
    threadQuery.data,
    resolveAvatarUrl,
    currentUserId,
    isAdmin,
  );

  const renderReply = (reply: DiscussionRenderablePost) => (
    <DiscussionPost
      key={`reply-${reply.id}`}
      post={reply}
      isReply
      canManage={reply.canManage}
      onEdit={onEdit}
      onDelete={onDelete}
    >
      {reply.replies.map(renderReply)}
    </DiscussionPost>
  );

  return (
    <DiscussionPost
      post={{
        ...mappedThread,
        replyCount: countReplies(threadQuery.data),
        replies: [],
      }}
      canManage={mappedThread.canManage}
      onReply={onToggleReplies}
      onEdit={onEdit}
      onDelete={onDelete}
    >
      <div className="mt-3 border-t border-zinc-100 pt-3">
        {mappedThread.replies.length === 0 ? (
          <p className="text-sm text-zinc-500">No replies yet.</p>
        ) : (
          mappedThread.replies.map(renderReply)
        )}
      </div>
    </DiscussionPost>
  );
}

export default function ModuleDiscussions() {
  const router = useRouter();
  const supabase = createSupabaseComponentClient();
  const apiUtils = api.useUtils();
  const [mounted, setMounted] = useState(false);
  const [sidebarContext, setSidebarContext] = useState<
    "modules" | "discussions"
  >("modules");
  const [expandedThreadId, setExpandedThreadId] = useState<number | null>(null);

  const cohortSlug =
    typeof router.query.cohort_slug === "string"
      ? router.query.cohort_slug
      : "";

  const moduleSlug =
    typeof router.query.modules_slug === "string"
      ? router.query.modules_slug
      : "";

  useIsomorphicLayoutEffect(() => {
    const storedContext = getDiscussionSidebarContext();

    if (storedContext) {
      setSidebarContext(storedContext);
    }

    setMounted(true);
  }, []);

  const baseModulePath =
    cohortSlug && moduleSlug
      ? `/cohorts/${cohortSlug}/${moduleSlug}`
      : "/cohorts";

  const baseCohortPath = cohortSlug ? `/cohorts/${cohortSlug}` : "/cohorts";
  const modulesQuery = api.modules.list.useQuery(
    { cohortSlug },
    { enabled: !!cohortSlug },
  );
  const moduleQuery = api.modules.bySlug.useQuery(
    { slug: moduleSlug, cohortSlug },
    { enabled: !!cohortSlug && !!moduleSlug },
  );
  const profileQuery = api.profiles.me.useQuery(undefined, {
    retry: false,
  });
  const threadsQuery = api.discussions.listThreadsByModuleSlug.useQuery(
    { moduleSlug },
    { enabled: !!moduleSlug, retry: false },
  );
  const updatePostMutation = api.discussions.updatePost.useMutation({
    onSuccess: async () => {
      await apiUtils.discussions.listThreadsByModuleSlug.invalidate({
        moduleSlug,
      });
      if (expandedThreadId !== null) {
        await apiUtils.discussions.getThread.invalidate({
          postId: expandedThreadId,
        });
      }
    },
  });
  const deletePostMutation = api.discussions.deletePost.useMutation({
    onSuccess: async () => {
      await apiUtils.discussions.listThreadsByModuleSlug.invalidate({
        moduleSlug,
      });
      if (expandedThreadId !== null) {
        await apiUtils.discussions.getThread.invalidate({
          postId: expandedThreadId,
        });
      }
    },
  });

  const sidebarItems: SidebarNavItem[] = [
    {
      id: 0,
      title: "Recording",
      href: `${baseModulePath}/module`,
    },
    {
      id: 1,
      title: "Discussions",
      href: `${baseModulePath}/discussions`,
    },
    {
      id: 2,
      title: "Materials",
      href: `${baseModulePath}/materials`,
    },
  ];

  const discussionItems: DiscussionNavItem[] = [
    { id: 0, title: "General", href: `${baseCohortPath}/discussion` },
    ...((modulesQuery.data ?? []).map((module) => ({
      id: module.id,
      title: module.title,
      href: `${baseCohortPath}/${module.slug}/discussions`,
      moduleSlug: module.slug,
    })) satisfies DiscussionNavItem[]),
  ];

  const activeDiscussionId =
    discussionItems.find((item) => item.moduleSlug === moduleSlug)?.id ?? 0;

  const currentUserId = profileQuery.data?.id;
  const isAdmin = profileQuery.data?.role === "admin";
  const threads = threadsQuery.data ?? [];
  const resolveAvatarUrl = (avatarPath: string | null) =>
    avatarPath
      ? supabase.storage.from("avatars").getPublicUrl(avatarPath).data.publicUrl
      : null;
  const handleEdit = (id: string | number, newContent: string) => {
    if (typeof id !== "number") return;
    updatePostMutation.mutate({ post_id: id, body: newContent });
  };
  const handleDelete = (id: string | number) => {
    if (typeof id !== "number") return;
    deletePostMutation.mutate({ post_id: id });
  };

  return (
    <CohortAccessGuard cohortSlug={cohortSlug}>
      <div className="flex min-h-[calc(100vh-7rem)] w-full">
        {mounted &&
          (sidebarContext === "discussions" ? (
            <SidebarDiscussions
              items={discussionItems}
              activeId={activeDiscussionId}
            />
          ) : (
            <SidebarModules items={sidebarItems} activeId={1} />
          ))}
        <div className="flex min-h-[calc(100vh-7rem)] flex-1 flex-col bg-zinc-50">
          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-black">
                {moduleQuery.data?.title ?? "Module Discussion"}
              </h1>
              <p className="text-sm text-zinc-600">
                Review the current discussion layout with live thread data from
                the discussions router.
              </p>
            </div>

            {threadsQuery.isLoading ? (
              <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500">
                Loading discussions...
              </div>
            ) : threadsQuery.error ? (
              <div className="rounded-xl border border-red-200 bg-white p-6 text-sm text-red-600">
                Failed to load discussions for this module.
              </div>
            ) : threads.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-500">
                No discussion threads have been posted for this module yet.
              </div>
            ) : (
              <div className="space-y-5">
                {threads.map((thread: ThreadListItem) => (
                  <ThreadPreview
                    key={thread.id}
                    thread={thread}
                    postId={thread.id}
                    currentUserId={currentUserId}
                    isAdmin={isAdmin}
                    expanded={expandedThreadId === thread.id}
                    resolveAvatarUrl={resolveAvatarUrl}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleReplies={() =>
                      setExpandedThreadId((current) =>
                        current === thread.id ? null : thread.id,
                      )
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </CohortAccessGuard>
  );
}
