// ...existing code...
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const SignupPage = () => {
    const router = useRouter();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState<string | null>(null);

    const apiBase = process.env.BACKEND_URL || "http://localhost:8000";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        setMessage(null);

        try {
            const res = await fetch(`${apiBase}/auth/signup`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({ email, password, firstName, lastName, userRole: 'customer' }),
            });

            const data = await res.json().catch(() => null);

            if (res.ok) {
                setStatus("success");
                setMessage(data?.message || "Signup succeeded");
                router.push('/home');
            } else {
                setStatus("error");
                setMessage(data?.message || JSON.stringify(data) || `HTTP ${res.status}`);
            }
        } catch (err: any) {
            setStatus("error");
            setMessage(err?.message || String(err));
        }
    };

    return (
        <main className="min-h-screen bg-gray-100 flex items-center justify-center p-5">
            <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
                <p className="text-sm text-gray-600 mb-6">Join Oblito as a Buyer</p>

                <form onSubmit={handleSubmit} className="grid gap-4">
                    <div>
                        <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                        <input
                            id="firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            name="firstName"
                            required
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                        />
                    </div>

                    <div>
                        <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                        <input
                            id="lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            name="lastName"
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            name="email"
                            required
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            name="password"
                            required
                            minLength={6}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-opacity disabled:opacity-60"
                        disabled={status === "loading"}
                    >
                        {status === "loading" ? "Creating Account..." : "Sign Up"}
                    </button>
                </form>

                <div className="mt-6 pt-4 border-t border-gray-200 text-sm">
                  <a href="/login" className="text-gray-600 hover:text-blue-600">Already have an account? Sign In</a>
                </div>

                {message && (
                    <div
                        className={`mt-4 p-4 rounded-md text-sm text-left ${status === "success"
                            ? "bg-green-50 border border-green-200 text-green-800"
                            : "bg-red-50 border border-red-200 text-red-800"}`}
                    >
                        <strong className="block mb-2">Result:</strong>
                        <pre className="whitespace-pre-wrap text-xs m-0 font-mono">{message}</pre>
                    </div>
                )}
            </div>
        </main>
    );
};

export default SignupPage;
// ...existing code...