"use client";

import React, { useState, useEffect } from 'react';
import RetailerDashboard from '@/components/RetailerDashboard';
import WholesalerDashboard from '@/components/WholesalerDashboard';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

      useEffect(() => {
            async function fetchUser() {
                try {
                    const res = await fetch(`http://localhost:8000/me`, {
                        credentials: 'include',
                        method: 'GET',
                    });
                    const responseData = await res.json();
                    console.log("Fetched user data:", responseData);
                    if(res.ok){
                        const data = responseData;
                        const role = data.user.role;
                        console.log("User role from /me:", role);
                        if (role === 'retailer' || role === 'wholesaler') {
                            setUserRole(role);
                        } else {
                            router.push('/home');
                        }
                    } else {
                        router.push('/login');
                    }
                } catch (err) {
                    console.error('Error fetching user:', err);
                    router.push('/login');
                } finally {
                    setLoading(false);
                }
            }
            fetchUser();
        }, [router]);
        
        console.log("User Role:", userRole);
        return (
        <div className="max-w-[1500px] mx-auto p-[20px] grow bg-[#FFE4C4] w-full">
            {/* <h1>Dashboard</h1> */}
            {loading ? (
                <p>Loading...</p>
            ) : userRole === "retailer"? (
                <RetailerDashboard />
            ) : userRole === "wholesaler" ? (
                <WholesalerDashboard />
            ) : (
                <p>Redirecting...</p>
            )}
            </div>
            );
}