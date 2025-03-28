import { SpeedInsights } from "@vercel/speed-insights/next";
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

export const revalidate = 60;

export const dynamicParams = true;

export const metadata: Metadata = {
    title: {
        default: "Cookery",
        template: "%s | Cookery",
    },
    description: "Discover, Share, and Savor the World's Best Recipes",
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
                        <SpeedInsights />
                    </UserContextProvider>
                </body>
            </html>
        </ClerkProvider>
    );
}
