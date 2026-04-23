export function Header() {
    return(
        <header className="py-5 md:px-12 px-6 mb-4 flex items-center justify-between shadow-sm shadow-neutral-700">
            <div className="flex items-end gap-2">
                <i className="fa fa-file-pdf text-2xl"></i>
                <h1 className="font-semibold text-xl"> <span className="text-red-600">PDF </span>Monger</h1>
            </div>
            <i className="fa fa-circle-exclamation text-xl"></i>
        </header>
    );
}