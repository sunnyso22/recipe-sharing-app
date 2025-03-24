const LoadingSpinner = () => {
    return (
        <div
            className="animate-spin rounded-full border-solid border-primary border-t-transparent h-12 w-12 border-4"
            role="status"
            aria-label="Loading"
        />
    );
};

export default LoadingSpinner;
