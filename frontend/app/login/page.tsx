"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import "./loginStyle.css";
import type {LoginFormProps} from "@/types/LoginFormProps";


const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function LoginForm({ userRole,
  email,
  password,
  status,
  message,
  handleSetEmail,
  handleSetPassword,
  handleSignIn,
  handleGoogleSignIn
}: LoginFormProps) {

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
        {userRole==="Buyer" && ( <div>
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
        </div>)}
        <div className="signup-link">
          <p>
            New {userRole}? <a href="../signup">Create a {userRole} account</a>
          </p>
        </div>
      </div>
    );
}
export default function LoginPage() {
  const [userRole, setUserRole] = useState("Buyer");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  function handleRoleClick(role : string) {
    setUserRole(prevRole => role);
    setEmail("");
    setPassword("");
    setStatus("idle");
    setMessage(null);
  }

  const handleGoogleSignIn = () => {
    router.push("http://localhost:8000/auth/google");
  }

  const handleSetEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  }

  const handleSetPassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  }
   const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        setMessage(null);

        try {
            console.log("Attempting login with:", { email, password });
            const res = await fetch(`${apiBase}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ email, password, }),
            });

            const data = await res.json().catch(() => null);

            console.log("Login response:", { res, data });

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

  return(
  <div className="page-wrapper">
      <div className="role-selector-container">
        <div className="role-button-group">
          <button 
            className={`role-button ${userRole === "Buyer" ? "active" : ""}`}
            onClick={() => handleRoleClick("Buyer")}
          >
            Buyer
          </button>
          <button 
            className={`role-button ${userRole === "Admin" ? "active" : ""}`}
            onClick={() => handleRoleClick("Admin")}
          >
            Admin
          </button>
          <button 
            className={`role-button ${userRole === "Retailer" ? "active" : ""}`}
            onClick={() => handleRoleClick("Retailer")}
          >
            Retailer
          </button>
          <button 
            className={`role-button ${userRole === "Wholesaler" ? "active" : ""}`}
            onClick={() => handleRoleClick("Wholesaler")}
          >
            Wholesaler
          </button>
        </div>
      </div>

{userRole && <LoginForm userRole={userRole}
  email={email}
  password={password}
  status={status}
  message={message}
  handleSetEmail={handleSetEmail}
  handleSetPassword={handleSetPassword}
  handleSignIn={handleSignIn}
  handleGoogleSignIn={handleGoogleSignIn}
/>}
</div>
)
    
  
}
