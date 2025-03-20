"use client";

import { updateToClerkPublicMetaData } from "@/actions/action";
import React, { createContext, useContext, useState } from "react";

type UserContextType = {
    favList: string[];
    setFavList: React.Dispatch<React.SetStateAction<string[]>>;
    addFavourite: (id: string) => void;
    removeFavourite: (id: string) => void;
    bmList: string[];
    setBmList: React.Dispatch<React.SetStateAction<string[]>>;
    addBookmark: (id: string) => void;
    removeBookmark: (id: string) => void;
};

const UserContext = createContext<UserContextType | null>(null);

const UserContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [favList, setFavList] = useState<string[]>([]);
    const [bmList, setBmList] = useState<string[]>([]);

    const updateFavList = (newFavList: string[]) => {
        setFavList(newFavList);
        updateToClerkPublicMetaData({ favList: newFavList });
    };
    const addFavourite = (id: string) => {
        updateFavList([...favList, id]);
    };
    const removeFavourite = (id: string) => {
        updateFavList(favList.filter((item) => item !== id));
    };

    const updateBmList = (newBmList: string[]) => {
        setBmList(newBmList);
        updateToClerkPublicMetaData({ bmList: newBmList });
    };
    const addBookmark = (id: string) => {
        updateBmList([...bmList, id]);
    };
    const removeBookmark = (id: string) => {
        updateBmList(bmList.filter((item) => item !== id));
    };

    return (
        <UserContext
            value={{
                favList,
                setFavList,
                addFavourite,
                removeFavourite,
                bmList,
                setBmList,
                addBookmark,
                removeBookmark,
            }}
        >
            {children}
        </UserContext>
    );
};

export default UserContextProvider;

export const useUserContext = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUserContext must be used within a SharedProvider");
    }
    return context;
};
