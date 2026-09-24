import { Routes, Route } from "react-router-dom";

import Dashboard from "./components/Dashboard";
import DirectRoomJoin from "./components/DirectRoomJoin";
import LandingPage from "./components/LandingPage";
import NotFound from "./components/NotFound";
import PageShell from "./components/PageShell";
import PrivacyPolicy from "./components/PrivacyPolicy";
import Profile from "./components/Profile";
import RequireSignIn from "./components/RequireSignIn";
import TermsOfService from "./components/TermsOfService";

const App = () => (
  <Routes>
    <Route element={<PageShell />}>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<RequireSignIn><Dashboard /></RequireSignIn>} />
      <Route path="/profile" element={<RequireSignIn><Profile /></RequireSignIn>} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="*" element={<NotFound />} />
    </Route>
    <Route path="/room/:roomId" element={<DirectRoomJoin />} />
  </Routes>
);

export default App;
