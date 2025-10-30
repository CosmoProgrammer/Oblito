"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const apiBase = process.env.BACKEND_URL || "http://localhost:8000";

interface Props {
  userRole: string;
}

export default function LoginForm({ userRole }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleGoogleSignIn = () => {
    window.location.href = `${apiBase}/auth/google`;
  };

  const handleSetEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSetPassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);

    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        setStatus("success");
        setMessage(data?.message || "Login succeeded");
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
    <div className="login-container">
      <h1>OBLITO</h1>
      <p className="welcome-message">{userRole} Sign In</p>
      <form id="login-form" onSubmit={handleSignIn}>
        <div className="form-group">
          <label htmlFor="email">{userRole.charAt(0).toUpperCase() + userRole.slice(1)} Email ID</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={handleSetEmail}
            name="email"
            placeholder="you@example.com"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={handleSetPassword}
            name="password"
            placeholder="••••••••"
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Sign In
        </button>
        <div className="login-methods">
          <a href="#">Forgot password?</a>
          <br />
          <a href="#">Login Via OTP</a>
        </div>
      </form>
      {userRole === "Buyer" && (
        <div>
          <div className="separator">
            <span>OR</span>
          </div>
          <div className="social-login">
            <button type="button" className="btn btn-social btn-google" onClick={handleGoogleSignIn}>
              Sign in with Google
            </button>
            <button type="button" className="btn btn-social btn-facebook">
              Sign in with Facebook
            </button>
          </div>
        </div>
      )}
      <div className="signup-link">
        <p>
          New {userRole}? <a href="../signup">Create a {userRole} account</a>
        </p>
      </div>
      {message && (
        <div style={{ marginTop: 12 }}>
          <strong>Status:</strong> {status}
          <pre style={{ whiteSpace: 'pre-wrap' }}>{message}</pre>
        </div>
      )}
    </div>
  );
}
