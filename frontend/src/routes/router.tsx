import { createBrowserRouter } from "react-router-dom";
import LoginPage from "../pages//LoginPage";
import ProfilePage from "../pages/ProfilPage";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <LoginPage />,
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
