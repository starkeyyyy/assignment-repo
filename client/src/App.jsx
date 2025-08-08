import React, { useEffect, useState , useRef } from "react";
import axios from "axios";
import {
  FolderOpen,
  FolderClosed,
  FileText,
  Github,
  FolderGit2,
  GitBranch,
  FolderGit,
  Wrench,
  BookOpenText,
  FileCode2,
  FileCheck2,
  Code,
  GitPullRequestCreateArrowIcon,
  TestTubeDiagonal,
  FlaskConical,
  GithubIcon,
} from "lucide-react";
import CodeHighlighter from "./components/code";
import Toast from "./components/toast"

function buildFileTree(files) {
  const root = {};

  files.forEach((file) => {
    const parts = file.path.split("/");
    let current = root;

    parts.forEach((part, idx) => {
      if (!current[part]) {
        current[part] = idx === parts.length - 1 ? { __file: file } : {};
      }
      current = current[part];
    });
  });

  return root;
}

function FileTree({ tree, path = "", onFileClick, selectedFiles, toggleFile }) {
  return (
    <ul className="">
      {Object.entries(tree).map(([key, value]) => {
        const fullPath = path ? `${path}/${key}` : key;

        if (value.__file) {
          const file = value.__file;
          const isSelected = selectedFiles.some((f) => f.path === file.path);

          return (
            <li
              key={fullPath}
              className="flex items-center py-2 px-4 text-gray-300 border rounded "
            >
              {isSelected ? (
                <FileCheck2 className="text-gray-400" />
              ) : (
                <FileText className="w-6 h-6 mr-1 text-gray-700" />
              )}
              <span
                className="hover:underline cursor-pointer text-[#5d1974]"
                onClick={() => onFileClick(file)}
              >
                {key}
              </span>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleFile(file)}
                className="ml-auto mr-3  w-5 h-5"
              />
            </li>
          );
        } else {
          // Controlled folder open/close state
          const [isOpen, setIsOpen] = useState(false);

          return (
            <li
              key={fullPath}
              className="px-4 border-gray-300 rounded border-1"
            >
              <div
                className="flex items-center cursor-pointer select-none py-2"
                onClick={() => setIsOpen((prev) => !prev)}
              >
                {isOpen ? (
                  <FolderOpen className="w-6 h-6 mr-1 text-yellow-500" />
                ) : (
                  <FolderClosed className="w-6 h-6 mr-1 text-yellow-500" />
                )}
                <span className="font-lg font-bold text-gray-700">{key}</span>
              </div>
              {isOpen && (
                <FileTree
                  tree={value}
                  path={fullPath}
                  onFileClick={onFileClick}
                  selectedFiles={selectedFiles}
                  toggleFile={toggleFile}
                />
              )}
            </li>
          );
        }
      })}
    </ul>
  );
}

