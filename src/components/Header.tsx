import { NavLink, useNavigate } from "react-router-dom";
import { clearSession, getSessionId } from "../helpers/session.js";
import { useDBHandler } from "../hooks/useDBHandler.js";
import { db } from "../dexie.js";
import { PDF_MODE } from "../types/operation-types.js";

export function Header() {
  const navigate = useNavigate();
  const { clearDB } = useDBHandler();
  return (
    <header className="py-5 md:px-12 px-6 mb-4 flex items-center sticky top-0 shadow-sm shadow-neutral-700 z-[900] bg-default">
      <div className="flex items-center gap-2">
        <i className="fa fa-file-pdf text-2xl"></i>
        <h1 className="font-semibold text-xl">
          {" "}
          <span className="text-red-600">PDF</span>Craft
        </h1>
      </div>
      <div className=" ml-20 hidden md:block">
        <NavBar />
      </div>
      <button
        title="Clear session"
        onClick={async () => {
          await db.files.clear();
          await clearSession();
          navigate("/");

          console.log(await db.files.toArray());
        }}
        className="fa fa-refresh text-lg ml-auto bg-red-600 p-1 text-white rounded-lg px-3"
      ></button>
    </header>
  );
}

function NavBar() {
  return (
    <div className="flex gap-8 items-center font-semibold text-nowrap">
      <NavLink to={`/upload/${PDF_MODE.MERGE}`}>Merge PDF</NavLink>
      <NavLink to={`/upload/${PDF_MODE.SPLIT}`}>Split PDF</NavLink>
      <NavLink to={`/upload/${PDF_MODE.IMAGE_TO_PDF}`}>Image to PDF</NavLink>
    </div>
  );
}
