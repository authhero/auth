import cn from "classnames";

type IconSizes = "small" | "medium" | "large";

type Props = {
  name: string;
  size?: IconSizes;
  className?: string;
};

const getTailwindSize = (size: IconSizes | undefined) => {
  if (size === "small") return "text-base";
  if (size === "medium") return "text-2xl";
  if (size === "large") return "text-3xl";

  return "";
};

const Icon = ({ name, size, className = "" }: Props) => {
  const tailwindSize = getTailwindSize(size);

  return (
    <span
      className={cn(`uicon-${name}`, {
        [className]: className,
        [tailwindSize]: tailwindSize,
      })}
    />
  );
};

export default Icon;
