"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useUserContext } from "@/context/UserContext";

const SignInDetector = () => {
    const { isSignedIn, user } = useUser();

    const { setFavList, setBmList } = useUserContext();

    useEffect(() => {
        if (isSignedIn) {
            console.log("User signed in");
            // Clear both list everytime in case different user login and logout in the same device
            setFavList([]);
            setBmList([]);
            if (user.publicMetadata.favourites)
                setFavList(user.publicMetadata.favourites as string[]);
            if (user.publicMetadata.bookmarks)
                setBmList(user.publicMetadata.bookmarks as string[]);
        }
    }, [isSignedIn]);

    return <></>;
};

export default SignInDetector;
