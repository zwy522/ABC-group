// GitHub API 服务 - 用于自动发现组会和上传文件

const REPO_OWNER = "zwy522";
const REPO_NAME = "ABC-group";
const API_BASE = "https://api.github.com";

export interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: "file" | "dir" | "symlink" | "submodule";
}

export interface MeetingData {
  id: string;
  date: string;
  folderName: string;
  title: string;
  papers: PaperData[];
}

export interface PaperData {
  id: string;
  title: string;
  venue: string;
  presenter: string;
  keywords: string[];
  pdfUrl: string;
  pptxUrls: { label: string; url: string }[];
}

// 从文件夹名解析日期 (如 "2026.5.23" -> "2026-05-23")
function parseFolderDate(folderName: string): string | null {
  const match = folderName.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/);
  if (!match) return null;
  const [, y, m, d] = match;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

// 从文件名推断论文标题
function extractTitleFromFilename(filename: string): string {
  return filename
    .replace(/\.(pdf|pptx|PPTX|PDF)$/i, "")
    .replace(/_PPT$/i, "")
    .replace(/_/g, " ")
    .trim();
}

// 获取仓库根目录内容
async function fetchRepoContents(path: string = ""): Promise<GitHubContent[]> {
  const url = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json();
}

// 获取原始文件下载URL
function getRawUrl(path: string): string {
  return `https://github.com/${REPO_OWNER}/${REPO_NAME}/raw/main/${encodeURIComponent(path).replace(/%2F/g, '/')}`;
}

// 自动发现所有组会
export async function discoverMeetings(): Promise<MeetingData[]> {
  try {
    const rootContents = await fetchRepoContents();

    // 找到日期格式的文件夹
    const meetingFolders = rootContents.filter(
      (item) => item.type === "dir" && parseFolderDate(item.name)
    );

    const meetings: MeetingData[] = [];

    for (const folder of meetingFolders) {
      const date = parseFolderDate(folder.name)!;
      let folderContents: GitHubContent[] = [];

      try {
        folderContents = await fetchRepoContents(folder.name);
      } catch {
        // 跳过无法读取的文件夹
        continue;
      }

      const pdfFiles = folderContents.filter((f) =>
        f.type === "file" && f.name.toLowerCase().endsWith(".pdf")
      );
      const pptxFiles = folderContents.filter((f) =>
        f.type === "file" && f.name.toLowerCase().endsWith(".pptx")
      );

      // 按论文分组：每个PDF对应一个论文条目
      const papers: PaperData[] = [];

      if (pdfFiles.length > 0) {
        for (const pdf of pdfFiles) {
          const paperTitle = extractTitleFromFilename(pdf.name);
          // 找到对应的PPTX文件
          const relatedPptx = pptxFiles.filter((pptx) => {
            const pptxBase = extractTitleFromFilename(pptx.name).toUpperCase();
            const pdfBase = paperTitle.toUpperCase();
            return pptxBase.includes(pdfBase) || pdfBase.includes(pptxBase) || true; // 宽松匹配
          });

          papers.push({
            id: `${folder.name}-${pdf.name}`,
            title: paperTitle,
            venue: "",
            presenter: "",
            keywords: [],
            pdfUrl: getRawUrl(`${folder.name}/${pdf.name}`),
            pptxUrls: relatedPptx.map((p) => ({
              label: extractTitleFromFilename(p.name),
              url: getRawUrl(`${folder.name}/${p.name}`),
            })),
          });
        }
      } else if (pptxFiles.length > 0) {
        // 只有PPTX没有PDF的情况
        for (const pptx of pptxFiles) {
          papers.push({
            id: `${folder.name}-${pptx.name}`,
            title: extractTitleFromFilename(pptx.name),
            venue: "",
            presenter: "",
            keywords: [],
            pdfUrl: "",
            pptxUrls: [{
              label: extractTitleFromFilename(pptx.name),
              url: getRawUrl(`${folder.name}/${pptx.name}`),
            }],
          });
        }
      }

      if (papers.length > 0) {
        meetings.push({
          id: folder.name,
          date,
          folderName: folder.name,
          title: `第 ${meetings.length + 1} 期组会`,
          papers,
        });
      }
    }

    // 按日期降序排列
    meetings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    // 重新编号
    meetings.forEach((m, i) => {
      m.title = `第 ${meetings.length - i} 期组会`;
    });

    return meetings;
  } catch (error) {
    console.error("Failed to discover meetings:", error);
    return [];
  }
}

// 上传文件到 GitHub 仓库
export async function uploadFile(
  token: string,
  path: string,
  content: string, // base64 encoded
  message: string
): Promise<{ sha: string; url: string } | null> {
  const url = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      content,
      branch: "main",
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || `Upload failed: ${res.status}`);
  }

  const data = await res.json();
  return { sha: data.content.sha, url: data.content.html_url };
}

// 更新 meetings.json
export async function updateMeetingsJson(
  token: string,
  meetings: MeetingData[],
  sha?: string
): Promise<boolean> {
  const url = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/website/src/data/meetings.json`;
  const body: Record<string, unknown> = {
    message: "docs: 更新组会数据",
    content: btoa(unescape(encodeURIComponent(JSON.stringify({ meetings }, null, 2)))),
    branch: "main",
  };

  if (sha) {
    body.sha = sha;
  }

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return res.ok;
}

// 获取 meetings.json 的 sha（用于更新时提供）
export async function getMeetingsJsonSha(): Promise<string | null> {
  try {
    const url = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/website/src/data/meetings.json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.sha;
  } catch {
    return null;
  }
}

// 验证 GitHub Token 有效性
export async function validateToken(token: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/user`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok;
}

// 文件转 Base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // 去掉 data:xxx;base64, 前缀
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
