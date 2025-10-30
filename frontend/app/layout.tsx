'use client';

import Navbar from '@/components/navbar';
import Footer from '@/components/Footer';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [user, setUser] = useState<string | null>(null);
    const pathname = usePathname();

    const noNavbarPaths = ['/login', '/signup'];
    const showNavbar = !noNavbarPaths.includes(pathname);

    return (
        <html lang="en">
            <body>
                {showNavbar && (<>
                <Navbar 
                    user={user}
                    onSearch={(searchTerm) => {
                        // Handle search at app level if needed
                        console.log('Search term:', searchTerm);
                    }}
                />
                </>)}
                {children}
                {showNavbar && (<Footer />)}
            </body>
        </html>
    );
}