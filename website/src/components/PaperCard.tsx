import { User, FileDown, Presentation } from "lucide-react";
import KeywordTag from "./KeywordTag";

interface PptxLink {
  label: string;
  url: string;
}

interface PaperCardProps {
  title: string;
  venue?: string;
  presenter: string;
  keywords: string[];
  pdfUrl: string;
  pptxUrls: PptxLink[];
}

export default function PaperCard({
  title,
  venue,
  presenter,
  keywords,
  pdfUrl,
  pptxUrls,
}: PaperCardProps) {
  return (
    <div className="rounded-2xl bg-white border border-[#e8e4db] p-6 transition-all duration-300 hover:shadow-lg hover:shadow-[#c96442]/5 hover:border-[#c96442]/20">
      <h3 className="font-serif text-lg font-semibold leading-snug text-[#1a1a1a]">
        {title}
      </h3>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {venue && (
          <span className="rounded-md bg-[#7c6f5b]/10 px-2 py-0.5 text-xs font-semibold text-[#7c6f5b]">
            {venue}
          </span>
        )}
        <span className="flex items-center gap-1 text-sm text-[#6b6560]">
          <User size={14} className="text-[#c96442]" />
          <span className="font-medium text-[#1a1a1a]">{presenter}</span>
          <span className="text-[#9a9590]">汇报</span>
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {keywords.map((kw) => (
          <KeywordTag key={kw} text={kw} />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-[#f0ece4] pt-4">
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#c96442]/10 px-3 py-1.5 text-xs font-medium text-[#c96442] transition-colors hover:bg-[#c96442] hover:text-white"
        >
          <FileDown size={14} />
          论文 PDF
        </a>
        {pptxUrls.map((pptx) => (
          <a
            key={pptx.label}
            href={pptx.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#f5f2eb] px-3 py-1.5 text-xs font-medium text-[#6b6560] transition-colors hover:bg-[#c96442] hover:text-white"
          >
            <Presentation size={14} />
            {pptx.label}
          </a>
        ))}
      </div>
    </div>
  );
}
