import { useRef, useState } from "react";
import { api } from "@/utils/trpc/api";

type LikeRenderable = {
  id: string | number;
  hasLiked?: boolean;
  likeCount?: number;
  replies?: LikeRenderable[];
};

type LikeTogglePost = {
  id: string | number;
  hasLiked?: boolean;
};

export function applyLikeOverride(
  hasLiked: boolean,
  likeCount: number,
  desiredLiked?: boolean,
) {
  if (desiredLiked === undefined || desiredLiked === hasLiked) {
    return { hasLiked, likeCount };
  }

  return {
    hasLiked: desiredLiked,
    likeCount: Math.max(0, likeCount + (desiredLiked ? 1 : -1)),
  };
}

export function applyLikeOverrideToPost<T extends LikeRenderable>(
  post: T,
  getDesiredLike: (postId: number) => boolean | undefined,
): T {
  const baseHasLiked = post.hasLiked ?? false;
  const baseLikeCount = post.likeCount ?? 0;
  const override = applyLikeOverride(
    baseHasLiked,
    baseLikeCount,
    typeof post.id === "number" ? getDesiredLike(post.id) : undefined,
  );

  const replies = (post.replies ?? []).map((reply) =>
    applyLikeOverrideToPost(reply as LikeRenderable, getDesiredLike),
  );

  return {
    ...post,
    hasLiked: override.hasLiked,
    likeCount: override.likeCount,
    replies,
  } as T;
}

type UseDiscussionLikeQueueOptions = {
  onOptimisticUpdate: (postId: number, nextLiked: boolean) => void;
  onRefresh: () => Promise<void>;
};

export function useDiscussionLikeQueue({
  onOptimisticUpdate,
  onRefresh,
}: UseDiscussionLikeQueueOptions) {
  const likeDesiredByPostRef = useRef(new Map<number, boolean>());
  const likeInFlightByPostRef = useRef(new Set<number>());
  const [likePendingVersion, setLikePendingVersion] = useState(0);
  const likePostMutation = api.discussions.likePost.useMutation();
  const unlikePostMutation = api.discussions.unlikePost.useMutation();

  const flushLikeIntent = async (postId: number) => {
    if (likeInFlightByPostRef.current.has(postId)) {
      return;
    }

    const desired = likeDesiredByPostRef.current.get(postId);
    if (desired === undefined) {
      return;
    }

    likeInFlightByPostRef.current.add(postId);
    setLikePendingVersion((v) => v + 1);

    try {
      if (desired) {
        await likePostMutation.mutateAsync({ post_id: postId });
      } else {
        await unlikePostMutation.mutateAsync({ post_id: postId });
      }
    } catch {
      await onRefresh();
    } finally {
      likeInFlightByPostRef.current.delete(postId);
      setLikePendingVersion((v) => v + 1);

      const latestDesired = likeDesiredByPostRef.current.get(postId);
      if (latestDesired === desired) {
        await onRefresh();
        if (likeDesiredByPostRef.current.get(postId) === desired) {
          likeDesiredByPostRef.current.delete(postId);
        }
      } else {
        void flushLikeIntent(postId);
      }
    }
  };

  const isLikePending = (postId: string | number) => {
    if (typeof postId !== "number") return false;
    return likeInFlightByPostRef.current.has(postId);
  };

  const getDesiredLike = (postId: number) =>
    likeDesiredByPostRef.current.get(postId);

  const handleToggleLike = (post: LikeTogglePost) => {
    if (typeof post.id !== "number") return;

    const currentDesired = likeDesiredByPostRef.current.get(post.id);
    const effectiveLiked = currentDesired ?? post.hasLiked ?? false;
    const nextLiked = !effectiveLiked;

    likeDesiredByPostRef.current.set(post.id, nextLiked);
    onOptimisticUpdate(post.id, nextLiked);
    void flushLikeIntent(post.id);
  };

  void likePendingVersion;

  return {
    handleToggleLike,
    isLikePending,
    getDesiredLike,
  };
}
