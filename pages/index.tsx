import type { GetServerSideProps } from "next";
import type { NextApiRequest, NextApiResponse } from "next";
import { createTRPCContext } from "@/server/api/trpc";
import { createCaller } from "@/server/api/root";

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const ctx = await createTRPCContext({
    req: req as NextApiRequest,
    res: res as NextApiResponse,
  } as Parameters<typeof createTRPCContext>[0]);

  if (!ctx.subject) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const caller = createCaller(ctx);

  try {
    const profile = await caller.profiles.me();
    if (profile.role === "admin") {
      return {
        redirect: { destination: "/admin/cohorts", permanent: false },
      };
    }

    const cohort = await caller.cohorts.hasCohortMembership({});
    return {
      redirect: {
        destination: cohort
          ? `/cohorts/${cohort.slug}/dashboard`
          : "/cohort-access",
        permanent: false,
      },
    };
  } catch {
    return { redirect: { destination: "/login", permanent: false } };
  }
};

export default function Home() {
  return null;
}
