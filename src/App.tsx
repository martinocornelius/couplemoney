import { Route, Routes } from "react-router";
import AppLayout from "./components/AppLayout.tsx";
import { PublicLayout } from "./components/Screen.tsx";
import LandingScreen from "./screens/LandingScreen.tsx";
import SignUpScreen from "./screens/SignUpScreen.tsx";
import LogInScreen from "./screens/LogInScreen.tsx";
import SetupHomeScreen from "./screens/SetupHomeScreen.tsx";
import JoinScreen from "./screens/JoinScreen.tsx";
import HomeScreen from "./screens/HomeScreen.tsx";
import TransactionFormScreen from "./screens/TransactionFormScreen.tsx";
import PocketsScreen from "./screens/PocketsScreen.tsx";
import PocketFormScreen from "./screens/PocketFormScreen.tsx";
import DebtsScreen from "./screens/DebtsScreen.tsx";
import DebtFormScreen from "./screens/DebtFormScreen.tsx";
import SettingsScreen from "./screens/SettingsScreen.tsx";
import RecurringScreen from "./screens/RecurringScreen.tsx";
import SummaryScreen from "./screens/SummaryScreen.tsx";
import AdminScreen from "./screens/AdminScreen.tsx";
import CategoriesScreen from "./screens/CategoriesScreen.tsx";
import NotFoundScreen from "./screens/NotFoundScreen.tsx";

export default function App() {
  return (
    <Routes>
      {/* Screens 1-5: before you're in a home, no tab bar */}
      <Route element={<PublicLayout />}>
        <Route path="/welcome" element={<LandingScreen />} />
        <Route path="/signup" element={<SignUpScreen />} />
        <Route path="/login" element={<LogInScreen />} />
        <Route path="/setup" element={<SetupHomeScreen />} />
        <Route path="/join/:code" element={<JoinScreen />} />
      </Route>

      {/* Screens 6-16: inside a home, with the bottom tab bar */}
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
        <Route path="recurring" element={<RecurringScreen />} />
        <Route path="summary" element={<SummaryScreen />} />
        <Route path="admin" element={<AdminScreen />} />
        <Route path="categories" element={<CategoriesScreen />} />
        <Route path="*" element={<NotFoundScreen />} />
      </Route>
    </Routes>
  );
}
