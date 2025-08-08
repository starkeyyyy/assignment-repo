import React , {useState , useEffect} from "react";
import {FolderOpen,
  FolderClosed,
  FileText,
FileCheck2,} from "lucide-react"


export function buildFileTree(files) {
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

export function FileTree({ tree, path = "", onFileClick, selectedFiles, toggleFile }) {
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