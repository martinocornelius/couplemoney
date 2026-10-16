import { Route, Routes } from "react-router";
import AppLayout from "./components/AppLayout.tsx";
import WelcomeScreen from "./screens/WelcomeScreen.tsx";
import JoinScreen from "./screens/JoinScreen.tsx";
import HomeScreen from "./screens/HomeScreen.tsx";
import TransactionFormScreen from "./screens/TransactionFormScreen.tsx";
import PocketsScreen from "./screens/PocketsScreen.tsx";
import PocketFormScreen from "./screens/PocketFormScreen.tsx";
import DebtsScreen from "./screens/DebtsScreen.tsx";
import DebtFormScreen from "./screens/DebtFormScreen.tsx";
import SettingsScreen from "./screens/SettingsScreen.tsx";
import NotFoundScreen from "./screens/NotFoundScreen.tsx";

export default function App() {
  return (
    <Routes>
      {/* Screens 1-2: before joining a home, no tab bar */}
      <Route path="/welcome" element={<WelcomeScreen />} />
      <Route path="/join/:code" element={<JoinScreen />} />

      {/* Screens 3-9: inside a home, with the bottom tab bar */}
      <Route element={<AppLayout />}>
        <Route index element={<HomeScreen />} />
        <Route path="transactions/new" element={<TransactionFormScreen />} />
        <Route path="transactions/:id/edit" element={<TransactionFormScreen />} />
        <Route path="pockets" element={<PocketsScreen />} />
        <Route path="pockets/new" element={<PocketFormScreen />} />
        <Route path="pockets/:id/edit" element={<PocketFormScreen />} />
        <Route path="debts" element={<DebtsScreen />} />
        <Route path="debts/new" element={<DebtFormScreen />} />
        <Route path="debts/:id/edit" element={<DebtFormScreen />} />
        <Route path="settings" element={<SettingsScreen />} />
        <Route path="*" element={<NotFoundScreen />} />
      </Route>
    </Routes>
  );
}
