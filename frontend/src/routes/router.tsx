import { createBrowserRouter } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import ProfilePage from "../pages/ProfilPage";
import RoomPage from "../pages/RoomPage";
import GamePage from "../pages/GamePage";
import LobbyPage from "../pages/LobbyPage";
import FactPage from "../pages/FactPage";

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
        path: "/fact",
        element: <FactPage />,
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
