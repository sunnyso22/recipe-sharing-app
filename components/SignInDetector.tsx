"use client";

import { useUserContext } from "@/context/UserContext";
import { useUser } from "@clerk/nextjs";
import React, { useEffect } from "react";

const SignInDetector = () => {
    const { isSignedIn, user } = useUser();

    const { setFavList } = useUserContext();

    useEffect(() => {
        if (isSignedIn) {
            console.log("User signed in");
            // Clear fav list everytime in case different user login and logout in the same device
            setFavList([]);
            if (user.publicMetadata.favourites) {
                setFavList(user.publicMetadata.favourites as string[]);
            }
        }
    }, [isSignedIn]);

    return <></>;
};

export default SignInDetector;
