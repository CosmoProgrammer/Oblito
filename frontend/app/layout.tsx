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
    const pathname = usePathname();
    const noNavbarPaths = ['/login', '/signup', '/dashboard'];
    const showNavbar = !noNavbarPaths.includes(pathname);

    return (
        <html lang="en">
            <body>
                <div className="bg-[#FFE4C4]">
                    {showNavbar && (<>
                <NavBar />
                </>)}
                {children}
                {showNavbar && (<Footer />)}
                </div>
                
            </body>
        </html>
    );
}