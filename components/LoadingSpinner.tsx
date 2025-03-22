const LoadingSpinner = () => {
    return (
        <div className="h-[50vh] flex items-center justify-center">
            <div
                className="animate-spin rounded-full border-solid border-primary border-t-transparent h-12 w-12 border-4"
                role="status"
                aria-label="Loading"
            />
        </div>
    );
};

export default LoadingSpinner;
