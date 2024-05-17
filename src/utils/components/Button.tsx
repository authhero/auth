import type { FC } from "hono/jsx";
import cn from "classnames";

type Props = {
  children: (string | JSX.Element)[] | string | JSX.Element;
  className?: string;
  Component?: string;
  variant?: "primary" | "secondary";
};

const Button: FC<Props> = ({
  children,
  className,
  Component = "button",
  variant = "primary",
}) => {
  return (
    <Component
      class={cn("relative w-full rounded-lg text-center px-4 py-5", className, {
        "bg-primary text-textOnPrimary hover:bg-primaryHover":
          variant === "primary",
        "border border-gray-300 bg-white text-black": variant === "secondary",
      })}
      type="submit"
    >
      <span class="flex items-center justify-center space-x-2">{children}</span>
    </Component>
  );
};

export default Button;
