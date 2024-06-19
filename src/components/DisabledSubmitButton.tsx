import Button from "./Button";
import cn from "classnames";
import { PropsWithChildren } from "hono/jsx";

type Props = {
  className?: string;
};

const DisabledSubmitButton = ({
  children,
  className,
}: PropsWithChildren<Props>) => {
  return (
    <>
      <Button className={className} id="initial-btn">
        {children}
      </Button>
      <Button
        className={cn(className, "hidden")}
        isLoading
        id="loading-btn"
        disabled
      >
        &nbsp;
      </Button>
    </>
  );
};

export default DisabledSubmitButton;
