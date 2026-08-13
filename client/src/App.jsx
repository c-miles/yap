import { Routes, Route, useLocation } from "react-router-dom";

import Dashboard from "./components/Dashboard";
import DirectRoomJoin from "./components/DirectRoomJoin";
import LandingPage from "./components/LandingPage";
import Navbar from "./components/Navbar";
import Profile from "./components/Profile";

const App = () => {
  const location = useLocation();
  const showNavbar = location.pathname !== "/" && !location.pathname.startsWith("/room/");

  return (
    <>
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/room/:roomId" element={<DirectRoomJoin />} />
      </Routes>
    </>
  );
};

export default App;
