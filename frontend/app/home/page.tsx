'use client';

import { use, useEffect, useState } from "react";

export default function HomePage() {
    const [user, setUser] = useState<string | null>(null);
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
                    setUser(data.user.email);
                }
            } catch (err) {
                console.error('Error fetching user:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchUser();
    }, []);
    return (
        <main>
            <h1>Home</h1>
            {loading ? (
                <p>Loading...</p>
            ) : user ? (
                <p className="font-bold">Welcome, {user}!</p>
            ) : (
                <p>You are not logged in.</p>
            )}
        </main>
    );
}