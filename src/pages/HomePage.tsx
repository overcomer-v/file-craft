import type { ComponentPropsWithoutRef } from "react";
import { useNavigate } from "react-router-dom";
import { PDF_MODE } from "../types/operation-types.js";

export function HomePage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col h-full items-center w-full pb-12">
      <div className=" flex-col flex md:gap-3 gap-1 text-center w-full mt-24">
        <p className="md:text-8xl text-5xl">
          Your All in One <span className="text-red-600 font-semibold">PDF </span>
          toolkit
        </p>
        <p className="md:text-6xl text-2xl md:mt-3 font-thin">
          Fast. Simple. Secure
        </p>
      </div>

      <section className="mt-24 grid md:grid-cols-2 gap-12 ">
        <ServiceCard
        onClick={()=>{
          navigate(`/upload/${PDF_MODE.IMAGE_TO_PDF}`);
        }}
          title="Image to PDF"
          messageText="Convert images into a single PDF with reordering options"
        />

        <ServiceCard
         onClick={()=>{
          navigate(`/upload/${PDF_MODE.SPLIT}`);
        }}
          title="Split PDF"
          messageText="Split a PDF into multiple files or extract specific pages"
        />

        <ServiceCard
         onClick={()=>{
          navigate(`/upload/${PDF_MODE.MERGE}`);
        }}
          title="Merge PDF"
          messageText="Combine multiple PDFs into one and arrange pages easily"
        />
         <ServiceCard
         onClick={()=>{
          navigate(`/upload/${PDF_MODE.COMPRESS}`);
        }}
          title="Compress PDF"
          messageText="Reduce PDF file size while preserving quality"
        />
      </section>
    </div>
  );
}

type ServiceCardProps = ComponentPropsWithoutRef<"div"> & {
  title: string;
  iconlabel?: string;
  messageText: string;
};

function ServiceCard({
  title,
  iconlabel = "fa-file-pdf",
  messageText,
  className = "",
  ...rest
}: ServiceCardProps) {
  return (
    <div
      className={`flex flex-col gap-1 justify-center items-center border-2 cursor-pointer hover:bg-neutral-800 border-neutral-600 rounded-2xl w-[250px] h-[250px] px-8 ${className}`}
      {...rest}
    >
      <i className={`fa ${iconlabel} text-4xl text-red-600`}></i>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-center opacity-50">{messageText}</p>
    </div>
  );
}

