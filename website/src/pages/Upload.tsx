import { useState } from "react";
import { Upload as UploadIcon, FileUp, CheckCircle, AlertCircle, Loader2, Link as LinkIcon, FileText } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import {
  uploadFile, fileToBase64, validateToken, syncMeetingsAfterUpload,
} from "@/services/github";

interface UploadStatus {
  type: "success" | "error" | "info";
  message: string;
}

export default function Upload() {
  const { token, isAuthenticated, setToken, logout } = useAuthStore();
  const [tokenInput, setTokenInput] = useState(token);
  const [verifying, setVerifying] = useState(false);
  const [meetingDate, setMeetingDate] = useState("");
  const [paperTitle, setPaperTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [presenter, setPresenter] = useState("");
  const [keywords, setKeywords] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pptxFiles, setPptxFiles] = useState<File[]>([]);
  const [mdFiles, setMdFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<UploadStatus | null>(null);

  // 验证 Token
  const handleVerifyToken = async () => {
    if (!tokenInput.trim()) return;
    setVerifying(true);
    try {
      const valid = await validateToken(tokenInput);
      if (valid) {
        setToken(tokenInput);
        setStatus({ type: "success", message: "Token 验证成功，已登录" });
      } else {
        setStatus({ type: "error", message: "Token 无效，请检查后重试" });
      }
    } catch {
      setStatus({ type: "error", message: "验证失败，请检查网络连接" });
    } finally {
      setVerifying(false);
    }
  };

  // 上传资料
  const handleUpload = async () => {
    if (!isAuthenticated) {
      setStatus({ type: "error", message: "请先输入 GitHub Token 登录" });
      return;
    }
    if (!meetingDate || !paperTitle) {
      setStatus({ type: "error", message: "请填写组会日期和论文标题" });
      return;
    }
    if (!pdfFile && pptxFiles.length === 0 && mdFiles.length === 0) {
      setStatus({ type: "error", message: "请至少上传一个文件（PDF、PPTX 或 Markdown）" });
      return;
    }

    setUploading(true);
    setStatus({ type: "info", message: "正在上传文件..." });

    try {
      // 解析日期格式 YYYY.M.D
      const dateObj = new Date(meetingDate);
      const folderName = `${dateObj.getFullYear()}.${dateObj.getMonth() + 1}.${dateObj.getDate()}`;
      const uploadedFiles: string[] = [];

      // 上传 PDF
      if (pdfFile) {
        const pdfBase64 = await fileToBase64(pdfFile);
        const pdfPath = `${folderName}/${pdfFile.name}`;
        await uploadFile(token, pdfPath, pdfBase64, `feat: 添加论文 ${paperTitle}`);
        uploadedFiles.push(pdfFile.name);
      }

      // 上传 PPTX
      for (const pptx of pptxFiles) {
        const pptxBase64 = await fileToBase64(pptx);
        const pptxPath = `${folderName}/${pptx.name}`;
        await uploadFile(token, pptxPath, pptxBase64, `feat: 添加汇报 ${paperTitle}`);
        uploadedFiles.push(pptx.name);
      }

      // 上传 Markdown
      for (const md of mdFiles) {
        const mdBase64 = await fileToBase64(md);
        const mdPath = `${folderName}/${md.name}`;
        await uploadFile(token, mdPath, mdBase64, `feat: 添加笔记 ${paperTitle}`);
        uploadedFiles.push(md.name);
      }

      setStatus({
        type: "success",
        message: `上传成功！已上传 ${uploadedFiles.length} 个文件到 ${folderName}/ 文件夹。正在更新组会记录...`,
      });

      // 自动更新 meetings.json
      const rawBase = `https://github.com/zwy522/ABC-group/raw/main/${folderName}`;
      try {
        await syncMeetingsAfterUpload(token, folderName, {
          title: paperTitle,
          venue: venue || "",
          presenter: presenter || "",
          keywords: keywords ? keywords.split(/[,，]/).map((k) => k.trim()).filter(Boolean) : [],
          pdfUrl: pdfFile ? `${rawBase}/${encodeURIComponent(pdfFile.name)}` : "",
          pptxUrls: pptxFiles.map((f) => ({
            label: f.name.replace(/\.(pptx|PPTX)$/i, "").replace(/_/g, " ").trim(),
            url: `${rawBase}/${encodeURIComponent(f.name)}`,
          })),
          mdUrls: mdFiles.map((f) => ({
            label: f.name.replace(/\.(md|MD)$/i, ""),
            url: `${rawBase}/${encodeURIComponent(f.name)}`,
            repoPath: `${folderName}/${f.name}`,
          })),
        });
        setStatus({
          type: "success",
          message: `上传成功！已上传 ${uploadedFiles.length} 个文件到 ${folderName}/ 文件夹，并自动更新组会记录。`,
        });
      } catch (syncErr) {
        console.error("syncMeetingsAfterUpload failed:", syncErr);
        setStatus({
          type: "success",
          message: `上传成功！已上传 ${uploadedFiles.length} 个文件到 ${folderName}/ 文件夹。（组会记录自动更新失败，请手动补充）`,
        });
      }

      // 清空表单
      setPaperTitle("");
      setVenue("");
      setPresenter("");
      setKeywords("");
      setPdfFile(null);
      setPptxFiles([]);
      setMdFiles([]);
    } catch (err) {
      setStatus({
        type: "error",
        message: `上传失败：${err instanceof Error ? err.message : "未知错误"}`,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#c96442] text-white text-sm font-bold">
            <UploadIcon size={16} />
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#1a1a1a]">上传资料</h1>
        </div>
        <p className="text-[#6b6560] ml-11">上传组会论文和汇报材料到 GitHub 仓库</p>
      </div>

      {/* Token 登录 */}
      <div className="rounded-2xl bg-white border border-[#e8e4db] p-6 mb-6">
        <h2 className="font-serif text-lg font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
          <LinkIcon size={18} className="text-[#c96442]" />
          GitHub 身份验证
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
          <div>
            <p className="text-sm text-[#6b6560] mb-3">
              需要 GitHub Personal Access Token 才能上传文件。Token 需要 <code className="bg-[#f5f2eb] px-1 rounded">repo</code> 权限。
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="输入 GitHub Token (ghp_...)"
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
          </div>
        )}
      </div>

      {/* 上传表单 */}
      <div className="rounded-2xl bg-white border border-[#e8e4db] p-6 mb-6">
        <h2 className="font-serif text-lg font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
          <FileUp size={18} className="text-[#c96442]" />
          组会信息
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
              组会日期 <span className="text-[#c96442]">*</span>
            </label>
            <input
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="w-full rounded-lg border border-[#e8e4db] bg-white px-3 py-2 text-sm text-[#1a1a1a] outline-none focus:border-[#c96442]/40 focus:ring-2 focus:ring-[#c96442]/10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">
              论文标题 <span className="text-[#c96442]">*</span>
            </label>
            <input
              type="text"
              value={paperTitle}
              onChange={(e) => setPaperTitle(e.target.value)}
              placeholder="例如：BitDecoding: Unlocking Tensor Cores..."
              className="w-full rounded-lg border border-[#e8e4db] bg-white px-3 py-2 text-sm text-[#1a1a1a] placeholder-[#9a9590] outline-none focus:border-[#c96442]/40 focus:ring-2 focus:ring-[#c96442]/10"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1">发表会议</label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="例如：HPCA 2026"
                className="w-full rounded-lg border border-[#e8e4db] bg-white px-3 py-2 text-sm text-[#1a1a1a] placeholder-[#9a9590] outline-none focus:border-[#c96442]/40 focus:ring-2 focus:ring-[#c96442]/10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-1">汇报人</label>
              <input
                type="text"
                value={presenter}
                onChange={(e) => setPresenter(e.target.value)}
                placeholder="例如：张三"
                className="w-full rounded-lg border border-[#e8e4db] bg-white px-3 py-2 text-sm text-[#1a1a1a] placeholder-[#9a9590] outline-none focus:border-[#c96442]/40 focus:ring-2 focus:ring-[#c96442]/10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-1">关键词</label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="用逗号分隔，例如：LLM推理, 量化, KV Cache"
              className="w-full rounded-lg border border-[#e8e4db] bg-white px-3 py-2 text-sm text-[#1a1a1a] placeholder-[#9a9590] outline-none focus:border-[#c96442]/40 focus:ring-2 focus:ring-[#c96442]/10"
            />
          </div>
        </div>
      </div>

      {/* 文件上传 */}
      <div className="rounded-2xl bg-white border border-[#e8e4db] p-6 mb-6">
        <h2 className="font-serif text-lg font-semibold text-[#1a1a1a] mb-4">文件上传</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              论文 PDF
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-[#6b6560] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#c96442]/10 file:text-[#c96442] hover:file:bg-[#c96442]/20 file:cursor-pointer file:transition-colors"
              />
            </div>
            {pdfFile && (
              <p className="mt-1 text-xs text-[#6b6560]">已选择：{pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              汇报 PPT（可多选）
            </label>
            <input
              type="file"
              accept=".pptx,.ppt"
              multiple
              onChange={(e) => setPptxFiles(Array.from(e.target.files || []))}
              className="w-full text-sm text-[#6b6560] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#f5f2eb] file:text-[#6b6560] hover:file:bg-[#e8e4db] file:cursor-pointer file:transition-colors"
            />
            {pptxFiles.length > 0 && (
              <div className="mt-2 space-y-1">
                {pptxFiles.map((f, i) => (
                  <p key={i} className="text-xs text-[#6b6560]">
                    {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
              <FileText size={14} className="inline mr-1 text-[#c96442]" />
              笔记 Markdown（可多选）
            </label>
            <input
              type="file"
              accept=".md,.markdown"
              multiple
              onChange={(e) => setMdFiles(Array.from(e.target.files || []))}
              className="w-full text-sm text-[#6b6560] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#7c6f5b]/10 file:text-[#7c6f5b] hover:file:bg-[#7c6f5b]/20 file:cursor-pointer file:transition-colors"
            />
            {mdFiles.length > 0 && (
              <div className="mt-2 space-y-1">
                {mdFiles.map((f, i) => (
                  <p key={i} className="text-xs text-[#6b6560]">
                    {f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
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

      {/* 提交按钮 */}
      <button
        onClick={handleUpload}
        disabled={uploading || !isAuthenticated}
        className="w-full rounded-xl bg-[#c96442] py-3 text-sm font-medium text-white shadow-md shadow-[#c96442]/20 transition-all hover:bg-[#b5573a] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {uploading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            上传中...
          </>
        ) : (
          <>
            <UploadIcon size={16} />
            上传到 GitHub 仓库
          </>
        )}
      </button>

      {/* 使用说明 */}
      <div className="mt-8 rounded-2xl bg-[#faf9f5] border border-[#e8e4db] p-6">
        <h3 className="font-serif text-base font-semibold text-[#1a1a1a] mb-3">使用说明</h3>
        <ol className="text-sm text-[#6b6560] space-y-2 list-decimal list-inside">
          <li>前往 GitHub Settings → Developer settings → Personal access tokens 生成 Token</li>
          <li>Token 需要勾选 <code className="bg-[#f5f2eb] px-1 rounded">repo</code> 权限</li>
          <li>输入 Token 并验证后即可上传文件</li>
          <li>上传的文件会自动创建对应的日期文件夹（如 <code className="bg-[#f5f2eb] px-1 rounded">2026.6.4/</code>）</li>
          <li>上传后在"组会记录"页面点击"从 GitHub 同步"即可看到最新数据</li>
        </ol>
      </div>
    </div>
  );
}
