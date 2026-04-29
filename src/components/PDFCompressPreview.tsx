import { useState, type Dispatch, type SetStateAction } from "react";
import type { UploadedFile } from "../types/itemTypes.js";
import { BasePreviewCards } from "./SortableCard.js";

export type CompressionDegree = "Low" | "High" | "Medium";

export function PDFCompressPreviewPage({
  file,
}: {
  file: UploadedFile | undefined;
}) {
  const [degree, setDegree] = useState<CompressionDegree>("Medium");

  return (
    <div className="grid md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_380px] gap-10 h-full py-3">
      <div className="pt-1 ">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">Compress PDF</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Use page numbers like 1-3, 4-6, 8-8
            </p>
          </div>

          <button
            type="button"
            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white text-nowrap"
          >
            Compress
          </button>
        </div>{" "}
        <div className="w-full flex justify-center mt-24">
          <BasePreviewCards label={file?.name || ""} type={"image"} />
        </div>
      </div>
      <div className="w-full bg-neutral-800 rounded-2xl flex flex-col gap-8 items-center py-8 px-6">
        <div>
          <h2 className="font-semibold text-lg mb-1">Compression Degree</h2>
          <div className="w-12 h-1 bg-red-600 rounded-lg"></div>
        </div>
        <div className="w-full space-y-3">
          <QualityDesc label="Low" desc="High Quality" id="Low" degree={degree}  setDegree={setDegree}/>
          <QualityDesc label="Medium" desc="Moderate" id="Medium" degree={degree} setDegree={setDegree} />
          <QualityDesc label="High" desc="Low Quality" id="High" degree={degree} setDegree={setDegree} />
        </div>
      </div>
    </div>
  );

 
}

 function QualityDesc({
    label,
    desc,
    id,
    setDegree,
    degree
  }: {
    label: string;
    desc: string;
    id: CompressionDegree;
    degree:CompressionDegree;
    setDegree:Dispatch<SetStateAction<CompressionDegree>>
  }) {
    return (
      <div
        onClick={() => {
          setDegree(id);
        }}
        className={`flex flex-col items-center ${degree === id? "bg-red-600":"bg-neutral-700"} w-full rounded-full py-4`}
      >
        <button className="text-xl font-semibold tracking-wider">
          {label}
        </button>
        <span className="text-xs opacity-50">{desc}</span>
      </div>
    );
  }
