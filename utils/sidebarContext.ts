export type DiscussionSidebarContext = "modules" | "discussions";

const DISCUSSION_SIDEBAR_CONTEXT_KEY = "discussion-sidebar-context";

export function setDiscussionSidebarContext(context: DiscussionSidebarContext) {
	if (typeof window === "undefined") {
		return;
	}

	window.sessionStorage.setItem(DISCUSSION_SIDEBAR_CONTEXT_KEY, context);
}

export function getDiscussionSidebarContext(): DiscussionSidebarContext | null {
	if (typeof window === "undefined") {
		return null;
	}

	const value = window.sessionStorage.getItem(DISCUSSION_SIDEBAR_CONTEXT_KEY);

	if (value === "modules" || value === "discussions") {
		return value;
	}

	return null;
}
