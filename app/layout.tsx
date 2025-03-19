import type { Metadata } from "next";
import { Lato } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ClerkProvider } from "@clerk/nextjs";
import UserContextProvider from "@/context/UserContext";
import SignInDetector from "@/components/SignInDetector";

const myFont = Lato({
    subsets: ["latin"],
    weight: ["400", "700"],
});

export const dynamicParams = false;

export const metadata: Metadata = {
    title: "Cookery",
    description: "The best cookbook you could find.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ClerkProvider>
            <html lang="en">
                <body className={`${myFont.className} antialiased`}>
                    <UserContextProvider>
                        <Header />
                        {children}
                        <Footer />
                        <SignInDetector />
                    </UserContextProvider>
                </body>
            </html>
        </ClerkProvider>
    );
}
