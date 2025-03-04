import { SignIn } from "@clerk/nextjs";

const SignInPage = () => {
    return (
        <div className="h-[70vh] flex items-center justify-center">
            <SignIn />
        </div>
    );
};

export default SignInPage;
