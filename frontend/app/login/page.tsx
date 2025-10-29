"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import "./loginStyle.css";

export default function LoginPage() {
  const [userRole, setUserRole] = useState("Buyer");
  const router = useRouter();

  function handleRoleClick(role : string) {
    setUserRole(prevRole => role);
  }

  const handleGoogleSignIn = () => {
    router.push("http://localhost:8000/auth/google");
  }

  const LoginForm = () => {
    return (
      <div className="login-container">
        <h1>OBLITO</h1>
        <p className="welcome-message">{userRole} Sign In</p>
        <form id="login-form">
          <div className="form-group">
            <label htmlFor="email">{userRole.charAt(0).toUpperCase() + userRole.slice(1)} Email ID</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="you@example.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
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
            New {userRole}? <a href="#">Create a {userRole} account</a>
          </p>
        </div>
      </div>
    );
  }

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

{userRole && <LoginForm />}
</div>
)
    
  
}
