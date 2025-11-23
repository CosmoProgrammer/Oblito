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
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [showOTPForm, setShowOTPForm] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(0);
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
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        setStatus("success");
        setMessage(data?.message || "Login succeeded");
        
        // Fetch user profile to get the role
        const userRes = await fetch(`${apiBase}/me`, {
          credentials: 'include'
        });
        const userData = await userRes.json();

        if (userRes.ok) {
          if (userData.role === 'retailer' || userData.role === 'wholesaler') {
              router.push('/dashboard');
          } else {
              router.push('/home');
          }
        } else {
          throw new Error(userData.message || "Failed to fetch user profile.");
        }

      } else {
        setStatus("error");
        setMessage(data?.message || JSON.stringify(data) || `HTTP ${res.status}`);
      }
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message || String(err));
    }
  };

  const handleLoginViaOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);

    try {
      const res = await fetch(`${apiBase}/auth/request-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage("OTP sent to your email!");
        setOtpEmail(email);
        setShowOTPForm(true);
        setOtpCountdown(120); // 10 minutes
        
        const interval = setInterval(() => {
          setOtpCountdown(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setStatus("error");
        setMessage(data.message || "Failed to send OTP");
      }
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message || "Failed to send OTP");
    } finally {
      setStatus("idle");
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);

    try {
      const res = await fetch(`${apiBase}/auth/verify-otp`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email: otpEmail, otp }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage("Login successful!");
        
        // Redirect based on user role from response
        if (data.user.role === 'retailer' || data.user.role === 'wholesaler') {
          router.push('/dashboard');
        } else {
          router.push('/home');
        }
      } else {
        setStatus("error");
        setMessage(data.message || "Invalid OTP");
      }
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message || "Failed to verify OTP");
    } finally {
      setStatus("idle");
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showOTPForm) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">OBLITO</h1>
        <p className="text-sm text-gray-600 mt-2 mb-6">Verify OTP</p>

        <form id="otp-form" onSubmit={handleVerifyOTP} className="space-y-4">
          <p className="text-sm text-gray-600 text-left">
            We've sent a 6-digit code to <strong>{otpEmail}</strong>
          </p>

          <div className="text-left">
            <label htmlFor="otp" className="block text-sm font-semibold text-gray-700 mb-2">
              Enter OTP Code
            </label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              placeholder="000000"
              className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white text-center text-xl tracking-widest"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#febd69] hover:bg-[#f5a623] text-black font-semibold py-3 rounded-lg transition-colors disabled:opacity-60"
            disabled={status === "loading" || otp.length !== 6}
          >
            {status === "loading" ? "Verifying..." : "Verify OTP"}
          </button>

          {otpCountdown > 0 && (
            <p className="text-xs text-gray-500">
              OTP expires in: <strong>{formatCountdown(otpCountdown)}</strong>
            </p>
          )}

          <button
            type="button"
            onClick={() => setShowOTPForm(false)}
            className="w-full text-sm text-gray-600 hover:text-yellow-600 py-2"
          >
            Back to Login
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${status === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md text-center">
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">OBLITO</h1>
      <p className="text-sm text-gray-600 mt-2 mb-6">{userRole} Sign In</p>

      <form id="login-form" onSubmit={handleSignIn} className="space-y-4">
        <div className="text-left">
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
            {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Email ID
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={handleSetEmail}
            name="email"
            className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
            required
          />
        </div>

        <div className="text-left">
          <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={handleSetPassword}
            name="password"
            placeholder="••••••••"
            className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#febd69] hover:bg-[#f5a623] text-black font-semibold py-3 rounded-lg transition-colors disabled:opacity-60"
          disabled={status === "loading"}
        >
          {status === "loading" ? "Signing in..." : "Sign In"}
        </button>

        <div className="flex flex-col items-center text-sm text-gray-600 gap-1">
          <a href="#" className="hover:text-yellow-600">Forgot password?</a>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleLoginViaOTP(e as any);
            }}
            className="hover:text-yellow-600"
          >
            Login Via OTP
          </button>
        </div>
      </form>

      {userRole === "Buyer" && (
        <>
          <div className="flex items-center my-6 text-sm text-gray-400">
            <span className="flex-1 h-px bg-gray-200" />
            <span className="px-3">OR</span>
            <span className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm font-medium hover:bg-gray-50"
              onClick={handleGoogleSignIn}
            >
              Sign in with Google
            </button>

            <button
              type="button"
              className="w-full inline-flex items-center justify-center px-3 py-2 rounded-lg bg-[#febd69] text-black text-sm font-medium hover:bg-[#f5a623]"
            >
              Sign in with Meta
            </button>
          </div>
        </>
      )}

      <div className="mt-6 text-sm text-gray-600">
        New {userRole}? <a href="../signup" className="text-yellow-600 font-semibold hover:underline">Create a {userRole} account</a>
      </div>

      {message && (
        <div className="mt-4 text-left text-sm">
          <strong className="block text-gray-700">Status: <span className="font-medium">{status}</span></strong>
          <pre className="whitespace-pre-wrap mt-2 text-xs text-gray-800 bg-gray-50 p-3 rounded-md border border-gray-100">{message}</pre>
        </div>
      )}
    </div>
  );
}
