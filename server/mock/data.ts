export type Role = "admin" | "student";

export type Profile = {
  id: string; // auth.users.id
  role: Role;
  full_name: string;
  is_active: boolean;
};

export type Cohort = {
  id: string;
  is_active: boolean;
};

export type CohortMembership = {
  cohort_id: string;
  user_id: string;
};

export type Module = {
  id: string;
  module_index: number;
  slug: string;
  title: string;
  description: string | null;
  locked: boolean;
};

export type ResourceType = "handout" | "recording" | "link";

export type Resource = {
  id: string;
  module_id: string;
  cohort_id: string | null; // null = global
  type: ResourceType;
  title: string;
  description: string | null;
  url: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  created_by: string; // profiles.id
};

export const mockProfiles: Profile[] = [
  { id: "u_admin", role: "admin", full_name: "Admin User", is_active: true },
  { id: "u_s1", role: "student", full_name: "Student One", is_active: true },
  { id: "u_s2", role: "student", full_name: "Student Two", is_active: true },
];

export const mockCohorts: Cohort[] = [
  { id: "c1", is_active: true },
  { id: "c2", is_active: true },
];

export const mockMemberships: CohortMembership[] = [
  { cohort_id: "c1", user_id: "u_s1" },
  { cohort_id: "c2", user_id: "u_s2" },
];

export const mockModules: Module[] = [
  {
    id: "m1",
    module_index: 1,
    slug: "orientation",
    title: "Orientation, Capacity Assessment, Nonprofit Management",
    description:
      "Learn the fundamentals of nonprofit organizations and their role in society.",
    locked: false,
  },
  {
    id: "m2",
    module_index: 2,
    slug: "board-governance",
    title: "Board Governance",
    description:
      "Understand board responsibilities, recruitment, and effective governance practices.",
    locked: false,
  },
  {
    id: "m3",
    module_index: 3,
    slug: "strategic-planning",
    title: "Strategic Planning",
    description:
      "Master the art of creating effective strategic plans for nonprofit success.",
    locked: false,
  },
  {
    id: "m4",
    module_index: 4,
    slug: "fundraising-development",
    title: "Fundraising & Development",
    description:
      "Explore donor cultivation, grant writing, and sustainable funding strategies.",
    locked: false,
  },
  {
    id: "m5",
    module_index: 5,
    slug: "financial-management",
    title: "Financial Management",
    description:
      "Build skills in budgeting, financial reporting, and fiscal accountability.",
    locked: false,
  },
  {
    id: "m6",
    module_index: 6,
    slug: "program-evaluation",
    title: "Program Evaluation & Impact",
    description:
      "Learn to measure outcomes, demonstrate impact, and improve program effectiveness.",
    locked: false,
  },
];

export const mockResources: Resource[] = [
  // unlocked moudule resource
  {
    id: "r1",
    module_id: "m1",
    cohort_id: "c1",
    type: "recording",
    title: "Orientation recording (Cohort 1)",
    description: "Private cohort recording",
    url: "https://example.com/orientation-c1",
    mime_type: "text/html",
    size_bytes: null,
    created_by: "u_admin",
  },
  // locked module resource
  {
    id: "r3",
    module_id: "m2",
    cohort_id: null,
    type: "link",
    title: "Board governance reading",
    description: null,
    url: "https://example.com/board",
    mime_type: null,
    size_bytes: null,
    created_by: "u_admin",
  },
];
