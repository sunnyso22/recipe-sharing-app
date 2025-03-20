"use client";

import React, { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Check, Link2, Share } from "lucide-react";
import Facebook from "@/public/icons/facebook.svg";
import WhatsApp from "@/public/icons/whatsapp.svg";

const ShareButton = ({ url }: { url: string }) => {
    const [copied, setCopied] = useState(false);
    const shareUrl =
        url || (typeof window !== "undefined" ? window.location.href : "");

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareToFacebook = () => {
        window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                shareUrl
            )}`,
            "_blank"
        );
    };
    const shareToWhatsApp = () => {
        window.open(
            `https://wa.me/?text=${encodeURIComponent(shareUrl)}`,
            "_blank"
        );
    };

    const socialButtons = [
        {
            name: "Facebook",
            icon: (
                <svg className="w-6 h-6 fill-[#0866FF]">
                    <Facebook />
                </svg>
            ),
            action: shareToFacebook,
        },
        {
            name: "WhatsApp",
            icon: (
                <svg className="w-6 h-6 fill-[#25D366]">
                    <WhatsApp />
                </svg>
            ),
            action: shareToWhatsApp,
        },
    ];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Share size={28} className="transition-all hover:scale-125" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem
                    onClick={handleCopyLink}
                    className="cursor-pointer"
                >
                    {copied ? <Check size={24} /> : <Link2 size={24} />}
                    <span className="ml-2">Copy link</span>
                </DropdownMenuItem>
                {socialButtons.map((platform) => (
                    <DropdownMenuItem
                        key={platform.name}
                        onClick={platform.action}
                        className="cursor-pointer"
                    >
                        {platform.icon}
                        <span className="ml-2">{platform.name}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default ShareButton;
