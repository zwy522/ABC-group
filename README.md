# ABC-Group 组会资料库

ABC 课题组组会资料归档，包含论文报告、PPT 演示等。

- **网站**：[zwy522.github.io/ABC-group](https://zwy522.github.io/ABC-group/)
- **协议**：MIT License

---

## 📂 项目结构

```
ABC-group/
├── 2026.5.23/              # 第 1 期组会
├── 2026.5.30/              # 第 2 期组会
├── website/                # 网站源码 (React + Vite + Tailwind)
│   ├── src/
│   │   ├── components/     # 组件
│   │   ├── data/           # 组会数据
│   │   ├── hooks/          # 自定义 Hook
│   │   └── pages/          # 页面
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── .trae/                  # 项目文档
├── .gitignore
├── LICENSE
└── README.md
```

> 每期组会以日期命名文件夹 `YYYY.M.D`，内含论文 PDF、汇报 PPTX 等。
> 网站通过 GitHub Pages 部署在 `gh-pages` 分支。

---

## 📋 组会记录

### 第 1 期 — 2026.05.23

| 类型 | 标题 | 汇报人 | 文件 |
|------|------|--------|------|
| 📄 论文 | LiLo: Harnessing the on-Chip Accelerators in Intel CPUs for Compressed LLM Inference Acceleration (HPCA 2026) | — | [PDF](2026.5.23/LiLo_Harnessing_the_on-Chip_Accelerators_in_Intel_CPUs_for_Compressed_LLM_Inference_Acceleration.pdf) |
| 📊 汇报 | LiLo HPCA 2026 | 许世豪 | [PPTX](2026.5.23/LILo%20HPCA%202026.pptx) |
| 📊 汇报 | LiLo HPCA 2026 (Extended) | 许世豪 | [PPTX](2026.5.23/HPCA_LILo_extended.pptx) |

**关键词**：CPU 端加速、LLM 推理、模型压缩、Intel 片上加速器

---

### 第 2 期 — 2026.05.30

| 类型 | 标题 | 汇报人 | 文件 |
|------|------|--------|------|
| 📄 论文 | BitDecoding: Unlocking Tensor Cores for Long-Context LLMs with Low-Bit KV Cache | — | [PDF](2026.5.30/BitDecoding%20Unlocking%20Tensor%20Cores%20forLong-Context%20LLMs%20with%20Low-Bit%20KV%20Cache.pdf) |
| 📊 汇报 | BitDecoding PPT | 张文元 | [PPTX](2026.5.30/BitDecoding_PPT.pptx) |

**关键词**：LLM 推理加速、低比特量化、KV Cache 压缩、Tensor Core

---

## 🔬 研究方向

- LLM 推理加速与系统优化
- 模型压缩与低比特量化
- 硬件协同设计（GPU / CPU / NPU）

---

## 📝 资料提交规范

1. 每期组会创建以日期命名的文件夹，格式 `YYYY.M.D`
2. 论文原文以 `论文名称.pdf` 命名
3. 汇报 PPT 以 `论文名称_PPT.pptx` 命名
4. 补充材料放入当期 `材料/` 子文件夹
5. 新增组会后更新 `website/src/data/meetings.json` 并重新部署

---

## 🚀 本地开发

```bash
cd website
npm install
npm run dev      # 启动开发服务器
npm run build    # 构建
npm run deploy   # 部署到 GitHub Pages
```
