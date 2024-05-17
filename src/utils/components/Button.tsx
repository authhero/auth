import type { FC } from "hono/jsx";
import cn from "classnames";

type Props = {
  children: (string | JSX.Element)[] | string | JSX.Element;
  className?: string;
  Component?: string;
  variant?: "primary" | "secondary";
  // in Nextjs & React we use default DOM element types...
  href?: string;
};

const Button: FC<Props> = ({
  children,
  className,
  Component = "button",
  variant = "primary",
  href,
}) => {
  const hrefProps = Component === "a" ? { href } : {};
  return (
    <Component
      class={cn("relative w-full rounded-lg text-center px-4 py-5", className, {
        "bg-primary text-textOnPrimary hover:bg-primaryHover":
          variant === "primary",
        "border border-gray-300 bg-white text-black": variant === "secondary",
      })}
      type="submit"
      {...hrefProps}
    >
      <span class="flex items-center justify-center space-x-2">{children}</span>
    </Component>
  );
};

export default Button;
