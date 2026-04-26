export function Header() {
  return (
    <header className="py-5 md:px-12 px-6 mb-4 flex items-center sticky top-0 shadow-sm shadow-neutral-700 z-[900] bg-default">
      <div className="flex items-center gap-2">
        <i className="fa fa-file-pdf text-2xl"></i>
        <h1 className="font-semibold text-xl">
          {" "}
          <span className="text-red-600">PDF </span>Craft
        </h1>
      </div>
      <div className=" ml-20">
       <NavBar/>
      </div>
      <i className="fa fa-circle-exclamation text-xl ml-auto"></i>
    </header>
  );
}

function NavBar() {
  return (
    <div className="flex gap-10 items-center font-semibold ">
      <span>Merge PDF</span>
      <span>Split PDF</span>
      <span>Convert to PDF</span>
      <span>Convert PDF to</span>
    </div>
  );
}
