import type { Subject } from "@/server/models/auth";

export type ViewerRole = "admin" | "student";

export type Viewer = {
  userId: string;
  role: ViewerRole;
  cohortId: string | null;
  isActive: boolean;
};

/**
 * Map (MOCK_USER_ID) to roles/cohorts.
 * These IDs are NOT Supabase IDs; they’re whatever strings you set in .env.local.
 */
const MOCK_VIEWERS: Record<
  string,
  { role: ViewerRole; cohortId: string | null; isActive?: boolean }
> = {
  // Admin
  "mock-admin": { role: "admin", cohortId: null, isActive: true },

  // Students
  "mock-student-c1": { role: "student", cohortId: "c1", isActive: true },
  "mock-student-c2": { role: "student", cohortId: "c2", isActive: true },
};

/**
 * Default viewer if MOCK_USER_ID is missing from MOCK_VIEWERS.
 */
function defaultViewer(userId: string): Viewer {
  return {
    userId,
    role: "student",
    cohortId: "c1",
    isActive: true,
  };
}

/**
 * Resolve viewer from ctx.subject.
 * Use this inside protectedProcedure routes (subject guaranteed non-null).
 */
export function getMockViewerFromSubject(subject: Subject): Viewer {
  const userId = subject.id;

  const entry = MOCK_VIEWERS[userId];
  if (!entry) return defaultViewer(userId);

  // normalize: admins never have cohortId
  if (entry.role === "admin") {
    return {
      userId,
      role: "admin",
      cohortId: null,
      isActive: entry.isActive ?? true,
    };
  }

  return {
    userId,
    role: "student",
    cohortId: entry.cohortId, // can be null if you want to simulate no cohort specificity
    isActive: entry.isActive ?? true,
  };
}
