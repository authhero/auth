import Button from "./Button";
import cn from "classnames";

type Props = {
  children: (string | JSX.Element)[] | string | JSX.Element;
  className?: string;
};

const DisabledSubmitButton = ({ children, className }: Props) => {
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
        {children}
      </Button>
    </>
  );
};

export default DisabledSubmitButton;
