import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="text-center p-8">
        <h1 className="text-6xl font-bold text-black dark:text-white mb-4">
          404
        </h1>
        <h2 className="text-2xl font-semibold text-zinc-700 dark:text-zinc-300 mb-4">
          Page Not Found
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
