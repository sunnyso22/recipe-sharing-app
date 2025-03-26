import { SignIn } from "@clerk/nextjs";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign In",
};

const SignInPage = () => {
    return (
        <div className="h-[70vh] flex items-center justify-center">
            <SignIn />
        </div>
    );
};

export default SignInPage;
