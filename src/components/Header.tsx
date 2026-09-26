import { NavLink, useNavigate } from "react-router-dom";

import { clearSession } from "../helpers/session.js";
import { useDBHandler } from "../hooks/useDBHandler.js";
import { db } from "../dexie.js";
import { PDF_MODE } from "../types/operation-types.js";

export function Header() {
  const navigate = useNavigate();
  const { clearDB } = useDBHandler();

  const handleClearSession = async () => {
    await db.files.clear();
    await clearSession();
    navigate("/");

    console.log(await db.files.toArray());
  };

  return (
    <header
      className="
        sticky top-0 z-[900]
        flex items-center
        w-full
        h-[72px]
        px-6 md:px-12
        bg-[#090909]/95
        backdrop-blur-md
        border-b border-neutral-800/80
      "
    >
      {/* Logo */}
      <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
        <div
          className="
            flex items-center justify-center
            w-9 h-9
            rounded-lg
            bg-red-500/10
            ring-1 ring-red-500/10
          "
        >
          <i className="fa fa-file-pdf text-lg text-red-500" />
        </div>

        <h1 className="text-lg font-semibold tracking-tight text-white">
          <span className="text-red-500">PDF</span>Craft
        </h1>
      </NavLink>

      {/* Navigation */}
      <div className="hidden md:block ml-16">
        <NavBar />
      </div>

      {/* Clear session */}
      <button
        type="button"
        title="Clear session"
        aria-label="Clear session"
        onClick={handleClearSession}
        className="
          ml-auto
          flex items-center justify-center
          w-9 h-9
          rounded-lg
          text-neutral-500
          border border-neutral-800
          bg-[#111111]
          transition-all duration-200

          hover:text-red-500
          hover:border-red-500/30
          hover:bg-red-500/10

          focus:outline-none
          focus:ring-2
          focus:ring-red-500/50
        "
      >
        <i className="fa fa-refresh text-sm" />
      </button>
    </header>
  );
}

function NavBar() {
  const navItems = [
    {
      label: "Merge PDF",
      path: `/upload/${PDF_MODE.MERGE}`,
    },
    {
      label: "Split PDF",
      path: `/upload/${PDF_MODE.SPLIT}`,
    },
    {
      label: "Image to PDF",
      path: `/upload/${PDF_MODE.IMAGE_TO_PDF}`,
    },
      {
      label: "Edit PDF",
      path: `/upload/${PDF_MODE.EDIT_PDF}`,
    },
  ];

  return (
    <nav className="flex items-center gap-2">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `
              rounded-lg
              px-3.5 py-2
              text-sm
              font-medium
              transition-all duration-200

              ${
                isActive
                  ? "bg-neutral-800 text-white"
                  : "text-neutral-500 hover:bg-neutral-900 hover:text-neutral-200"
              }
            `
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
