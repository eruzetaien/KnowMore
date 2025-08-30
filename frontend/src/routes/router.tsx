import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import LoginPage from "../pages//LoginPage";
import ProfilePage from "../pages/ProfilPage";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
    },
    {
        path: "/login",
        element: <LoginPage />,
    },
    {
        path: "/profile",
        element: <ProfilePage />,
    },
]);
