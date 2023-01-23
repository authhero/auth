import { FormEvent, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import useAuth from "../hooks/Auth";

interface ChangeState {
  password?: string;
  email?: string;
}

export default function Login(): JSX.Element {
  const [change, setChange] = useState<ChangeState>({});
  const { login } = useAuth();
  const search = useLocation().search;
  const redirectUri = new URLSearchParams(search).get("redirect_uri");

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    const token = await login(change.email, change.password);
    const redirectURL = new URL(redirectUri!);
    redirectURL.searchParams.set("access_token", token.access_token);
    window.location.href = redirectURL.href;
  };

  const handleChange = (event: any) => {
    setChange({
      ...change,
      [event.target.name]: event.target.value,
    });
  };

  return (
    <div className="Auth-form-container">
      <form className="Auth-form" onSubmit={handleLogin}>
        <div className="Auth-form-content">
          <h3 className="Auth-form-title">Sign In</h3>
          <div className="form-group mt-3">
            <label>Email address</label>
            <input
              type="email"
              name="email"
              className="form-control mt-1"
              onChange={handleChange}
              placeholder="Enter email"
            />
          </div>
          <div className="form-group mt-3">
            <label>Password</label>
            <input
              type="password"
              name="password"
              onChange={handleChange}
              className="form-control mt-1"
              placeholder="Enter password"
            />
            <p className="forgot-password text-right mt-2">
              <Link to={"/u/reset-password"}>Forgot password?</Link>
            </p>
          </div>
          <div className="d-grid gap-2 mt-3">
            <button
              type="submit"
              className="btn btn-primary"
              onClick={handleLogin}
            >
              Login
            </button>
          </div>
          <p className="forgot-password text-right mt-2">
            Don't you have an account?{" "}
            <Link to={"/signup"}>Register account</Link>
          </p>
        </div>
      </form>
    </div>
  );
}
