import { useNavigate } from "react-router-dom";
import { useProfileQuery } from "../hooks/useUserProfile";
import { useEffect } from "react";

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

  if (isLoading) return <p>Loading...</p>;

  return (
    <button onClick={() => loginWithGoogle()}>
      {"Continue with Google"}
    </button>
  );
}

export default LoginPage;
