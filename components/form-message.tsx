const FormMessage = ({
  message,
  status,
}: {
  message: string;
  status: "idle" | "error" | "success";
}) => {
  if (!message) {
    return null;
  }

  return (
    <p
      role={status === "error" ? "alert" : "status"}
      className={
        status === "error"
          ? "text-sm text-destructive"
          : "text-sm text-muted-foreground"
      }
    >
      {message}
    </p>
  );
};

export { FormMessage };
