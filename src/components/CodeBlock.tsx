import React, { useState } from 'react';
import { Check, Copy, Download, FileArchive } from 'lucide-react';
import { motion } from 'motion/react';
import JSZip from 'jszip';

export interface FileData {
  filename: string;
  code: string;
}

export function CodeBlock({ files }: { files: FileData[] }) {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const activeFile = files[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([activeFile.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    files.forEach(file => {
      zip.file(file.filename, file.code);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'winjdk-manager.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-zinc-950 rounded-xl overflow-hidden shadow-2xl border border-zinc-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800 gap-3 sm:gap-0">
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 mr-4">
            <div className="w-3 h-3 rounded-full bg-zinc-700"></div>
            <div className="w-3 h-3 rounded-full bg-zinc-700"></div>
            <div className="w-3 h-3 rounded-full bg-zinc-700"></div>
          </div>
          <div className="flex space-x-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {files.map((file, index) => (
              <button
                key={file.filename}
                onClick={() => setActiveTab(index)}
                className={`px-3 py-1 text-xs font-mono rounded-md transition-colors whitespace-nowrap ${
                  activeTab === index
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                }`}
              >
                {file.filename}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center justify-center flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 rounded-md hover:bg-zinc-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center justify-center flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 rounded-md hover:bg-zinc-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            <span className="hidden sm:inline">Download File</span>
            <span className="sm:hidden">File</span>
          </button>
          <button
            onClick={handleDownloadZip}
            className="flex items-center justify-center flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium text-zinc-950 bg-emerald-400 rounded-md hover:bg-emerald-300 transition-colors"
          >
            <FileArchive className="w-3.5 h-3.5 mr-1.5" />
            <span className="hidden sm:inline">Download ZIP</span>
            <span className="sm:hidden">ZIP</span>
          </button>
        </div>
      </div>
      <div className="p-4 h-[500px] overflow-y-auto bg-zinc-950">
        <pre className="text-sm font-mono text-zinc-300 whitespace-pre-wrap">
          <code>{activeFile.code}</code>
        </pre>
      </div>
    </div>
  );
}
