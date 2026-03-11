import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import simpleGit from "simple-git";
import fs from "fs-extra";
import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const git = simpleGit();

app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});


// ===== NEW: FUNCTION READ REPO TREE =====
async function getRepoTree(dir, prefix = "") {

  const items = await fs.readdir(dir);
  let tree = "";

  for (const item of items) {

    const fullPath = path.join(dir, item);
    const stat = await fs.stat(fullPath);

    if (stat.isDirectory()) {

      tree += `${prefix}${item}/\n`;
      tree += await getRepoTree(fullPath, prefix + "  ");

    } else {

      tree += `${prefix}${item}\n`;

    }
  }

  return tree;
}


// ===== HEALTH CHECK =====
app.get("/", (req, res) => {
  res.json({
    status: "Agentic CI/CD API running",
    port: PORT
  });
});


// ===== GENERATE PIPELINE FROM PROMPT =====
app.post("/generate", async (req, res) => {

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({
      error: "Prompt is required"
    });
  }

  console.log("Prompt received:", prompt);

  try {

    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `Generate ONLY a GitHub Actions YAML pipeline for: ${prompt}`
        }
      ]
    });

    const pipeline = msg.content
      .map(b => b.text || "")
      .join("")
      .replace(/```yaml/g, "")
      .replace(/```/g, "")
      .trim();

    res.json({ pipeline });

  } catch (error) {

    console.error("Claude API error:", error);

    res.status(500).json({
      error: "Claude API error",
      details: error.message
    });

  }

});


// ===== ANALYZE REPO =====
app.post("/analyze_repo", async (req, res) => {

  const { repo_url } = req.body;

  if (!repo_url) {
    return res.status(400).json({
      error: "repo_url is required"
    });
  }

  const repoName = repo_url.split("/").pop().replace(".git", "");

  // UPDATED: use /tmp for Render
  const tempDir = `/tmp/${repoName}`;

  try {

    console.log("Cloning repo:", repo_url);

    await fs.remove(tempDir);
    await git.clone(repo_url, tempDir);

    // ===== NEW: READ FULL TREE =====
    const structure = await getRepoTree(tempDir);

    console.log("Repo tree:");
    console.log(structure);

    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `
Analyze this repository structure and generate a GitHub Actions CI/CD pipeline.

Repository tree:

${structure}

Generate ONLY YAML.
`
        }
      ]
    });

    const pipeline = msg.content
      .map(b => b.text || "")
      .join("")
      .replace(/```yaml/g, "")
      .replace(/```/g, "")
      .trim();

    res.json({ pipeline });

  } catch (error) {

    console.error("Analyze repo error:", error);

    res.status(500).json({
      error: "Repo analysis failed",
      details: error.message
    });

  }

});


// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});