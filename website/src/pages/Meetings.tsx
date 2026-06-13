import { useState, useEffect } from 'react';
import { Search, Calendar, RefreshCw, Loader2 } from 'lucide-react';
import meetingsData from '@/data/meetings.json';
import PaperCard from '@/components/PaperCard';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { discoverMeetings, type MeetingData } from '@/services/github';

function normalizeTitle(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9]/g, "");
}

interface Paper {
  id: string;
  title: string;
  venue: string;
  presenter: string;
  keywords: string[];
  pdfUrl: string;
  pptxUrls: { label: string; url: string }[];
  mdUrls?: { label: string; url: string; repoPath: string }[];
}

interface Meeting {
  id: string;
  date: string;
  title: string;
  papers: Paper[];
}

function TimelineNode({ meeting, index }: { meeting: Meeting | MeetingData; index: number }) {
  const revealRef = useScrollReveal();
  return (
    <div ref={revealRef} className="relative flex gap-6 md:gap-8 pb-10 last:pb-0">
      <div className="hidden md:flex md:w-40 shrink-0 flex-col items-end pt-1">
        <span className="text-sm font-semibold text-[#c96442]">{meeting.date}</span>
        <span className="mt-0.5 text-xs text-[#6b6560]">{meeting.title}</span>
      </div>
      <div className="relative flex flex-col items-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c96442] text-white text-xs font-bold ring-4 ring-[#c96442]/10">
          {String(index + 1).padStart(2, '0')}
        </div>
        <div className="w-px flex-1 bg-gradient-to-b from-[#c96442]/30 to-transparent" />
      </div>
      <div className="flex-1 pb-2">
        <div className="mb-3 md:hidden flex items-center gap-2">
          <Calendar size={14} className="text-[#c96442]" />
          <span className="text-sm font-semibold text-[#c96442]">{meeting.date}</span>
          <span className="text-xs text-[#6b6560]">{meeting.title}</span>
        </div>
        <div className="flex flex-col gap-4">
          {meeting.papers.map((paper) => (
            <PaperCard
              key={paper.id}
              title={paper.title}
              venue={paper.venue || undefined}
              presenter={paper.presenter}
              keywords={paper.keywords}
              pdfUrl={paper.pdfUrl}
              pptxUrls={paper.pptxUrls}
              mdUrls={paper.mdUrls}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Meetings() {
  const [filter, setFilter] = useState('');
  const [liveMeetings, setLiveMeetings] = useState<MeetingData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const staticMeetings: Meeting[] = [...meetingsData.meetings].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Build metadata lookup from static meetings.json
  const staticMeta = new Map<string, { presenter: string; venue: string; keywords: string[] }>();
  for (const m of staticMeetings) {
    for (const p of m.papers) {
      staticMeta.set(normalizeTitle(p.title), { presenter: p.presenter, venue: p.venue, keywords: p.keywords });
    }
  }

  // Merge live data with static metadata
  const enriched = (liveMeetings ?? []).map((m) => ({
    ...m,
    papers: m.papers.map((p) => {
      const key = normalizeTitle(p.title);
      const meta = staticMeta.get(key);
      if (meta) {
        return { ...p, presenter: meta.presenter, venue: meta.venue, keywords: meta.keywords };
      }
      return p;
    }),
  }));

  const currentMeetings = (liveMeetings && liveMeetings.length > 0)
    ? enriched
    : staticMeetings;

  const sync = async () => {
    setSyncing(true);
    try {
      const meetings = await discoverMeetings();
      console.log("[Meetings sync] got", meetings.length, "meetings");
      if (meetings.length > 0) {
        setLiveMeetings(meetings);
      }
    } catch (err) {
      console.error("[Meetings sync] error:", err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const doSync = async () => {
      setLoading(true);
      try {
        const meetings = await discoverMeetings();
        console.log("[Meetings init] got", meetings.length, "meetings");
        if (meetings.length > 0) {
          setLiveMeetings(meetings);
        } else {
          setLiveMeetings(null);
        }
      } catch {
        setLiveMeetings(null);
      } finally {
        setLoading(false);
      }
    };
    doSync();
  }, []);

  const filtered = filter.trim()
    ? currentMeetings
        .map((m) => ({
          ...m,
          papers: m.papers.filter(
            (p) =>
              p.title.toLowerCase().includes(filter.toLowerCase()) ||
              p.presenter.toLowerCase().includes(filter.toLowerCase()) ||
              (p.venue && p.venue.toLowerCase().includes(filter.toLowerCase())) ||
              p.keywords.some((k) =>
                k.toLowerCase().includes(filter.toLowerCase())
              )
          ),
        }))
        .filter((m) => m.papers.length > 0)
    : currentMeetings;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#c96442] text-white text-sm font-bold">
            📋
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#1a1a1a]">
            组会记录
          </h1>
        </div>
        <p className="text-[#6b6560] ml-11">按时间线浏览历次组会论文汇报</p>
      </div>

      {/* 搜索和同步 */}
      <div className="flex flex-col sm:flex-row gap-3 mb-10">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9a9590]"
          />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="搜索论文、关键词或汇报人..."
            className="w-full rounded-xl border border-[#e8e4db] bg-white py-2.5 pl-10 pr-4 text-sm text-[#1a1a1a] placeholder-[#9a9590] outline-none transition-all focus:border-[#c96442]/40 focus:ring-2 focus:ring-[#c96442]/10 shadow-sm"
          />
        </div>
        <button
          onClick={sync}
          disabled={syncing}
          className="inline-flex items-center gap-2 rounded-xl bg-[#c96442] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#b5573a] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <RefreshCw size={16} />
          )}
          {syncing ? "刷新中..." : "刷新数据"}
        </button>
      </div>

      {liveMeetings && (
        <div className="mb-6 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <RefreshCw size={14} className="shrink-0" />
          已从 GitHub 仓库自动同步 {liveMeetings.length} 期组会数据（实时读取仓库文件夹结构）
        </div>
      )}
      {!liveMeetings && !loading && (
        <div className="mb-6 rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-700 flex items-center gap-2">
          使用本地缓存数据，可点击"刷新数据"从 GitHub 同步
        </div>
      )}
      {filter.trim() && !loading && (
        <div className="mb-6 text-sm text-[#6b6560]">
          搜索 <span className="font-semibold text-[#c96442]">"{filter}"</span>，共找到 {filtered.reduce((sum, m) => sum + m.papers.length, 0)} 篇论文
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#9a9590]">
          <Loader2 size={24} className="animate-spin mr-2" />
          <span className="text-sm">正在同步 GitHub 仓库数据...</span>
        </div>
      ) : filtered.length > 0 ? (
        <div className="relative">
          {filtered.map((meeting, idx) => (
            <TimelineNode key={meeting.id} meeting={meeting} index={idx} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-[#6b6560]">
          <Search size={40} className="mb-4 opacity-20" />
          <p className="text-base">未找到匹配的组会记录</p>
          <p className="mt-1 text-sm text-[#9a9590]">尝试调整搜索关键词</p>
        </div>
      )}
    </div>
  );
}
