"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { Camera, CameraOff, CheckCircle2, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SelfieCaptureCardProps = {
  onCaptured: (file: File) => void;
};

export function SelfieCaptureCard({ onCaptured }: SelfieCaptureCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 720 },
          height: { ideal: 960 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOpen(true);
    } catch {
      toast.error("Nao foi possivel acessar a camera.");
    }
  };

  const capture = async () => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) {
      toast.error("Falha ao capturar selfie.");
      return;
    }

    const sourceFile = new File([blob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" });
    const compressed = await imageCompression(sourceFile, {
      maxWidthOrHeight: 720,
      maxSizeMB: 0.4,
      useWebWorker: true,
    });

    setPreview(URL.createObjectURL(compressed));
    onCaptured(compressed);
    stopCamera();
    toast.success("Selfie capturada e comprimida.");
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <Card className="ink-chip border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Camera className="h-5 w-5 text-primary" />
          Selfie obrigatoria
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-hidden rounded-[24px] border border-border bg-white/55 dark:bg-white/6">
          {preview ? (
            <div className="relative aspect-[4/5] w-full">
              <Image
                src={preview}
                alt="Preview da selfie capturada"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          ) : (
            <video ref={videoRef} autoPlay muted playsInline className="aspect-[4/5] w-full object-cover" />
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="flex gap-2">
          {!cameraOpen ? (
            <Button type="button" className="flex-1 rounded-[20px]" onClick={startCamera}>
              {preview ? <RefreshCcw className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
              {preview ? "Refazer selfie" : "Abrir camera"}
            </Button>
          ) : (
            <>
              <Button type="button" className="flex-1 rounded-[20px]" onClick={capture}>
                <CheckCircle2 className="h-4 w-4" />
                Capturar
              </Button>
              <Button type="button" variant="outline" className="rounded-[20px]" onClick={stopCamera}>
                <CameraOff className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
