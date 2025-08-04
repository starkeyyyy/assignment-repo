import React, { useEffect, useState } from "react";
import axios from "axios";
import Editor from "@monaco-editor/react";

function App() {
  const [repos, setRepos] = useState([]);
  const [files, setFiles] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [token, setToken] = useState("");
  const [selectedFileContent, setSelectedFileContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedFileToShow , setSelectedFileToShow] = useState(null);


  useEffect(() => {
    const url = new URL(window.location.href);
    const accessToken = url.searchParams.get("token");
    if (accessToken) {
      setToken(accessToken);
    }
  }, []);

  useEffect(() => {
    if (token) {
      axios
        .get("http://localhost:5000/api/github/repos", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setRepos(res.data))
        .catch(console.error);
    }
  }, [token]);

  const handleFileClick = async (file) => {
    try {
      const encodedPath = encodeURIComponent(file.path);
      setSelectedFileToShow(file);
      const res = await axios.get(
        `http://localhost:5000/api/github/file-content/${selectedRepo.owner.login}/${selectedRepo.name}/main/${encodedPath}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSelectedFileContent(res.data);
    } catch (error) {
      setSelectedFileContent("⚠️ Unable to load file content.");
      console.error(error);
    }
  };

  const getLanguage = (filename) => {
  const ext = filename.split('.').pop();
  switch (ext) {
    case 'js': return 'javascript';
    case 'ts': return 'typescript';
    case 'py': return 'python';
    case 'java': return 'java';
    case 'json': return 'json';
    case 'md': return 'markdown';
    case 'html': return 'html';
    case 'css': return 'css';
    default: return 'plaintext';
  }
};


  const handleRepoClick = async (repo) => {
    setSelectedRepo(repo);
    const res = await axios.get(
      `http://localhost:5000/api/github/files/${repo.owner.login}/${repo.name}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    setFiles(res.data);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-sm text-gray-900">
      <header className="bg-white shadow p-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">
          GitHub Test Case Generator
        </h1>
        {!token && (
          <a
            href="http://localhost:5000/api/github/login"
            className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Sign in with GitHub
          </a>
        )}
      </header>

      <main className="max-w-5xl mx-auto py-6 px-4">
        {token && (
          <>
            <section className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Your Repositories</h2>
              <ul className="bg-white rounded-md shadow border divide-y">
                {repos.map((repo) => (
                  <li key={repo.id} className="hover:bg-gray-50">
                    <button
                      onClick={() => handleRepoClick(repo)}
                      className="w-full text-left px-4 py-3 font-medium text-blue-600 hover:underline"
                    >
                      {repo.full_name}
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            {selectedRepo && (
              <section>
                <h3 className="text-md font-semibold mb-2">
                  Files in{" "}
                  <span className="text-gray-600">{selectedRepo.name}</span>:
                </h3>
                <ul className="bg-white rounded-md shadow border divide-y max-h-[400px] overflow-y-auto">
  {files.map((file) => (
    <li
      key={file.path}
      className="flex items-center px-4 py-2 hover:bg-gray-50"
    >
      <input
        type="checkbox"
        className="mr-2"
        checked={selectedFiles.includes(file)}
        onChange={(e) => {
          if (e.target.checked) {
            setSelectedFiles(prev => [...prev, file]);
          } else {
            setSelectedFiles(prev => prev.filter(f => f.path !== file.path));
          }
        }}
      />
      <span
        onClick={() => handleFileClick(file)}
        className="text-gray-700 hover:underline cursor-pointer"
      >
        {file.path}
      </span>
    </li>
  ))}
</ul>

              </section>
            )}

            {selectedFileContent && (
              <div className="mt-6 bg-white border rounded-md shadow p-4 whitespace-pre overflow-auto max-h-[400px]">
                <h4 className="font-bold mb-2">File Content:</h4>
                <Editor
                  height="400px"
                  language={getLanguage(selectedFileToShow?.path || "")}
                  value={selectedFileContent}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    automaticLayout: true,
                  }}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
