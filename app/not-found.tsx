import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow text-center">
        <h1 className="text-3xl font-bold text-gray-900">Page not found</h1>
        <p className="text-gray-600">
          This URL does not exist in Beans Admin.
        </p>
        <Link
          href="/beans"
          className="inline-block mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Back to catalog
        </Link>
      </div>
    </div>
  )
}
