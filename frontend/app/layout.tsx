'use client';
import './globals.css';


import NavBar from '@/components/NavBar';
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
    const categories=['Electronics', 'Books', 'Clothing', 'Home', 'Toys']


    const noNavbarPaths = ['/login', '/signup'];
    const showNavbar = !noNavbarPaths.includes(pathname);

    return (
        <html lang="en">
            <body>
                {showNavbar && (<>
                <NavBar />
                </>)}
                {children}
                {showNavbar && (<Footer />)}
            </body>
        </html>
    );
}