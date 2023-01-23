import { FormEvent, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
// import useAuth from "../hooks/Auth";

interface ChangeState {
  email?: string;
}

export default function ResetPassword(): JSX.Element {
  const [change, setChange] = useState<ChangeState>({});
  // const { login } = useAuth();
  const search = useLocation().search;
  // const redirectUri = new URLSearchParams(search).get("redirect_uri");
  // const navigate = useNavigate();

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    // const token = await login(change.email, change.password);
    // const redirectURL = new URL(redirectUri!);
    // redirectURL.searchParams.set("access_token", token.access_token);
    // navigate(redirectURL.href, { replace: true });
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
          <div className="d-grid gap-2 mt-3">
            <button
              type="submit"
              className="btn btn-primary"
              onClick={handleLogin}
            >
              Reset Password
            </button>
          </div>
          <p className="forgot-password text-right mt-2">
            <Link to={"/login"}>Already have an account?</Link>
          </p>
        </div>
      </form>
    </div>
  );
}
