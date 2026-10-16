import { Outlet } from "react-router";
import BottomTabBar from "./BottomTabBar.tsx";

/** Phone-width column with the screen on top and the tab bar pinned below. */
export default function AppLayout() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-white shadow-sm">
      <main className="flex-1 pb-24">
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  );
}
