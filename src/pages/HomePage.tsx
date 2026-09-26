import type { ComponentPropsWithoutRef } from "react";
import { useNavigate } from "react-router-dom";
import { PDF_MODE } from "../types/operation-types.js";

export function HomePage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-full w-full bg-default text-white">
      {/* Hero */}
      <section className="mx-auto flex max-w-5xl flex-col items-center px-6 pt-12 text-center md:pt-28">
        <span className="mb-6 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-red-500">
          PDF Tools
        </span>

        <h1 className="max-w-4xl text-5xl font-semibold tracking-tight md:text-7xl">
          Your all-in-one <span className="text-red-500">PDF</span> toolkit
        </h1>

        <p className="mt-5 max-w-xl text-base leading-7 text-neutral-400 md:text-lg">
          Fast, simple and secure tools to manage your PDF files with ease.
        </p>
      </section>

      {/* Tools */}
      <section className="mx-auto mt-16 grid w-full max-w-5xl grid-cols-1 gap-5 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        <ServiceCard
          onClick={() => navigate(`/upload/${PDF_MODE.IMAGE_TO_PDF}`)}
          title="Image to PDF"
          messageText="Convert images into a single PDF and arrange them in any order."
          iconlabel="fa-file-image"
        />

        <ServiceCard
          onClick={() => navigate(`/upload/${PDF_MODE.SPLIT}`)}
          title="Split PDF"
          messageText="Split a PDF into multiple files or extract only the pages you need."
          iconlabel="fa-scissors"
        />

        <ServiceCard
          onClick={() => navigate(`/upload/${PDF_MODE.MERGE}`)}
          title="Merge PDF"
          messageText="Combine multiple PDF files into one organized document."
          iconlabel="fa-layer-group"
        />

        <ServiceCard
          onClick={() => navigate(`/upload/${PDF_MODE.EDIT_PDF}`)}
          title="Edit PDF"
          messageText="Rearrange, delete, rotate, and organize pages with ease."
          iconlabel="fa-edit"
        />
        <ServiceCard
          onClick={() => {
            navigate(`/upload/${PDF_MODE.COMPRESS}`);
          }}
          title="Compress PDF"
          messageText="Reduce PDF file size while preserving quality"
        />

        <ServiceCard
          onClick={() => navigate(`/upload/${PDF_MODE.PDF_TO_IMAGES}`)}
          title="PDF to Images"
          messageText="Convert PDF pages into high-quality images with ease."
          iconlabel="fa-image"
        />
      </section>
    </main>
  );
}

type ServiceCardProps = ComponentPropsWithoutRef<"button"> & {
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
    <button
      className={`
        group flex min-h-[225px] w-full flex-col
        items-start justify-between
        rounded-2xl
        border border-neutral-800
        bg-[#111111]
        p-7
        text-left
        transition-all duration-200

        hover:-translate-y-1
        hover:border-neutral-700
        hover:bg-[#151515]
        hover:shadow-[0_10px_40px_rgba(0,0,0,0.4)]

        focus:outline-none
        focus:ring-2
        focus:ring-red-500/60
        focus:ring-offset-2
        focus:ring-offset-[#090909]

        ${className}
      `}
      {...rest}
    >
      {/* Icon */}
      <div className="flex w-full items-start justify-between">
        <div
          className="
            flex h-12 w-12 items-center justify-center
            rounded-xl
            bg-red-500/10
            ring-1 ring-red-500/10
            transition-colors
            group-hover:bg-red-500/15
          "
        >
          <i
            className={`fa ${iconlabel} text-xl text-red-500`}
            aria-hidden="true"
          />
        </div>

        <span
          className="
            text-xl text-neutral-600
            transition-all duration-200
            group-hover:translate-x-1
            group-hover:text-red-500
          "
        >
          →
        </span>
      </div>

      {/* Content */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold tracking-tight text-white">
          {title}
        </h3>

        <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-500">
          {messageText}
        </p>
      </div>
    </button>
  );
}
