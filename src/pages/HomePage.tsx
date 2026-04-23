import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFileHandler } from "../hooks/useFileHandler.js";
import { useDBHandler } from "../hooks/useDBHandler.js";

export function HomePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const navigate = useNavigate();
  const { uploadFiles } = useDBHandler();
  async function handleUpload() {
    try {
      await uploadFiles(files);
      navigate("/upload-preview");
    } catch (error) {
      alert(error);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center ">
      <div className=" md:mt-16 mt-24 flex flex-col items-center ">
        {" "}
        <div className=" flex-col flex md:gap-3 gap-1 text-center">
          <p className="md:text-8xl text-5xl">
            Create <span className="text-red-600 font-semibold">PDFs</span>
          </p>
          <p className="md:text-6xl text-2xl md:mt-3 font-thin">
            Fast. Simple. Secure
          </p>
        </div>
        <input
          type="file"
          multiple
          ref={inputRef}
          className="hidden"
          onChange={(e) => {
            console.log("e:", e);
            setFiles([...(e.target.files ?? [])]);
          }}
        />
        <div className="flex flex-col justify-center items-center text-center md:h-[9.0rem] h-[8.0rem] md:px-16 px-10 relative border-dashed border-[2px] rounded-xl md:mt-16 mt-10 border-neutral-700">
          {files.length > 0 && (
            <div className="text-sm absolute md:top-4 top-3 font-semibold w-full">
              <p>{`${files.length} files selected`}</p>
            </div>
          )}
          <button
            onClick={async () => {
              if (files.length > 0) {
                console.log("clicked");
                handleUpload();
              } else {
                inputRef.current?.click();
              }
            }}
            className="md:py-4 md:px-8 py-3 px-6 text-black font-semibold bg-neutral-50  rounded-lg "
          >
            <span className="text-sm font-semibold">
              {files.length > 0 ? "Upload files" : "Select Files"}
            </span>{" "}
            <i className="fa fa-cloud-upload text-red-600"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