function App() {
  const [repos, setRepos] = useState([]);
  const [files, setFiles] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [token, setToken] = useState("");
  const [selectedFileContent, setSelectedFileContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedFileToShow, setSelectedFileToShow] = useState(null);
  const [testSummaries, setTestSummaries] = useState({});
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [generatedTestCode, setGeneratedTestCode] = useState({});
  const [codeIsLoading, setCodeIsLoading] = useState(false);
  const [filesAreLoading, setFileAreLoading] = useState(false);
  const [summariesAreLoading, setSummariesAreLoading] = useState(false);
  const [testCodeIsLoading, setTestCaseIsLoading] = useState(false);
  const [pullRequestCreated, setPullRequestCreated] = useState(false);
  const toastRef = useRef();

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
      setCodeIsLoading(true);
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
    } finally {
      setCodeIsLoading(false);
    }
  };

  const getLanguage = (filename) => {
    console.log(filename);
    const ext = filename.split(".").pop();
    console.log(ext);
    switch (ext) {
      case "js":
        return "javascript";
      case "ts":
        return "typescript";
      case "py":
        return "python";
      case "java":
        return "java";
      case "json":
        return "json";
      case "md":
        return "markdown";
      case "html":
        return "html";
      case "css":
        return "css";
      default:
        return "plaintext";
    }
  };

  const getExtensionFromLanguage = (language) => {
    const map = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      java: "java",
      c: "c",
      cpp: "cpp",
      csharp: "cs",
      ruby: "rb",
      go: "go",
      rust: "rs",
      php: "php",
      swift: "swift",
      kotlin: "kt",
      scala: "scala",
      html: "html",
      css: "css",
      json: "json",
      yaml: "yaml",
      markdown: "md",
      shell: "sh",
      bash: "sh",
      sql: "sql",
      dart: "dart",
      r: "r",
    };

    return map[language.toLowerCase()] || "txt"; // default to txt
  };

  const handleRepoClick = async (repo) => {
    setFileAreLoading(true);
    setSelectedRepo(repo);
    const res = await axios.get(
      `http://localhost:5000/api/github/files/${repo.owner.login}/${repo.name}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    setFileAreLoading(false);
    setFiles(res.data);
  };

  const createPullRequest = async () => {
    toastRef.current.show("Creating the pull Request!!!!")
    try {
      setPullRequestCreated(true);
      const response = await axios.post(
        "http://localhost:5000/api/github/create-pr",
        {
          githubToken: token,
          owner: selectedRepo.owner.login,
          repo: selectedRepo.name,
          baseBranch: "main",
          newBranch: "add-ai-tests-" + Date.now(),
          filePath: `__tests__/ai-test-${
            selectedSummary?.fileName
          }.test.${getExtensionFromLanguage(generatedTestCode?.language)}`,
          testCode: generatedTestCode?.code,
        }
      );

      toastRef.current.show(`PR Created: ${response.data.pullRequestUrl}`);
      window.open(response.data.pullRequestUrl, "_blank");
    } catch (error) {
      console.error("Failed to create pull request", error);
      alert("❌ Failed to create pull request.");
    } finally {
      setPullRequestCreated(false);
    }
  };

  const generateSummaries = async () => {
    setSummariesAreLoading(true);
    try {
      const contents = await Promise.all(
        selectedFiles.map(async (file) => {
          const encodedPath = encodeURIComponent(file.path);
          const res = await axios.get(
            `http://localhost:5000/api/github/file-content/${selectedRepo.owner.login}/${selectedRepo.name}/main/${encodedPath}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          return {
            filename: file.path,
            content: res.data,
          };
        })
      );

      const response = await axios.post(
        "http://localhost:5000/api/test/generate-test-case-summaries",
        { files: contents }
      );

      setTestSummaries(response.data || {});
    } catch (err) {
      console.error("Error generating test case summaries", err);
    } finally {
      setSummariesAreLoading(false);
    }
  };

  const generateTestCode = async (summary, fileName) => {
    try {
      setTestCaseIsLoading(true);
      const contents = await Promise.all(
        selectedFiles.map(async (file) => {
          const encodedPath = encodeURIComponent(file.path);
          const res = await axios.get(
            `http://localhost:5000/api/github/file-content/${selectedRepo.owner.login}/${selectedRepo.name}/main/${encodedPath}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          return {
            filename: file.path,
            content: res.data,
          };
        })
      );

      const response = await axios.post(
        "http://localhost:5000/api/test/generate-test-code",
        {
          summary,
          files: contents,
        }
      );

      setSelectedSummary({ summary: summary, fileName: fileName });
      setGeneratedTestCode(response.data || "");
    } catch (err) {
      console.error("Error generating test code", err);
    } finally {
      setTestCaseIsLoading(false);
    }
  };

  return (
<div className="min-h-screen bg-[#F5EBFA] font-sans text-sm text-[#49225B] ">
  <Toast ref={toastRef}/>
  {!token && (
    <div className="bg-[#49225B] shadow p-7 absolute z-99 top-1/2 left-1/2 -translate-1/2 rounded-2xl flex flex-col items-center justify-center">
      <h1 className="text-xl font-semibold text-white py-1 px-3 rounded-xl mb-4">
        GitHub Test Case Generator
      </h1>
      <Github className="h-50 w-[100%] p-4 bg-white rounded-2xl"/>
      <a
        href="http://localhost:5000/api/github/login"
        className="bg-[#ffffff] hover:bg-[#796383] text-[#49225B]  hover:text-white px-4 py-2 mt-4 rounded-md text-sm font-semibold"
      >
        Sign in with GitHub
      </a>
    </div>
  )}

  <main className="bg-[#E7DBEF] py-6 px-4 flex h-screen gap-4 relative">
    {token && (
      <>
        {/* Repositories Section */}
        <section className="w-[20vw] bg-[#F5EBFA] rounded-md shadow p-4 overflow-y-hidden hover:overflow-y-auto max-h-[94vh]">
          <div className="flex gap-2">
            <FolderGit2 />
            <h2 className="text-lg font-semibold mb-3 text-[#49225B]">
              Your Repositories
            </h2>
          </div>
          
            <ul className="divide-y border rounded-md ">
              {repos.map((repo) => (
                <li
                  key={repo.id}
                  className="py-2 border-[#A56ABD] hover:bg-[#E7DBEF]"
                >
                  <button
                    onClick={() => handleRepoClick(repo)}
                    className="text-[#6E3482] hover:underline hover:cursor-pointer text-md font-medium flex gap-2 items-center ml-4"
                  >
                    <GitBranch className="text-[#49225B]" />
                    {repo.full_name}
                  </button>
                </li>
              ))}
            </ul>
          
        </section>

        {/* File Tree + Summary Section */}
        {selectedRepo && (
          <section className="w-[40vw] flex flex-col gap-4">
            {/* File Tree */}
            <div className="bg-[#F5EBFA] rounded-md shadow p-4">
              <div className="flex items-center ">
                <h3 className="text-lg font-semibold text-[#49225B] flex gap-2">
                  <FolderGit />
                  {selectedRepo.name}
                </h3>
                <button
                  className="ml-auto hover:underline flex gap-2 text-[#49225B] text-md px-3 py-2 rounded-2xl"
                  onClick={generateSummaries}
                >
                  <Wrench /> Generate
                </button>
              </div>
              <div className="border rounded-md max-h-[30vh] overflow-y-hidden hover:overflow-y-auto relative ">
                {filesAreLoading ? (
                  <div className="text-center font-semibold text-[#6E3482] h-screen mt-[12.5%]"><div className="loader ml-auto mr-auto mb-3"></div>Loading files...</div>
                ) : (
                  <FileTree
                    tree={buildFileTree(files)}
                    onFileClick={handleFileClick}
                    selectedFiles={selectedFiles}
                    toggleFile={(file) => {
                      setSelectedFiles((prev) =>
                        prev.some((f) => f.path === file.path)
                          ? prev.filter((f) => f.path !== file.path)
                          : [...prev, file]
                      );
                    }}
                  />
                )}
              </div>
            </div>

            {/* Test Summaries */}
            {summariesAreLoading ? 
                    <div className="text-center font-semibold text-[#6E3482] h-screen mt-[25%]"><div className="loader ml-auto mr-auto mb-3"></div>Generating Summaries...</div>
                   :testSummaries?.test_cases &&
              typeof testSummaries.test_cases === 'object' && (
                <div className="bg-[#F5EBFA] rounded-md shadow p-4 flex-1 overflow-y-hidden hover:overflow-y-auto">
                  <h3 className="text-lg font-semibold text-[#49225B] mb-2 flex gap-2 items-center">
                    <BookOpenText /> Test Case Summaries
                  </h3>
                   
                    <div className="border border-[#A56ABD] p-4 rounded">
                      <p className="text-[#49225B] mb-4">
                        {testSummaries?.analysis_and_summary}
                      </p>
                      <div className="space-y-4">
                        {Object.entries(testSummaries.test_cases).map(
                          ([fileName, testCases], idx) => (
                            <div
                              key={fileName + idx}
                              className="bg-[#e7dbefb6] p-3 rounded border border-[#A56ABD]"
                            >
                              <h4 className="font-semibold text-[#49225B] mb-2 text-[15px] flex gap-2 items-center">
                                <TestTubeDiagonal /> {fileName}
                              </h4>
                              <ul className="pl-5 space-y-2 border border-[#A56ABD] p-3 rounded">
                                {testCases.map((testCase, i) => (
                                  <li key={i} className="text-sm">
                                    <div className="flex justify-between items-center">
                                      <span className="text-[#49225B] font-medium">
                                        {testCase.name}
                                      </span>
                                      <button
                                        onClick={() => generateTestCode(testCase.description, fileName)}
                                        className="text-[#6E3482] hover:underline text-xs flex gap-2"
                                      >
                                        <Wrench /> Generate Code
                                      </button>
                                    </div>
                                    <p className="text-[#6E3482] text-xs ml-2">
                                      {testCase.description}
                                    </p>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )
                        )}
                      </div>
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-[#49225B] mb-2">
                          Remarks & Notes
                        </h3>
                        <p className="text-[#49225B] text-sm">
                          {testSummaries.remarks_and_notes}
                        </p>
                      </div>
                    </div>
                  
                </div>
              )}
          </section>
        )}

        {/* File View / Generated Code Section */}
        <section className="flex-1 bg-[#F5EBFA] rounded-md shadow p-4 overflow-hidden max-h-[94vh] relative flex flex-col">
          {testCodeIsLoading || codeIsLoading ? (
            <div className="text-center text-3xl font-bold text-[#6E3482] h-screen mt-[40%]"><div className="big-loader ml-auto mr-auto mb-10 "></div>Loading Code...</div>
          ) : !generatedTestCode.code && selectedFileContent ? (
            <>
              <h3 className="font-semibold text-lg text-[#49225B] mb-2 flex gap-2">
                <FileCode2 /> {selectedFileToShow.path.split("/").pop(0)}
              </h3>
              <CodeHighlighter
                code={selectedFileContent}
                language={getLanguage(selectedFileToShow?.path.split(".").pop())}
              />
            </>
          ) : generatedTestCode.code ? (
            <>
              <div className="flex items-center mb-2">
                <h4 className="font-semibold text-lg text-[#49225B] flex gap-2 items-center">
                  <Code /> Generated Test Code
                </h4>
                <button
                  onClick={createPullRequest}
                  className="ml-auto p-2 rounded-md cursor-pointer text-[#49225B] flex gap-2 items-center hover:underline"
                >
                  <GitPullRequestCreateArrowIcon className="font-semibold" /> Create PR
                </button>
              </div>
              <div className="border border-[#A56ABD] rounded p-4">
                <p className="text-sm text-[#49225B] mb-2">
                  {generatedTestCode.description_and_library} for <strong>{selectedSummary.fileName}</strong> for test case <strong>{selectedSummary.summary}</strong>
                </p>
                <CodeHighlighter
                  language={generatedTestCode.language}
                  code={generatedTestCode.code}
                />
              </div>
            </>
          ) : (
            <div className="m-auto relative flex-col items-center justify-center flex">
              <Github className="w-60 h-60 text-[#A56ABD]" />
              <div className="text-3xl font-extrabold text-[#6E3482]">Nothing Selected!!</div>
            </div>
          )}
        </section>
      </>
    )}
  </main>
  
</div>

  );
}

export default App;
