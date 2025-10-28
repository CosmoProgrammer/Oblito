"use client";

import { useRouter } from 'next/navigation';

export default function LoginPage() {

    const router = useRouter();
    const handleGoogleLogin = () => {
        router.push(`http://localhost:8000/auth/google`);
    }

    return (
        <main>
            <h1>Login</h1>
            <p>
                <button onClick={handleGoogleLogin}>
                    Login with Google
                </button>
            </p>
        </main>
    );
}
