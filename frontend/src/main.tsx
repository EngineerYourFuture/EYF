import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { SplashScreen } from "./components/SplashScreen";
import "./index.css";

// Force dark mode always
document.documentElement.classList.add('dark');

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <SplashScreen>
        <App />
      </SplashScreen>
    </BrowserRouter>
  </StrictMode>
);
