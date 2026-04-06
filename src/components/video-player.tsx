"use client";

import { useRef, useEffect } from "react";

interface VideoPlayerProps {
  src: string;
}

export function VideoPlayer({ src }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Prevent right-click on video
    const video = videoRef.current;
    if (!video) return;

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    video.addEventListener("contextmenu", handleContextMenu);

    return () => {
      video.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  return (
    <div
      className="relative bg-black rounded-lg overflow-hidden select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Transparent overlay to prevent drag-to-save */}
      <div className="absolute inset-0 z-10" style={{ pointerEvents: "none" }} />

      <video
        ref={videoRef}
        src={src}
        controls
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        playsInline
        className="w-full aspect-video"
        onContextMenu={(e) => e.preventDefault()}
      >
        Trình duyệt không hỗ trợ video.
      </video>
    </div>
  );
}
