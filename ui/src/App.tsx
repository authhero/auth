import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import { AuthProvider } from "./hooks/Auth";
import ResetPassword from "./components/ResetPassword";
import Signup from "./components/Signup";
import Demo from "./components/Demo";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/u">
        <Routes>
          <Route path="/" element={<Demo />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
