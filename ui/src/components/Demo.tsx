import { Link } from "react-router-dom";

export default function Demo(): JSX.Element {
  return (
    <div className="Auth-form-container">
      <p className="text-right mt-2">
        <Link to={`/login?client_id=test&redirect_uri=${window.location.href}`}>
          Login
        </Link>
      </p>
    </div>
  );
}
