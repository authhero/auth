import * as React from "react";

const authUrl = "https://cloudworker-auth.sesamy-dev.workers.dev";

const authContext = React.createContext();

function useAuth() {
  const [authed, setAuthed] = React.useState(localStorage.getItem("token"));

  async function login(email, password) {
    const response = await fetch(`${authUrl}/oauth/token`, {
      method: "POST",
      body: JSON.stringify({
        grant_type: "password",
        client_id: "default",
        username: email,
        password,
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to login");
    }
    const body = await response.json();

    setAuthed(body.access_token);
    localStorage.setItem("token", body.access_token);

    return body;
  }

  async function signup(email, password) {
    const response = await fetch(`${authUrl}/dbconnection/register`, {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to login");
    }
    return response.json();
  }

  function logout() {
    localStorage.removeItem("token");
    setAuthed(null);
  }

  return {
    authed,
    login,
    logout,
    signup,
  };
}

export function AuthProvider({ children }) {
  const auth = useAuth();

  return <authContext.Provider value={auth}>{children}</authContext.Provider>;
}

export default function AuthConsumer() {
  return React.useContext(authContext);
}
