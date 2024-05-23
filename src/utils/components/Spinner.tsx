import cn from "classnames";
import Icon from "./Icon";

type SpinnerSizes = "small" | "medium" | "large";

type Props = {
  size?: SpinnerSizes;
};

const getTailwindSize = (size: SpinnerSizes | undefined) => {
  if (size === "small") return "text-base";
  if (size === "medium") return "text-2xl";
  if (size === "large") return "text-3xl";

  return "";
};

const Spinner = ({ size }: Props) => {
  const tailwindSize = getTailwindSize(size);
  return (
    <div className="relative inline-block leading-[0]">
      <Icon
        className={cn(`text-gray-200 dark:text-[#201a41]`, {
          [tailwindSize]: tailwindSize,
        })}
        name="spinner-circle"
      />
      <Icon
        className={cn(`absolute inset-0 animate-spin text-primary`, {
          [tailwindSize]: tailwindSize,
        })}
        name="spinner-inner"
      />
    </div>
  );
};

export default Spinner;
