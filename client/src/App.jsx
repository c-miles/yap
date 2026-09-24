import { Routes, Route, useLocation } from "react-router-dom";

import Dashboard from "./components/Dashboard";
import DirectRoomJoin from "./components/DirectRoomJoin";
import LandingPage from "./components/LandingPage";
import NotFound from "./components/NotFound";
import Navbar from "./components/Navbar";
import PrivacyPolicy from "./components/PrivacyPolicy";
import Profile from "./components/Profile";
import RequireSignIn from "./components/RequireSignIn";
import TermsOfService from "./components/TermsOfService";

const App = () => {
  const location = useLocation();
  const showNavbar = location.pathname !== "/" && !location.pathname.startsWith("/room/");

  return (
    <>
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<RequireSignIn><Dashboard /></RequireSignIn>} />
        <Route path="/profile" element={<RequireSignIn><Profile /></RequireSignIn>} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/room/:roomId" element={<DirectRoomJoin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default App;
