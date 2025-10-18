import { PageLayout } from "~/components/ui/PageLayout";
import Link from "next/link";

export default function NotFound() {
  return (
    <PageLayout title="Page Not Found">
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-md text-center">
          <div className="text-6xl mb-4">🤔</div>
          <h1 className="text-2xl font-bold text-black mb-4">Page Not Found</h1>
          <p className="text-gray-600 mb-6">
            Sorry, we couldn't find the page you're looking for.
          </p>
          <Link 
            href="/" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}
