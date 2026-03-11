import { useState } from "react";

function App() {

  const [prompt, setPrompt] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Generate pipeline từ prompt
  const generatePipeline = async () => {

    setLoading(true);
    setError("");
    setResult("");

    try {

      const res = await fetch("http://localhost:5000/generate_pipeline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Server error");
      }

      setResult(data.workflow || data.pipeline);

    } catch (err) {

      console.error(err);
      setError("Failed to generate pipeline");

    }

    setLoading(false);
  };

  // Analyze repo và generate pipeline
  const analyzeRepo = async () => {

    setLoading(true);
    setError("");
    setResult("");

    try {

      const res = await fetch("http://localhost:5000/analyze_repo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repo_url: repoUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Server error");
      }

      setResult(data.workflow || data.pipeline);

    } catch (err) {

      console.error(err);
      setError("Failed to analyze repository");

    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 40, fontFamily: "Arial" }}>
      <h1>🚀 Agentic CI/CD Generator</h1>

      {/* Prompt Generator */}

      <h3>Generate from Description</h3>

      <input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Example: Node.js project with test and docker build"
        style={{
          width: 400,
          padding: 8,
          marginRight: 10,
        }}
      />

      <button
        onClick={generatePipeline}
        style={{
          padding: "8px 16px",
          cursor: "pointer",
        }}
      >
        {loading ? "Generating..." : "Generate"}
      </button>

      {/* Repo Analyzer */}

      <h3 style={{ marginTop: 30 }}>Analyze GitHub Repository</h3>

      <input
        value={repoUrl}
        onChange={(e) => setRepoUrl(e.target.value)}
        placeholder="https://github.com/user/repo"
        style={{
          width: 400,
          padding: 8,
          marginRight: 10,
        }}
      />

      <button
        onClick={analyzeRepo}
        style={{
          padding: "8px 16px",
          cursor: "pointer",
        }}
      >
        {loading ? "Analyzing..." : "Analyze Repo"}
      </button>

      {/* Error */}

      {error && (
        <p style={{ color: "red", marginTop: 20 }}>
          {error}
        </p>
      )}

      {/* Result */}

      {result && (
        <div style={{ marginTop: 30 }}>
          <h3>Generated GitHub Actions Workflow</h3>

          <pre
            style={{
              background: "#111",
              color: "#0f0",
              padding: 20,
              borderRadius: 8,
              overflowX: "auto",
            }}
          >
            {result}
          </pre>
        </div>
      )}

    </div>
  );
}

export default App;