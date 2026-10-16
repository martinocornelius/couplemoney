import { Link, NavLink } from "react-router";

const tabs = [
  { to: "/", label: "Home", icon: "🏠", end: true },
  { to: "/pockets", label: "Pockets", icon: "👛", end: false },
  { to: "/debts", label: "Payables", icon: "🧾", end: false },
  { to: "/settings", label: "Settings", icon: "⚙️", end: false },
];

function Tab({ to, label, icon, end }: (typeof tabs)[number]) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
          isActive ? "text-brand-700" : "text-slate-500"
        }`
      }
    >
      <span aria-hidden className="text-xl leading-none">
        {icon}
      </span>
      {label}
    </NavLink>
  );
}

export default function BottomTabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md items-center">
        <Tab {...tabs[0]} />
        <Tab {...tabs[1]} />
        <div className="flex flex-1 justify-center">
          <Link
            to="/transactions/new"
            aria-label="Add transaction"
            className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand-700 text-3xl text-white shadow-lg active:bg-brand-600"
          >
            +
          </Link>
        </div>
        <Tab {...tabs[2]} />
        <Tab {...tabs[3]} />
      </div>
    </nav>
  );
}
