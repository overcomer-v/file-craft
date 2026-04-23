import { useParams, useSearchParams } from "react-router-dom";

export function DownloadPage() {

    const [params] = useSearchParams();
  const url = params.get("url") || "";

    console.log(url);

    const onDownload = ()=>{
        window.open(url);
    }

    return(
        <div className="w-full h-screen relative">
            <button onClick={onDownload} className="absolute left-1/2 top-1/3 bg-white rounded-md px-5 py-2 text-black drop-shadow-md">
            Download
            </button>
        </div>
    );
}