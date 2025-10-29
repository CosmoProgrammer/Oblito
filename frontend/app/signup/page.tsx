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

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        setMessage(null);

        try {
            const res = await fetch(`${apiBase}/auth/signup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ email, password, firstName, lastName }),
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
        <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
            <h1>Signup (test form)</h1>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
                <label>
                    First name
                    <input value={firstName} onChange={(e) => setFirstName(e.target.value)} name="firstName" required />
                </label>
                <label>
                    Last name
                    <input value={lastName} onChange={(e) => setLastName(e.target.value)} name="lastName" />
                </label>
                <label>
                    Email
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} name="email" required />
                </label>
                <label>
                    Password
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} name="password" required minLength={6} />
                </label>

                <div>
                    <button type="submit" disabled={status === "loading"}>
                        {status === "loading" ? "Signing up..." : "Sign up"}
                    </button>
                </div>
            </form>

            {message && (
                <div style={{ marginTop: 16 }}>
                    <strong>Result:</strong>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{message}</pre>
                </div>
            )}
        </main>
    );
};

export default SignupPage;