interface KeywordTagProps {
  text: string;
}

export default function KeywordTag({ text }: KeywordTagProps) {
  return (
    <span className="inline-block rounded-md bg-[#c96442]/10 px-2 py-0.5 text-xs font-medium text-[#c96442]">
      {text}
    </span>
  );
}
