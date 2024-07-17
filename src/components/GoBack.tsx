import i18next from "i18next";

type Props = {
  state: string;
};

export const GoBack = (props: Props) => {
  return (
    <a
      className="block text-primary hover:text-primaryHover text-center"
      href={`/u/enter-email?state=${props.state}`}
    >
      {i18next.t("go_back")}
    </a>
  );
};
