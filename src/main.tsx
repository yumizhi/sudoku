import { createRoot } from "react-dom/client";
import App from "./app/App";
import "./styles.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root container not found.");
}

createRoot(rootElement).render(<App />);
