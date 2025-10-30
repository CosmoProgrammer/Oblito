"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginPage from '../login/page';
import "./signupStyle.css";

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
        <main>
            <div className="page-wrapper">
            <div className="signup-container">
                <h1>Create Account</h1>
                <p className="welcome-message">Join Oblito as a Buyer</p>
                
                <form onSubmit={handleSubmit} className="signup-form">
                    <div className="form-group">
                        <label htmlFor="firstName">First Name</label>
                        <input 
                            id="firstName"
                            value={firstName} 
                            onChange={(e) => setFirstName(e.target.value)} 
                            name="firstName" 
                            required 
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="lastName">Last Name</label>
                        <input 
                            id="lastName"
                            value={lastName} 
                            onChange={(e) => setLastName(e.target.value)} 
                            name="lastName" 
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input 
                            id="email"
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            name="email" 
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input 
                            id="password"
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            name="password" 
                            required 
                            minLength={6} 
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={status === "loading"}>
                        {status === "loading" ? "Creating Account..." : "Sign Up"}
                    </button>
                </form>

                <div className="alternative-logins">
                  <a href="/login">Already have an account? Sign In</a>
                </div>
            </div>

            {message && (
                <div style={{ marginTop: 16 }}>
                    <strong>Result:</strong>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{message}</pre>
                </div>
            )}
        </div>
        </main>

    );
};

export default SignupPage;