"use client";

import React, { useState, useEffect } from 'react';
import RetailerDashboard from '@/components/RetailerDashboard';
import WholesalerDashboard from '@/components/WholesalerDashboard';

export default function DashboardPage() {
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

      useEffect(() => {
            async function fetchUser() {
                try {
                    const res = await fetch(`http://localhost:8000/auth/user`, {
                        credentials: 'include',
                        method: 'GET',
                    });
                    if(res.ok){
                        const data = await res.json();
                        setUserRole(data.user.role);
                    }
                } catch (err) {
                    console.error('Error fetching user:', err);
                } finally {
                    setLoading(false);
                }
            }
            fetchUser();
        }, []);
        console.log("User Role:", userRole);
        return (
        <div className="max-w-[1500px] mx-auto p-[20px] grow bg-[#FFE4C4] w-full">
            {/* <h1>Dashboard</h1> */}
            {loading ? (
                <p>Loading...</p>
            ) : userRole === "Retailer"? (
                <RetailerDashboard />
            ) : userRole === "Wholesaler" ? (
                <WholesalerDashboard />
            ) : (
                // <div>
                // <p>You do not have access to this dashboard.</p>
                // <a href="/login" className="text-blue-600 underline">Go to Login</a>
                // </div>
                <RetailerDashboard/>
            )}
            </div>
            );
}