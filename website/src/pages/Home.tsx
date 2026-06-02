import { Link } from "react-router-dom";
import { Calendar, User, ArrowRight, BookOpen, FlaskConical } from "lucide-react";
import meetingsData from "@/data/meetings.json";
import KeywordTag from "@/components/KeywordTag";

export default function Home() {
  const latestMeetings = meetingsData.meetings.slice(0, 2);

  return (
    <div className="font-sans">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#faf9f5] via-[#f5f0e6] to-[#f0ece4]">
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: "radial-gradient(circle, #c96442 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-[#e8e4db] px-3 py-1 text-xs text-[#6b6560] mb-6 shadow-sm">
              <FlaskConical size={12} className="text-[#c96442]" />
              研究生课题组 · LLM 推理加速
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl font-black text-[#1a1a1a] leading-tight tracking-tight">
              ABC-Group
              <span className="block mt-1 text-2xl sm:text-3xl font-light text-[#6b6560] tracking-widest">
                组会资料库
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-[#4a4540] leading-relaxed max-w-lg">
              探索大模型推理加速的前沿研究，涵盖<strong className="text-[#1a1a1a]">低比特量化</strong>、<strong className="text-[#1a1a1a]">KV Cache 压缩</strong>、<strong className="text-[#1a1a1a]">硬件协同加速</strong>等核心方向。
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/meetings"
                className="inline-flex items-center gap-2 rounded-full bg-[#c96442] px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-[#c96442]/20 transition-all hover:bg-[#b5573a] hover:shadow-lg hover:shadow-[#c96442]/30"
              >
                <BookOpen size={16} />
                浏览组会记录
              </Link>
              <Link
                to="/meetings"
                className="inline-flex items-center gap-2 rounded-full bg-white border border-[#e8e4db] px-6 py-2.5 text-sm font-medium text-[#1a1a1a] transition-all hover:border-[#c96442]/30 hover:shadow-md"
              >
                查看全部
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#c96442] text-white text-sm font-bold">
            📋
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#1a1a1a]">最新组会</h2>
            <p className="text-sm text-[#6b6560]">近期论文汇报动态</p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {latestMeetings.map((meeting) => (
            <div
              key={meeting.id}
              className="rounded-2xl bg-white border border-[#e8e4db] p-6 transition-all duration-300 hover:shadow-lg hover:shadow-[#c96442]/5 hover:border-[#c96442]/20"
            >
              <div className="flex items-center gap-2 text-sm text-[#6b6560] mb-3">
                <Calendar size={14} className="text-[#c96442]" />
                <span>{meeting.date}</span>
                <span className="text-[#d5d0c8]">·</span>
                <span className="font-medium text-[#1a1a1a]">{meeting.title}</span>
              </div>

              {meeting.papers.map((paper) => (
                <div key={paper.id}>
                  <h3 className="font-serif text-lg font-semibold leading-snug text-[#1a1a1a]">
                    {paper.title}
                  </h3>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {paper.venue && (
                      <span className="rounded-md bg-[#7c6f5b]/10 px-2 py-0.5 text-xs font-semibold text-[#7c6f5b]">
                        {paper.venue}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-sm text-[#6b6560]">
                      <User size={14} className="text-[#c96442]" />
                      <span className="font-medium text-[#1a1a1a]">{paper.presenter}</span>
                      <span className="text-[#9a9590]">汇报</span>
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {paper.keywords.map((kw) => (
                      <KeywordTag key={kw} text={kw} />
                    ))}
                  </div>
                </div>
              ))}

              <Link
                to="/meetings"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#c96442] hover:text-[#b5573a] transition-colors"
              >
                查看详情
                <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
