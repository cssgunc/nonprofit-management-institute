export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6">
      <h1 className="text-3xl font-bold text-white">Home</h1>
      <p className="text-zinc-400">
        This is the home page, the main landing page for the Nonprofit
        Management Institute. Other pages are accessible currently by using
        /signup or /login and any unknown routes will be redirected to the 404
        page.
      </p>
    </div>
  );
}
