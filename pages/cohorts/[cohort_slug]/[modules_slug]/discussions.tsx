import SidebarModules from "@/components/sidebarModules";
import type { SidebarNavItem } from "@/components/sidebarModules";
import SidebarDiscussions from "@/components/sidebarDiscussions";
import type { DiscussionNavItem } from "@/components/sidebarDiscussions";
import DiscussionPost, {
  type Post as DiscussionUiPost,
} from "@/components/DiscussionPost";
import CohortAccessGuard from "@/components/CohortAccessGuard";
import {
  applyLikeOverride,
  applyLikeOverrideToPost,
  useDiscussionLikeQueue,
} from "@/utils/discussionLikes";
import { getDiscussionSidebarContext } from "@/utils/sidebarContext";
import { api, type RouterOutputs } from "@/utils/trpc/api";
import { createSupabaseComponentClient } from "@/utils/supabase/clients/component";
import { TRPCClientError } from "@trpc/client";
import { AlertCircle, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

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
  authorRole: "admin" | "student" | null,
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
    badge:
      authorRole === "admin"
        ? "Admin"
        : authorId === currentUserId
          ? "You"
          : undefined,
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
    node.author_role,
    resolveAvatarUrl,
    currentUserId,
  );

  return {
    id: node.id,
    author,
    content: node.body ?? "",
    createdAt: node.created_at ?? new Date(0),
    isDeleted: node.is_deleted ?? false,
    likeCount: node.like_count ?? 0,
    hasLiked: node.viewer_has_liked ?? false,
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

function patchThreadLikeState(
  node: ThreadNode,
  postId: number,
  nextLiked: boolean,
): ThreadNode {
  const selfChanged = node.id === postId;
  const children = node.children.map((child) =>
    patchThreadLikeState(child, postId, nextLiked),
  );

  if (!selfChanged) {
    return { ...node, children };
  }

  const alreadyLiked = node.viewer_has_liked ?? false;
  if (alreadyLiked === nextLiked) {
    return { ...node, children };
  }

  return {
    ...node,
    children,
    viewer_has_liked: nextLiked,
    like_count: Math.max(0, (node.like_count ?? 0) + (nextLiked ? 1 : -1)),
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
  cohortSlug,
  onToggleLike,
  isLikePending,
  getDesiredLike,
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
  cohortSlug: string;
  onToggleLike: (post: DiscussionUiPost) => void;
  isLikePending: (postId: string | number) => boolean;
  getDesiredLike: (postId: number) => boolean | undefined;
}) {
  const threadQuery = api.discussions.getThread.useQuery(
    { postId, cohortSlug },
    { 
      retry: false, 
      enabled: !!cohortSlug && !isLikePending(postId)
    },
  );

  const topLevelPost: DiscussionUiPost = {
    id: thread.id,
    author: getAuthorProfile(
      thread.author_id,
      thread.author_full_name,
      thread.author_avatar_url,
      thread.author_role,
      resolveAvatarUrl,
      currentUserId,
    ),
    content: thread.body ?? "",
    createdAt: thread.created_at ?? new Date(0),
    isDeleted: thread.is_deleted ?? false,
    likeCount: thread.like_count ?? 0,
    hasLiked: thread.viewer_has_liked ?? false,
    replyCount: threadQuery.data ? countReplies(threadQuery.data) : 0,
    replies: [],
  };

  const topLevelLikeOverride = applyLikeOverride(
    topLevelPost.hasLiked ?? false,
    topLevelPost.likeCount ?? 0,
    getDesiredLike(thread.id),
  );

  topLevelPost.hasLiked = topLevelLikeOverride.hasLiked;
  topLevelPost.likeCount = topLevelLikeOverride.likeCount;

  if (!expanded) {
    return (
      <DiscussionPost
        post={topLevelPost}
        canManage={isAdmin || thread.author_id === currentUserId}
        onReply={onToggleReplies}
        onToggleLike={onToggleLike}
        isLikePending={isLikePending}
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

  const mappedThread = applyLikeOverrideToPost(
    mapThreadNodeToDiscussionPost(
      threadQuery.data,
      resolveAvatarUrl,
      currentUserId,
      isAdmin,
    ),
    getDesiredLike,
  );

  const renderReply = (reply: DiscussionRenderablePost) => (
    <DiscussionPost
      key={`reply-${reply.id}`}
      post={reply}
      isReply
      canManage={reply.canManage}
      onToggleLike={onToggleLike}
      isLikePending={isLikePending}
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
      onToggleLike={onToggleLike}
      isLikePending={isLikePending}
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
  const expandedThreadIdRef = useRef<number | null>(null);

  useEffect(() => {
    expandedThreadIdRef.current = expandedThreadId;
  }, [expandedThreadId]);

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
    { moduleSlug, cohortSlug },
    {
      enabled: !!moduleSlug && !!cohortSlug && moduleQuery.status === "success",
      retry: false,
    },
  );
  const updatePostMutation = api.discussions.updatePost.useMutation({
    onSuccess: async () => {
      await apiUtils.discussions.listThreadsByModuleSlug.invalidate({
        moduleSlug,
        cohortSlug,
      });
      if (expandedThreadId !== null) {
        await apiUtils.discussions.getThread.invalidate({
          postId: expandedThreadId,
          cohortSlug,
        });
      }
    },
  });
  const deletePostMutation = api.discussions.deletePost.useMutation({
    onSuccess: async () => {
      await apiUtils.discussions.listThreadsByModuleSlug.invalidate({
        moduleSlug,
        cohortSlug,
      });
      if (expandedThreadId !== null) {
        await apiUtils.discussions.getThread.invalidate({
          postId: expandedThreadId,
          cohortSlug,
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
      isLocked: !module.is_active,
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
  const applyLikeOptimistic = (postId: number, nextLiked: boolean) => {
    apiUtils.discussions.listThreadsByModuleSlug.setData(
      { moduleSlug, cohortSlug },
      (old) =>
        old?.map((thread) => {
          if (thread.id !== postId) return thread;
          const currentLiked = thread.viewer_has_liked ?? false;
          if (currentLiked === nextLiked) return thread;
          return {
            ...thread,
            viewer_has_liked: nextLiked,
            like_count: Math.max(
              0,
              (thread.like_count ?? 0) + (nextLiked ? 1 : -1),
            ),
          };
        }),
    );

    const expandedId = expandedThreadIdRef.current;
    if (expandedId !== null) {
      apiUtils.discussions.getThread.setData(
        { postId: expandedId, cohortSlug },
        (old) => (old ? patchThreadLikeState(old, postId, nextLiked) : old),
      );
    }
  };

  const refreshLikeCaches = async () => {
    await apiUtils.discussions.listThreadsByModuleSlug.invalidate({
      moduleSlug,
      cohortSlug,
    });
    const expandedId = expandedThreadIdRef.current;
    if (expandedId !== null) {
      await apiUtils.discussions.getThread.invalidate({
        postId: expandedId,
        cohortSlug,
      });
    }
  };

  const { handleToggleLike, isLikePending, getDesiredLike } =
    useDiscussionLikeQueue({
      onOptimisticUpdate: applyLikeOptimistic,
      onRefresh: refreshLikeCaches,
    });

  const moduleErrorCode =
    moduleQuery.error instanceof TRPCClientError
      ? moduleQuery.error.data?.code
      : undefined;

  return (
    <CohortAccessGuard cohortSlug={cohortSlug}>
      <div className="flex min-h-[calc(100vh-7rem)] w-full items-stretch">
        {mounted &&
          (sidebarContext === "discussions" ? (
            <SidebarDiscussions
              items={discussionItems}
              activeId={activeDiscussionId}
              canAccessLocked={isAdmin}
            />
          ) : (
            <SidebarModules items={sidebarItems} activeId={1} />
          ))}
        <div className="flex min-h-[calc(100vh-7rem)] flex-1 flex-col">
          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-black">
                {moduleQuery.data?.title ?? "Module Discussion"}
              </h1>
            </div>

            {moduleQuery.isLoading ? (
              <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500">
                Loading module...
              </div>
            ) : moduleErrorCode === "FORBIDDEN" ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white p-10 text-center">
                <Lock className="h-8 w-8 text-gray-400" strokeWidth={1.5} />
                <p className="font-medium text-gray-600">
                  This module is locked.
                </p>
                <p className="text-sm text-gray-400">
                  You do not have access to this module yet.
                </p>
                <Link
                  href={cohortSlug ? `/cohorts/${cohortSlug}/dashboard` : "/"}
                  className="mt-2 inline-flex items-center justify-center rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                >
                  Back to Dashboard
                </Link>
              </div>
            ) : moduleErrorCode === "NOT_FOUND" || !moduleQuery.data ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white p-10 text-center">
                <AlertCircle
                  className="h-8 w-8 text-gray-400"
                  strokeWidth={1.5}
                />
                <p className="font-medium text-gray-600">Module not found.</p>
                <Link
                  href={cohortSlug ? `/cohorts/${cohortSlug}/dashboard` : "/"}
                  className="mt-2 inline-flex items-center justify-center rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                >
                  Back to Dashboard
                </Link>
              </div>
            ) : threadsQuery.isLoading ? (
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
                    cohortSlug={cohortSlug}
                    onToggleLike={handleToggleLike}
                    isLikePending={isLikePending}
                    getDesiredLike={getDesiredLike}
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
