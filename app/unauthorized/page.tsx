import Link from "next/link";

export default function Unauthorized() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <div className="text-2xl font-bold">403</div>
        <p className="mt-1 text-sm text-neutral-500">You don&apos;t have access to this page.</p>
        <Link href="/login" className="mt-4 inline-block rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white">Back to sign in</Link>
      </div>
    </div>
  );
}
