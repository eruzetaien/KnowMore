import { createBrowserRouter } from "react-router-dom";
import LoginPage from "../pages//LoginPage";
import ProfilePage from "../pages/ProfilPage";
import LobbyPage from "../pages/LobbyPage";
import RoomPage from "../pages/RoomPage";
import GamePage from "../pages/GamePage";

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
    {
        path: "/lobby",
        element: <LobbyPage />,
    },
    {
        path:'/room/:roomCode', 
        element: <RoomPage/>
    },
    {
        path: "/game/:roomCode",
        element: <GamePage />,
    },
]);
