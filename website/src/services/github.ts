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
  mdUrls: { label: string; url: string; repoPath: string }[];
}

function parseFolderDate(folderName: string): string | null {
  const match = folderName.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/);
  if (!match) return null;
  const [, y, m, d] = match;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function extractTitleFromFilename(filename: string): string {
  return filename
    .replace(/\.(pdf|pptx|PPTX|PDF|md|MD)$/i, "")
    .replace(/_PPT$/i, "")
    .replace(/_/g, " ")
    .trim();
}

async function fetchRepoContents(path: string = ""): Promise<GitHubContent[]> {
  const url = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=main`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json();
}

function getRawUrl(path: string): string {
  return `https://github.com/${REPO_OWNER}/${REPO_NAME}/raw/main/${encodeURIComponent(path).replace(/%2F/g, '/')}`;
}

function getContentApiUrl(path: string): string {
  return `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${encodeURIComponent(path)}`;
}

export async function fetchFileContent(repoPath: string): Promise<string> {
  const url = getContentApiUrl(repoPath);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch file: ${res.status}`);
  const json = await res.json();
  if (json.content && json.encoding === "base64") {
    const raw = atob(json.content.replace(/\n/g, ""));
    const bytes = Uint8Array.from(raw, (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  }
  throw new Error("Unexpected API response format");
}

export async function discoverMeetings(): Promise<MeetingData[]> {
  try {
    console.log("[discoverMeetings] starting...");
    let rootContents: GitHubContent[];
    try {
      rootContents = await fetchRepoContents("");
      console.log("[discoverMeetings] root items:", rootContents.length, "first 5:", rootContents.slice(0,5).map(i=>i.name));
    } catch (e) {
      console.error("discoverMeetings: root fetch failed", e);
      return [];
    }

    const meetingFolders = rootContents.filter(
      (item) => item.type === "dir" && parseFolderDate(item.name)
    );

    console.log("[discoverMeetings] meeting folders found:", meetingFolders.length, meetingFolders.map(f=>f.name));

    if (meetingFolders.length === 0) {
      return [];
    }

    meetingFolders.sort((a, b) => {
      const da = parseFolderDate(a.name)!;
      const db = parseFolderDate(b.name)!;
      return new Date(db).getTime() - new Date(da).getTime();
    });

    const meetings: MeetingData[] = [];
    let idx = meetingFolders.length;

    for (const folder of meetingFolders) {
      let folderContents: GitHubContent[];
      try {
        folderContents = await fetchRepoContents(folder.name);
        console.log(`[discoverMeetings] folder ${folder.name}: ${folderContents.length} items`);
      } catch (e) {
        console.error("discoverMeetings: folder failed", folder.name, e);
        continue;
      }

      const pdfFiles = folderContents.filter((f) =>
        f.type === "file" && f.name.toLowerCase().endsWith(".pdf")
      );
      const pptxFiles = folderContents.filter((f) =>
        f.type === "file" && f.name.toLowerCase().endsWith(".pptx")
      );
      const mdFiles = folderContents.filter((f) =>
        f.type === "file" && /\.(md|MD)$/.test(f.name)
      );
      const mdEntries = mdFiles.map((f) => ({
        label: extractTitleFromFilename(f.name),
        url: getRawUrl(`${folder.name}/${f.name}`),
        repoPath: `${folder.name}/${f.name}`,
      }));

      const papers: PaperData[] = [];

      if (pdfFiles.length > 0) {
        for (const pdf of pdfFiles) {
          papers.push({
            id: `${folder.name}-${pdf.name}`,
            title: extractTitleFromFilename(pdf.name),
            venue: "",
            presenter: "",
            keywords: [],
            pdfUrl: getRawUrl(`${folder.name}/${pdf.name}`),
            pptxUrls: pptxFiles.map((p) => ({
              label: extractTitleFromFilename(p.name),
              url: getRawUrl(`${folder.name}/${p.name}`),
            })),
            mdUrls: mdEntries,
          });
        }
      } else {
        for (const pptx of pptxFiles) {
          papers.push({
            id: `${folder.name}-${pptx.name}`,
            title: extractTitleFromFilename(pptx.name),
            venue: "",
            presenter: "",
            keywords: [],
            pdfUrl: "",
            pptxUrls: [{ label: extractTitleFromFilename(pptx.name), url: getRawUrl(`${folder.name}/${pptx.name}`) }],
            mdUrls: mdEntries,
          });
        }
        if (pptxFiles.length === 0 && mdFiles.length > 0) {
          papers.push({
            id: `${folder.name}-notes`,
            title: extractTitleFromFilename(mdFiles[0].name),
            venue: "",
            presenter: "",
            keywords: [],
            pdfUrl: "",
            pptxUrls: [],
            mdUrls: mdEntries,
          });
        }
      }

      if (papers.length > 0) {
        meetings.push({
          id: folder.name,
          date: parseFolderDate(folder.name)!,
          folderName: folder.name,
          title: `第 ${idx} 期组会`,
          papers,
        });
        idx--;
      }
    }

    console.log("[discoverMeetings] done:", meetings.length, "meetings,", meetings.reduce((s,m)=>s+m.papers.length,0), "papers");
    return meetings;
  } catch (error) {
    console.error("Failed to discover meetings:", error);
    return [];
  }
}

export async function uploadFile(
  token: string,
  path: string,
  content: string,
  message: string
): Promise<{ sha: string; url: string } | null> {
  const url = `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message, content, branch: "main" }),
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.message || `Upload failed: ${res.status}`); }
  const data = await res.json();
  return { sha: data.content.sha, url: data.content.html_url };
}

export async function getMeetingsJsonSha(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/website/src/data/meetings.json`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.sha;
  } catch { return null; }
}

export async function validateToken(token: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/user`, { headers: { Authorization: `Bearer ${token}` } });
  return res.ok;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => { const result = reader.result as string; resolve(result.split(",")[1]); };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
