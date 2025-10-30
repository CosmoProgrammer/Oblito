"use client";

import { useState } from 'react';
import "./loginStyle.css";
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  const [userRole, setUserRole] = useState("Buyer");

  function handleRoleClick(role: string) {
    setUserRole(role);
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

      {userRole && <LoginForm userRole={userRole} />}
    </div>
  )
}
