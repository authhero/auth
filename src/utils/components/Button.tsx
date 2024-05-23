import type { FC } from "hono/jsx";
import cn from "classnames";
import Spinner from "./Spinner";

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
  isLoading?: boolean;
  id?: string;
};

const Button: FC<Props> = ({
  children,
  className,
  Component = "button",
  variant = "primary",
  href,
  disabled,
  isLoading,
  id,
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
      id={id}
      {...hrefProps}
    >
      <span
        className={`
      flex items-center justify-center space-x-2
      ${isLoading ? "opacity-0" : ""}
    `}
      >
        {children}
      </span>
      {isLoading && (
        <div className="absolute left-0 top-0 flex h-full w-full items-center justify-center">
          <Spinner size="medium" />
        </div>
      )}
    </Component>
  );
};

export default Button;
