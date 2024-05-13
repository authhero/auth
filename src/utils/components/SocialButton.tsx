import cn from "classnames";
import Button from "./Button";

type Props = {
  social: string;
  icon: JSX.Element | null;
  text: string;
  canResize?: boolean;
};

const SocialButton = ({
  social,
  text,
  icon = null,
  canResize = false,
}: Props) => {
  return (
    <Button
      className={cn(
        "border border-gray-200 bg-white hover:bg-gray-100 dark:border-gray-400 dark:bg-black dark:hover:bg-black/90",
        {
          ["px-0 py-3 sm:px-10 sm:py-4 short:px-0 short:py-3"]: canResize,
          ["px-10 py-3"]: !canResize,
        },
      )}
      //   variant="custom"
      aria-label={text}
    >
      {icon || ""}
      <div
        className={cn("text-left text-black dark:text-white sm:text-base", {
          ["hidden sm:inline short:hidden"]: canResize,
        })}
      >
        {text}
      </div>
    </Button>
  );
};

export default SocialButton;
