"use client";

import { useState, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface FileUploadProps {
  courseId: string | number;
  sessionId: number;
  accept?: string;
  onUploadComplete: (key: string, file: File) => void;
}

export function FileUpload({ courseId, sessionId, accept, onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setFileName(file.name);
    setProgress(5);

    try {
      // Get presigned URL
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          courseId,
          sessionId,
        }),
      });

      if (!res.ok) throw new Error("Không thể tạo upload URL");
      const { uploadUrl, key } = await res.json();
      setProgress(15);

      // Upload with XMLHttpRequest for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setProgress(15 + Math.round((e.loaded / e.total) * 80));
          }
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setProgress(100);
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        });
        xhr.addEventListener("error", () => reject(new Error("Upload failed")));
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      onUploadComplete(key, file);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload thất bại");
    } finally {
      setUploading(false);
      setProgress(0);
      setFileName("");
    }
  }

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer
        ${dragOver
          ? "border-primary bg-primary/5 scale-[1.01]"
          : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50"
        }
        ${uploading ? "pointer-events-none" : ""}
      `}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={async (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
      onClick={() => !uploading && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept || "video/*,.pdf,.ppt,.pptx,image/*"}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {uploading ? (
        <div className="space-y-3">
          <div className="text-sm font-medium">{fileName}</div>
          <Progress value={progress} className="h-2 w-64 mx-auto" />
          <div className="text-xs text-muted-foreground">
            {progress < 100 ? `Đang upload... ${progress}%` : "Hoàn tất!"}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-3xl">
            {dragOver ? "📥" : "📁"}
          </div>
          <div className="text-sm text-muted-foreground">
            Kéo thả file hoặc{" "}
            <span className="text-primary font-medium">bấm để chọn</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Video, PDF, Slide, Hình ảnh
          </div>
        </div>
      )}
    </div>
  );
}
