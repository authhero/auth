import type { FC } from "hono/jsx";
import cn from "classnames";

type Props = {
  children: JSX.Element[] | JSX.Element | string | string[];
  className?: string;
};

const Button: FC<Props> = ({ children, className }) => {
  return (
    <button
      // TODO - use this here
      class="relative w-full rounded-lg text-center px-4 py-5 bg-primary text-textOnPrimary hover:bg-primaryHover"
      type="submit"
    >
      <span class="flex items-center justify-center space-x-2">{children}</span>
    </button>
  );
};

export default Button;
