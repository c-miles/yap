import React from "react";

import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import App from "./App";
import ClerkProviderWithNavigate from "./auth/ClerkProviderWithNavigate";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ClerkProviderWithNavigate>
        <App />
      </ClerkProviderWithNavigate>
    </BrowserRouter>
  </React.StrictMode>
);
