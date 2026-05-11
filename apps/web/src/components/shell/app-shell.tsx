import { Outlet } from "react-router-dom";
import { Topbar } from "./topbar";
import { Footer } from "./footer";

export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}