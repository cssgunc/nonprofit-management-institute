import { api } from "@/utils/trpc/api";

export default function Profile() {
  const profileQuery = api.profiles.me.useQuery();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-12">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-black">Profile</h1>
        <p className="mt-2 text-black">
          This is the profile page for the user.
        </p>

        {profileQuery.isLoading ? (
          <div className="mt-8 rounded-xl bg-zinc-100 p-4 text-black">
            Loading profile...
          </div>
        ) : profileQuery.error ? (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            Failed to load profile context.
          </div>
        ) : profileQuery.data ? (
          <div className="mt-8 space-y-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
                Full Name
              </p>
              <p className="mt-1 text-lg text-black">
                {profileQuery.data.full_name}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
                Role
              </p>
              <p className="mt-1 text-lg capitalize text-black">
                {profileQuery.data.role}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
                Active
              </p>
              <p className="mt-1 text-lg text-black">
                {profileQuery.data.is_active ? "Yes" : "No"}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
                User ID
              </p>
              <p className="mt-1 break-all text-sm text-black">
                {profileQuery.data.id}
              </p>
            </div>

            <div className="pt-4">
              <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
                Current Profile Context
              </p>
              <pre className="mt-2 overflow-x-auto rounded-xl bg-zinc-100 p-4 text-sm text-black">
                {JSON.stringify(profileQuery.data, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-xl bg-zinc-100 p-4 text-black">
            No profile data found.
          </div>
        )}
      </div>
    </div>
  );
}
