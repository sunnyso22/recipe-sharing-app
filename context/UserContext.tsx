"use client";

import { updateClerkPublicMetaData } from "@/actions/action";
import React, { createContext, useContext, useState } from "react";

type UserContextType = {
    favList: string[];
    setFavList: React.Dispatch<React.SetStateAction<string[]>>;
    addFavourite: (id: string) => void;
    removeFavourite: (id: string) => void;
};

const UserContext = createContext<UserContextType | null>(null);

const UserContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [favList, setFavList] = useState<string[]>([]);

    const updateFavList = (newFavList: string[]) => {
        setFavList(newFavList);
        updateClerkPublicMetaData(newFavList);
    };

    const addFavourite = (id: string) => {
        updateFavList([...favList, id]);
    };

    const removeFavourite = (id: string) => {
        updateFavList(favList.filter((item) => item !== id));
    };

    return (
        <UserContext
            value={{ favList, setFavList, addFavourite, removeFavourite }}
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
