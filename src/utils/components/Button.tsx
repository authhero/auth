import type { FC } from "hono/jsx";

/*
need to properly set all these

className={cn(
          "relative w-full rounded-lg text-center",
          {
            "px-4 py-5": variant !== "custom",
            "text-white": bgColor !== "primary" && textColor === "white",
            "text-black": bgColor !== "primary" && textColor === "black",
            "bg-primary text-textOnPrimary hover:bg-primaryHover":
              variant === "primary" && bgColor === "primary",
            "bg-[#1876D2] hover:bg-[#1876D2]/90":
              variant === "primary" && bgColor === "blue",
            "bg-[#EA4336] hover:bg-[#EA4336]/90":
              variant === "primary" && bgColor === "red",
            "bg-black hover:bg-black/90":
              variant === "primary" && bgColor === "black",
            "border border-gray-300 bg-white text-black":
              variant === "secondary",
            "pointer-events-none cursor-not-allowed opacity-40": disabled,
          },
          className,
        )}

        */

const Button: FC<{}> = ({ children }) => {
  return (
    <button
      class="relative w-full rounded-lg text-center px-4 py-5 bg-primary text-textOnPrimary hover:bg-primaryHover text-base sm:mt-4 md:text-base"
      type="submit"
    >
      <span class="flex items-center justify-center space-x-2">{children}</span>
    </button>
  );
};

export default Button;
