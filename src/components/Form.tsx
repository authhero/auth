import classNames from "classnames";
import { PropsWithChildren } from "hono/jsx";

type Props = {
  className?: string;
};

const Form = ({ children, className }: PropsWithChildren<Props>) => {
  return (
    <form id="form" method="post" class={className}>
      {children}
    </form>
  );
};

export default Form;
