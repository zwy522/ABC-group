import { useState } from "react";
import { Settings, RefreshCw, Loader2, CheckCircle, AlertCircle, Eye, Database } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { discoverMeetings, validateToken, type MeetingData } from "@/services/github";

export default function Admin() {
  const { token, isAuthenticated, setToken, logout } = useAuthStore();
  const [tokenInput, setTokenInput] = useState(token);
  const [verifying, setVerifying] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [discoveredMeetings, setDiscoveredMeetings] = useState<MeetingData[]>([]);
  const [status, setStatus] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // 验证 Token
  const handleVerifyToken = async () => {
    if (!tokenInput.trim()) return;
    setVerifying(true);
    try {
      const valid = await validateToken(tokenInput);
      if (valid) {
        setToken(tokenInput);
        setStatus({ type: "success", message: "Token 验证成功" });
      } else {
        setStatus({ type: "error", message: "Token 无效" });
      }
    } catch {
      setStatus({ type: "error", message: "验证失败，请检查网络" });
    } finally {
      setVerifying(false);
    }
  };

  // 从 GitHub 同步
  const handleSync = async () => {
    setSyncing(true);
    setStatus({ type: "info", message: "正在从 GitHub 仓库读取文件夹结构..." });
    try {
      const meetings = await discoverMeetings();
      setDiscoveredMeetings(meetings);
      setStatus({
        type: "success",
        message: `同步成功！发现 ${meetings.length} 期组会，共 ${meetings.reduce((sum, m) => sum + m.papers.length, 0)} 篇论文`,
      });
    } catch (err) {
      setStatus({ type: "error", message: `同步失败：${err instanceof Error ? err.message : "未知错误"}` });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#c96442] text-white text-sm font-bold">
            <Settings size={16} />
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#1a1a1a]">管理面板</h1>
        </div>
        <p className="text-[#6b6560] ml-11">同步仓库数据、管理组会记录</p>
      </div>

      {/* 状态提示 */}
      {status && (
        <div className={`mb-6 rounded-xl px-4 py-3 text-sm flex items-center gap-2 ${
          status.type === "success"
            ? "bg-green-50 border border-green-200 text-green-700"
            : status.type === "error"
            ? "bg-red-50 border border-red-200 text-red-700"
            : "bg-blue-50 border border-blue-200 text-blue-700"
        }`}>
          {status.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {status.message}
        </div>
      )}

      {/* Token 管理 */}
      <div className="rounded-2xl bg-white border border-[#e8e4db] p-6 mb-6">
        <h2 className="font-serif text-lg font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
          <Eye size={18} className="text-[#c96442]" />
          身份验证
        </h2>
        {isAuthenticated ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle size={16} />
              已登录（Token: {token.slice(0, 8)}...）
            </div>
            <button
              onClick={logout}
              className="text-sm text-[#c96442] hover:text-[#b5573a] transition-colors"
            >
              退出登录
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="输入 GitHub Token"
              className="flex-1 rounded-lg border border-[#e8e4db] bg-white px-3 py-2 text-sm text-[#1a1a1a] placeholder-[#9a9590] outline-none focus:border-[#c96442]/40 focus:ring-2 focus:ring-[#c96442]/10"
            />
            <button
              onClick={handleVerifyToken}
              disabled={verifying || !tokenInput.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#c96442] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#b5573a] disabled:opacity-50"
            >
              {verifying ? <Loader2 size={14} className="animate-spin" /> : "验证"}
            </button>
          </div>
        )}
      </div>

      {/* 同步操作 */}
      <div className="rounded-2xl bg-white border border-[#e8e4db] p-6 mb-6">
        <h2 className="font-serif text-lg font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
          <Database size={18} className="text-[#c96442]" />
          数据同步
        </h2>
        <p className="text-sm text-[#6b6560] mb-4">
          从 GitHub 仓库自动读取文件夹结构，发现所有组会资料。无需手动更新 meetings.json，网站会自动解析仓库中的日期文件夹。
        </p>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-2 rounded-xl bg-[#c96442] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#b5573a] disabled:opacity-50"
        >
          {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          {syncing ? "同步中..." : "从 GitHub 同步"}
        </button>
      </div>

      {/* 同步结果 */}
      {discoveredMeetings.length > 0 && (
        <div className="rounded-2xl bg-white border border-[#e8e4db] p-6">
          <h2 className="font-serif text-lg font-semibold text-[#1a1a1a] mb-4">
            同步结果（{discoveredMeetings.length} 期组会）
          </h2>
          <div className="space-y-4">
            {discoveredMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="rounded-xl bg-[#faf9f5] border border-[#e8e4db] p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-[#c96442]">{meeting.date}</span>
                  <span className="text-xs text-[#6b6560]">{meeting.title}</span>
                  <span className="text-xs text-[#9a9590]">（{meeting.papers.length} 篇论文）</span>
                </div>
                {meeting.papers.map((paper) => (
                  <div key={paper.id} className="ml-4 text-sm text-[#1a1a1a]">
                    <span className="font-medium">{paper.title}</span>
                    {paper.presenter && (
                      <span className="text-[#6b6560]"> — {paper.presenter}</span>
                    )}
                    <div className="flex gap-2 mt-1">
                      {paper.pdfUrl && (
                        <span className="text-xs text-[#c96442]">PDF</span>
                      )}
                      {paper.pptxUrls.map((p, i) => (
                        <span key={i} className="text-xs text-[#6b6560]">{p.label}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 仓库信息 */}
      <div className="mt-6 rounded-2xl bg-[#faf9f5] border border-[#e8e4db] p-6">
        <h3 className="font-serif text-base font-semibold text-[#1a1a1a] mb-3">自更新原理</h3>
        <div className="text-sm text-[#6b6560] space-y-2">
          <p>本网站支持两种数据来源：</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li><strong className="text-[#1a1a1a]">静态数据</strong>：读取 <code className="bg-white px-1 rounded">meetings.json</code> 文件，需要手动维护</li>
            <li><strong className="text-[#1a1a1a]">动态同步</strong>：通过 GitHub API 读取仓库文件夹结构，自动发现所有 <code className="bg-white px-1 rounded">YYYY.M.D</code> 格式的文件夹及其中的 PDF/PPTX 文件</li>
          </ol>
          <p>在"组会记录"页面点击"从 GitHub 同步"按钮即可切换到动态数据源，无需修改代码或重新部署。</p>
        </div>
      </div>
    </div>
  );
}
