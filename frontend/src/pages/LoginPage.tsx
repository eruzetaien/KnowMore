import { useNavigate } from "react-router-dom";
import { useProfileQuery } from "../hooks/useUserProfile";
import { useEffect } from "react";

import loginButton from "../assets/buttons/login-button.svg";


function LoginPage() {
  const loginWithGoogle = () => {
    window.location.href = `${import.meta.env.VITE_AUTH_BASE_URL}/login/google`;
  };
  const { data: user, isLoading} = useProfileQuery();
  const navigate = useNavigate();
  useEffect(() => {
    if (user) {
      navigate("/profile");
    }
  }, [user]);

  return (
    <div className="w-screen h-screen flex justify-center items-center">
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <button
          className="hover:scale-105 cursor-pointer" 
          onClick={() => loginWithGoogle()}>
          <img src={loginButton} alt="Login with Google" />
        </button>
      )}
    </div>
    
  );
}

export default LoginPage;
