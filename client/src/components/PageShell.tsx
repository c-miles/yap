import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import WaveBackground from "./WaveBackground/WaveBackground";
import Navbar from "./Navbar";
import Footer from "./Footer";

// used as a layout route, so the waves stay mounted (and don't jump) between pages
const PageShell: React.FC<{ chrome?: boolean; children?: React.ReactNode }> = ({ chrome, children }) => {
  const { pathname } = useLocation();
  const showChrome = chrome ?? pathname !== "/";

  return (
    <div className="relative isolate min-h-screen flex flex-col">
      <div className="fixed inset-0 -z-10">
        <WaveBackground />
      </div>
      {showChrome && <Navbar />}
      <main className="flex-1 flex flex-col px-4 py-10">{children ?? <Outlet />}</main>
      {showChrome && <Footer />}
    </div>
  );
};

export default PageShell;
