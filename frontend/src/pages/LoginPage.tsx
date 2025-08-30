
function LoginPage() {
  const loginWithGoogle = () => {
    window.location.href = `${import.meta.env.VITE_AUTH_BASE_URL}/login/google`;
  };

  return (
    <button onClick={() => loginWithGoogle()}>
      {"Continue with Google"}
    </button>
  );
}

export default LoginPage;
