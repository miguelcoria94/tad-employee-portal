import { Outlet } from "react-router-dom";
import { Topbar } from "./topbar";
import { Footer } from "./footer";
import { AssistantProvider } from "@/components/assistant/assistant-context";
import { AssistantDrawer } from "@/components/assistant/assistant-drawer";

export function AppShell() {
  return (
    <AssistantProvider>
      <div className="flex min-h-screen flex-col">
        <Topbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
      <AssistantDrawer />
    </AssistantProvider>
  );
}
