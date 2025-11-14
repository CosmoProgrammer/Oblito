"use client";

import { useState } from 'react';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  const [userRole, setUserRole] = useState("Buyer");

  function handleRoleClick(role: string) {
    setUserRole(role);
  }

  const baseBtn =
    "px-4 py-3 text-sm font-semibold rounded-lg border transition-colors duration-150";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center w-full p-5 bg-gray-100">
      <div className="text-center mb-8 p-6 bg-white rounded-xl shadow-sm w-full max-w-md">
        <div className="grid grid-cols-2 gap-3">
          <button
            className={`${baseBtn} ${userRole === "Buyer"
              ? "bg-blue-600 text-white border-blue-600 shadow-md"
              : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50"}`}
            onClick={() => handleRoleClick("Buyer")}
            aria-pressed={userRole === "Buyer"}
          >
            Buyer
          </button>

          <button
            className={`${baseBtn} ${userRole === "Admin"
              ? "bg-blue-600 text-white border-blue-600 shadow-md"
              : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50"}`}
            onClick={() => handleRoleClick("Admin")}
            aria-pressed={userRole === "Admin"}
          >
            Admin
          </button>

          <button
            className={`${baseBtn} ${userRole === "Retailer"
              ? "bg-blue-600 text-white border-blue-600 shadow-md"
              : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50"}`}
            onClick={() => handleRoleClick("Retailer")}
            aria-pressed={userRole === "Retailer"}
          >
            Retailer
          </button>

          <button
            className={`${baseBtn} ${userRole === "Wholesaler"
              ? "bg-blue-600 text-white border-blue-600 shadow-md"
              : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50"}`}
            onClick={() => handleRoleClick("Wholesaler")}
            aria-pressed={userRole === "Wholesaler"}
          >
            Wholesaler
          </button>
        </div>
      </div>

      {userRole && <LoginForm userRole={userRole} />}
    </div>
  );
}
