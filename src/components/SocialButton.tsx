import cn from "classnames";
import Button from "./Button";
import { UniversalLoginSession } from "@authhero/adapter-interfaces";

type Props = {
  connection: "google-oauth2" | "apple" | "facebook" | "vipps";
  // TODO - what is the correct type here in hono/jsx? OR use a children prop
  icon: any;
  text: string;
  canResize?: boolean;
  session: UniversalLoginSession;
};

const SocialButton = ({
  connection,
  text,
  icon = null,
  canResize = false,
  session,
}: Props) => {
  const queryString = new URLSearchParams({
    client_id: session.authParams.client_id,
    connection,
  });
  if (session.authParams.response_type) {
    queryString.set("response_type", session.authParams.response_type);
  }
  if (session.authParams.redirect_uri) {
    queryString.set("redirect_uri", session.authParams.redirect_uri);
  }
  if (session.authParams.scope) {
    queryString.set("scope", session.authParams.scope);
  }
  if (session.authParams.nonce) {
    queryString.set("nonce", session.authParams.nonce);
  }
  if (session.authParams.response_type) {
    queryString.set("response_type", session.authParams.response_type);
  }
  if (session.authParams.state) {
    queryString.set("state", session.authParams.state);
  }
  const href = `/authorize?${queryString.toString()}`;

  return (
    <Button
      className={cn(
        "border border-gray-200 bg-white hover:bg-gray-100 dark:border-gray-400 dark:bg-black dark:hover:bg-black/90",
        {
          ["px-0 py-3 sm:px-10 sm:py-4 short:px-0 short:py-3"]: canResize,
          ["px-10 py-3"]: !canResize,
        },
      )}
      variant="custom"
      aria-label={text}
      Component="a"
      href={href}
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
