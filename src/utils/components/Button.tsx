import type { FC } from "hono/jsx";
import cn from "classnames";

// in React we would do
// interface Props extends ButtonHTMLAttributes<HTMLButtonElement>
// to get all the DOM attributes of a button
type Props = {
  children: (string | JSX.Element)[] | string | JSX.Element;
  className?: string;
  Component?: string;
  variant?: "primary" | "secondary";
  // in Nextjs & React we use default DOM element types...
  href?: string;
  disabled?: boolean;
};

const Button: FC<Props> = ({
  children,
  className,
  Component = "button",
  variant = "primary",
  href,
  disabled,
}) => {
  const hrefProps = Component === "a" ? { href } : {};
  return (
    <Component
      class={cn("relative w-full rounded-lg text-center px-4 py-5", className, {
        "bg-primary text-textOnPrimary hover:bg-primaryHover":
          variant === "primary",
        "border border-gray-300 bg-white text-black": variant === "secondary",
        "pointer-events-none cursor-not-allowed opacity-40": disabled,
      })}
      type="submit"
      disabled={disabled}
      {...hrefProps}
    >
      <span class="flex items-center justify-center space-x-2">{children}</span>
    </Component>
  );
};

export default Button;
