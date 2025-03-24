import LoadingSpinner from "@/components/LoadingSpinner";

const loading = () => {
    return (
        <div className="h-screen flex items-center justify-center">
            <LoadingSpinner />
        </div>
    );
};

export default loading;
