import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="space-y-6 text-center">
        <h1 className="text-9xl font-bold text-gray-900 animate-bounce">404</h1>
        <h2 className="text-3xl font-semibold text-gray-700">Page Not Found</h2>
        <p className="text-gray-500 max-w-lg">
          Oops! It seems you&apos;ve ventured into uncharted territory. The page
          you&apos;re looking for might have moved or doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 text-white bg-black rounded-full hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
