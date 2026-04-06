"use client";

import { useRef, useEffect } from "react";

interface VideoPlayerProps {
  src: string;
}

export function VideoPlayer({ src }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const prevent = (e: MouseEvent) => e.preventDefault();
    video.addEventListener("contextmenu", prevent);
    return () => video.removeEventListener("contextmenu", prevent);
  }, []);

  return (
    <div
      className="relative bg-black rounded-lg overflow-hidden shadow-lg"
      onContextMenu={(e) => e.preventDefault()}
    >
      <video
        ref={videoRef}
        src={src}
        controls
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        playsInline
        className="w-full aspect-video"
      />
    </div>
  );
}
