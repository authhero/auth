import type { FC } from "hono/jsx";

const Button: FC<{}> = ({ children }) => {
  return (
    <button
      class="relative w-full rounded-lg text-center px-4 py-5 bg-primary text-textOnPrimary hover:bg-primaryHover"
      type="submit"
    >
      <span class="flex items-center justify-center space-x-2">{children}</span>
    </button>
  );
};

export default Button;
