import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-workspace">
        <Navbar onMenu={() => setSidebarOpen(true)} />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
