import Link from "next/link";

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md w-full text-center">
                <h1 className="text-4xl font-bold text-blue-700 mb-6">FlyNext</h1>
                <p className="text-black mb-8">Your next journey starts here</p>
                <div className="space-y-4">
                    <Link 
                        href="/ui/login" 
                        className="block w-full px-6 py-3 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition-all duration-300 font-medium"
                    >
                        Login
                    </Link>
                    <Link 
                        href="/ui/register" 
                        className="block w-full px-6 py-3 bg-green-600 text-white rounded-xl shadow-md hover:bg-green-700 transition-all duration-300 font-medium"
                    >
                        Register
                    </Link>
                </div>
            </div>
        </div>
    );
}