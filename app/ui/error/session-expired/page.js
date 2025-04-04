import Link from "next/link";

export default function ErrorPage() {
    return (
        <div className="flex items-center justify-center min-h-screen px-4">
            <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md w-full text-center">
                <h1 className="text-2xl font-semibold text-black mb-4">
                    Your session has expired.
                </h1>
                <p className="text-black mb-6">Please re-login to continue.</p>
                <Link href="/">
                    <span className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg font-medium shadow hover:bg-blue-600 transition">
                        Back to Home
                    </span>
                </Link>
            </div>
        </div>
    );
}