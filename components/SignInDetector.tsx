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
            setFavList(user.publicMetadata.favourites as string[]);
        }
    }, [isSignedIn]);

    return <></>;
};

export default SignInDetector;
