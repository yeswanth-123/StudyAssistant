"use client";

import React, { useCallback, useState } from "react";
import { FiUpload, FiLink, FiFile, FiX, FiFileText } from "react-icons/fi";

interface UploadSectionProps {
  onUploadComplete: (sessionId: string) => void;
  sessionId: string | null;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
}

type InputMode = "file" | "url" | "text";

export default function UploadSection({
  onUploadComplete,
  sessionId,
  isLoading,
  setIsLoading,
}: UploadSectionProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [url, setUrl] = useState("");
  const [textInput, setTextInput] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("file");

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
    setInputMode("file");
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const hasContent = files.length > 0 || url.trim() || textInput.trim();

  const handleSubmit = async () => {
    if (!hasContent) {
      setError("Please upload a file, enter a URL, or paste text");
      return;
    }

    setError("");
    setIsLoading(true);
    let currentSessionId = sessionId;

    try {
      const { uploadFile, uploadUrl, uploadText } = await import("@/lib/api");

      // Upload files
      for (let i = 0; i < files.length; i++) {
        setUploadProgress(`Uploading file ${i + 1} of ${files.length}: ${files[i].name}...`);
        const result = await uploadFile(files[i], currentSessionId || undefined);
        currentSessionId = result.session_id;
      }

      // Upload URL
      if (url.trim()) {
        setUploadProgress("Processing URL...");
        const result = await uploadUrl(url.trim(), currentSessionId || undefined);
        currentSessionId = result.session_id;
      }

      // Upload text
      if (textInput.trim()) {
        setUploadProgress("Processing text...");
        const result = await uploadText(
          textInput.trim(),
          textTitle.trim() || "Pasted Text",
          currentSessionId || undefined
        );
        currentSessionId = result.session_id;
      }

      if (currentSessionId) {
        onUploadComplete(currentSessionId);
      }

      setFiles([]);
      setUrl("");
      setTextInput("");
      setTextTitle("");
      setUploadProgress("");
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Upload failed");
    } finally {
      setIsLoading(false);
      setUploadProgress("");
    }
  };

  const modeTabs: { key: InputMode; label: string; icon: React.ReactNode }[] = [
    { key: "file", label: "File", icon: <FiUpload size={14} /> },
    { key: "url", label: "URL", icon: <FiLink size={14} /> },
    { key: "text", label: "Text", icon: <FiFileText size={14} /> },
  ];

  return (
    <div className="glass rounded-2xl p-6 glow-blue">
      <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
        <FiUpload className="text-blue-400" />
        Upload Study Material
      </h2>

      {/* Input Mode Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-lg p-1 mb-4">
        {modeTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setInputMode(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
              inputMode === tab.key
                ? "bg-blue-600/80 text-white shadow-lg shadow-blue-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* File Upload Mode */}
      {inputMode === "file" && (
        <>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              dragActive
                ? "border-blue-400 bg-blue-500/10"
                : "border-white/10 hover:border-blue-400/50 hover:bg-white/[0.02]"
            }`}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <FiUpload className="mx-auto text-4xl text-slate-500 mb-3" />
            <p className="text-slate-300 font-medium">
              Drag & drop files here, or click to browse
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Supports PDF, images, audio, ZIP files
            </p>
            <input
              id="file-input"
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.gif,.bmp,.mp3,.wav,.ogg,.flac,.m4a,.zip,.txt,.md,.mp4,.mkv,.avi,.mov,.webm,.flv,.wmv"
            />
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-2 border border-white/5"
                >
                  <div className="flex items-center gap-2">
                    <FiFile className="text-blue-400" />
                    <span className="text-sm text-slate-300 truncate max-w-xs">
                      {file.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      ({(file.size / 1024 / 1024).toFixed(1)} MB)
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <FiX />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* URL Input Mode */}
      {inputMode === "url" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FiLink className="text-slate-500" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube URL here..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>
          <p className="text-xs text-slate-500 pl-7">
            Supports YouTube video URLs for transcript extraction
          </p>
        </div>
      )}

      {/* Text Input Mode */}
      {inputMode === "text" && (
        <div className="space-y-3">
          <input
            type="text"
            value={textTitle}
            onChange={(e) => setTextTitle(e.target.value)}
            placeholder="Title (optional)..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all"
          />
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Paste or type your study content here..."
            rows={6}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all resize-none"
          />
          <p className="text-xs text-slate-500">
            Paste notes, textbook excerpts, or any study content directly
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 text-red-300 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {/* Progress */}
      {uploadProgress && (
        <div className="mt-3 text-blue-300 text-sm bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2">
          {uploadProgress}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isLoading || !hasContent}
        className={`mt-4 w-full py-3 rounded-xl font-semibold text-white transition-all ${
          isLoading || !hasContent
            ? "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5"
            : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="loading-dots">
              <span></span><span></span><span></span>
            </span>
            Processing...
          </span>
        ) : (
          "Upload & Process"
        )}
      </button>
    </div>
  );
}
