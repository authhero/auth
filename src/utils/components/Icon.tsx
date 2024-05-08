import cn from "classnames";

type IconSizes = "small" | "medium" | "large";

type Props = {
  name: string;
  size?: IconSizes;
  // still need to call prop className because class is a reserved keyword
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

  return <span class={cn(`uicon-${name}`, className, tailwindSize)} />;
};

export default Icon;
