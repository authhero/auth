import type { FC } from "hono/jsx";
import cn from "classnames";

type Props = {
  children: (string | JSX.Element)[];
  // TODO - used on another PR
  className?: string;
};

const Button: FC<Props> = ({ children }) => {
  return (
    <button
      class={cn(
        "relative w-full rounded-lg text-center px-4 py-5 bg-primary text-textOnPrimary hover:bg-primaryHover",
        className,
      )}
      type="submit"
    >
      <span class="flex items-center justify-center space-x-2">{children}</span>
    </button>
  );
};

export default Button;
