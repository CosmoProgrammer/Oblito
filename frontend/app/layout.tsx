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
            <body className="bg-gray-50 text-gray-900 antialiased">
                <div className="min-h-screen flex flex-col">
                    {showNavbar && (<>
                <NavBar />
                </>)}
                <main className="flex-grow">
                    {children}
                </main>
                {showNavbar && (<Footer />)}
                </div>
                
            </body>
        </html>
    );
}