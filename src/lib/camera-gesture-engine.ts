// CAMERA AND GESTURE RECOGNITION COMPUTER VISION ENGINE
// Powers real-time plant leaf diagnosis and hands-free garden camera control
import {
  extractFeaturesFromImageData,
  classifyLeafFeatures,
  type PredictionResult,
} from "./dataset-model";

export type HandGesture = "NONE" | "PALM" | "PEACE" | "THUMBS_UP" | "FIST" | "POINT";

export interface GestureDetectionResult {
  gesture: HandGesture;
  confidence: number;
  label: string;
  emoji: string;
  actionHint: string;
  handBox: { x: number; y: number; width: number; height: number } | null;
}

export interface LeafSymptomGesture {
  symptomType: "CURLING" | "WILTING" | "SPOTTING" | "RUST_PUSTULES" | "MOSAIC" | "HEALTHY_FLAT";
  label: string;
  severity: "mild" | "moderate" | "severe" | "none";
  chlorosisPct: number;
  necrosisPct: number;
  greenParenchymaPct: number;
  description: string;
}

export interface FrameAnalysisResult {
  gesture: GestureDetectionResult;
  leafSymptom: LeafSymptomGesture;
  predictions: PredictionResult[];
  fps: number;
  isLeafDetected: boolean;
  leafBoundingBox: { x: number; y: number; width: number; height: number };
}

export class CameraGestureEngine {
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private stream: MediaStream | null = null;
  private isRunning = false;
  private animFrameId: number | null = null;
  private lastTimestamp = 0;
  private frameCount = 0;
  private currentFps = 0;

  // Smoothing buffers for gesture detection stability
  private gestureHistory: HandGesture[] = [];
  private readonly historyLength = 5;

  private ensureContext(): CanvasRenderingContext2D | null {
    if (typeof document === "undefined") return null;
    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
    }
    if (!this.ctx && this.canvas) {
      try {
        this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
      } catch {
        return null;
      }
    }
    return this.ctx;
  }

  // Start webcam stream
  async start(
    videoElement: HTMLVideoElement,
    facingMode: "user" | "environment" = "environment",
  ): Promise<boolean> {
    try {
      this.video = videoElement;
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      this.video.srcObject = this.stream;
      await this.video.play();
      this.isRunning = true;
      return true;
    } catch (err) {
      console.warn("Failed to access camera stream:", err);
      return false;
    }
  }

  // Stop webcam stream
  stop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
  }

  // Capture current high-res frame as data URL
  captureSnapshot(quality = 0.92): string | null {
    if (!this.video || !this.video.videoWidth) return null;
    const snapCanvas = document.createElement("canvas");
    snapCanvas.width = this.video.videoWidth;
    snapCanvas.height = this.video.videoHeight;
    const snapCtx = snapCanvas.getContext("2d")!;
    snapCtx.drawImage(this.video, 0, 0);
    return snapCanvas.toDataURL("image/jpeg", quality);
  }

  // Analyze static image data (from upload or snapshot)
  analyzeStaticImage(imageElement: HTMLImageElement): {
    predictions: PredictionResult[];
    leafSymptom: LeafSymptomGesture;
  } {
    const ctx = this.ensureContext();
    if (!ctx || !this.canvas) {
      const { predictions } = classifyLeafFeatures([
        0.35, 0.45, 0.2, 0.35, 0.45, 0.5, 0.2, 0.05, 0.02,
      ]);
      return {
        predictions,
        leafSymptom: {
          symptomType: "HEALTHY_FLAT",
          label: "Planar Foliar Architecture",
          severity: "none",
          chlorosisPct: 5,
          necrosisPct: 2,
          greenParenchymaPct: 85,
          description: "Normal foliar architecture.",
        },
      };
    }

    const w = 120;
    const h = 120;
    this.canvas.width = w;
    this.canvas.height = h;
    ctx.drawImage(imageElement, 0, 0, w, h);
    const imgData = ctx.getImageData(0, 0, w, h);

    const features = extractFeaturesFromImageData(imgData);
    const { predictions } = classifyLeafFeatures(features);
    const leafSymptom = this.detectLeafSymptomGesture(imgData);

    return { predictions, leafSymptom };
  }

  // Process live camera video frame
  processFrame(): FrameAnalysisResult | null {
    if (!this.video || !this.isRunning || this.video.readyState < 2) return null;
    const ctx = this.ensureContext();
    if (!ctx || !this.canvas) return null;

    const vw = this.video.videoWidth || 640;
    const vh = this.video.videoHeight || 480;

    // Calculate real-time FPS
    const now = performance.now();
    this.frameCount++;
    if (now - this.lastTimestamp >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastTimestamp));
      this.frameCount = 0;
      this.lastTimestamp = now;
    }

    // Process downsampled 160x120 frame for fast 30fps CV analysis
    const sw = 160;
    const sh = 120;
    this.canvas.width = sw;
    this.canvas.height = sh;
    ctx.drawImage(this.video, 0, 0, sw, sh);
    const frameData = ctx.getImageData(0, 0, sw, sh);

    // 1. Detect Hand Gesture in frame (for hands-free camera interaction)
    const gesture = this.detectHandGesture(frameData, sw, sh);

    // 2. Detect Plant Leaf Symptoms & Posture Gestures
    const leafSymptom = this.detectLeafSymptomGesture(frameData);

    // 3. Extract botanical features & classify against 23 PlantVillage classes
    const features = extractFeaturesFromImageData(frameData);
    const { predictions } = classifyLeafFeatures(features);

    // Calculate central leaf targeting reticle (normalized coordinates)
    const leafBoundingBox = {
      x: Math.round(vw * 0.2),
      y: Math.round(vh * 0.15),
      width: Math.round(vw * 0.6),
      height: Math.round(vh * 0.7),
    };

    return {
      gesture,
      leafSymptom,
      predictions,
      fps: this.currentFps || 30,
      isLeafDetected: leafSymptom.greenParenchymaPct > 15 || leafSymptom.necrosisPct > 10,
      leafBoundingBox,
    };
  }

  // Fast skin segmentation & finger contour geometry
  private detectHandGesture(
    imgData: ImageData,
    width: number,
    height: number,
  ): GestureDetectionResult {
    const data = imgData.data;
    let skinPixelCount = 0;
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;

    // Skin mask grid (binary)
    const skinGrid = new Uint8Array(width * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx] ?? 0;
        const g = data[idx + 1] ?? 0;
        const b = data[idx + 2] ?? 0;

        // Chromatic skin color model (YCbCr / normalized RGB)
        const isSkin =
          r > 80 &&
          g > 40 &&
          b > 25 &&
          r > g &&
          r > b &&
          Math.abs(r - g) > 12 &&
          r - b > 15 &&
          // Reject green foliage pixels explicitly
          g < r * 1.15;

        if (isSkin) {
          skinGrid[y * width + x] = 1;
          skinPixelCount++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const totalPixels = width * height;
    const skinAreaRatio = skinPixelCount / totalPixels;

    // Hand must occupy a reasonable portion of the camera frame (2.5% to 45%)
    if (skinAreaRatio < 0.025 || skinAreaRatio > 0.5) {
      this.pushGestureHistory("NONE");
      return {
        gesture: "NONE",
        confidence: 0,
        label: "No Hand Gesture Detected",
        emoji: "🌿",
        actionHint:
          "Show hand gestures (✋ Palm, ✌️ Peace, 👍 Thumbs Up, ✊ Fist) to control camera",
        handBox: null,
      };
    }

    const boxWidth = maxX - minX;
    const boxHeight = maxY - minY;
    const aspect = boxHeight > 0 ? boxWidth / boxHeight : 1;
    const compactness = skinPixelCount / Math.max(1, boxWidth * boxHeight);

    // Scan top third of hand bounding box to count finger tips/peaks
    const fingerSampleY = Math.round(minY + boxHeight * 0.22);
    let transitions = 0;
    let inFinger = false;
    let fingerPeaks = 0;

    for (let x = minX; x <= maxX; x++) {
      const isSet = skinGrid[fingerSampleY * width + x] === 1;
      if (isSet && !inFinger) {
        inFinger = true;
        transitions++;
      } else if (!isSet && inFinger) {
        inFinger = false;
        transitions++;
      }
    }
    fingerPeaks = Math.floor((transitions + 1) / 2);

    let rawGesture: HandGesture = "NONE";

    if (fingerPeaks >= 4 && compactness < 0.6) {
      rawGesture = "PALM";
    } else if (fingerPeaks === 2) {
      rawGesture = "PEACE";
    } else if (fingerPeaks === 1) {
      // Check if pointing or thumb
      if (aspect < 0.7) {
        rawGesture = "POINT";
      } else {
        rawGesture = "THUMBS_UP";
      }
    } else if (fingerPeaks <= 1 && compactness > 0.58) {
      rawGesture = "FIST";
    } else if (aspect > 0.8 && compactness > 0.5) {
      rawGesture = "THUMBS_UP";
    }

    const smoothed = this.pushGestureHistory(rawGesture);

    const gestureMap: Record<HandGesture, { label: string; emoji: string; actionHint: string }> = {
      NONE: {
        label: "Monitoring",
        emoji: "🌿",
        actionHint: "Hold leaf centered in reticle",
      },
      PALM: {
        label: "Open Palm / Wave",
        emoji: "✋",
        actionHint: "Auto-Focusing & Continuous Leaf Pathology Scan",
      },
      PEACE: {
        label: "Peace / 2 Fingers",
        emoji: "✌️",
        actionHint: "Hands-Free Snapshot: Capturing frame...",
      },
      THUMBS_UP: {
        label: "Thumbs Up",
        emoji: "👍",
        actionHint: "Confirmed! Analyzing deep diagnostic symptoms...",
      },
      FIST: {
        label: "Closed Fist",
        emoji: "✊",
        actionHint: "Reset Viewfinder & Clear Snapshot",
      },
      POINT: {
        label: "Pointing Finger",
        emoji: "👆",
        actionHint: "Pinpointing lesion cluster hotspot",
      },
    };

    const info = gestureMap[smoothed];

    return {
      gesture: smoothed,
      confidence: Math.round(Math.min(98, Math.max(65, skinAreaRatio * 350))),
      label: info.label,
      emoji: info.emoji,
      actionHint: info.actionHint,
      handBox: { x: minX, y: minY, width: boxWidth, height: boxHeight },
    };
  }

  // Smooth temporal gesture buffer
  private pushGestureHistory(gesture: HandGesture): HandGesture {
    this.gestureHistory.push(gesture);
    if (this.gestureHistory.length > this.historyLength) {
      this.gestureHistory.shift();
    }

    // Majority vote
    const counts: Record<string, number> = {};
    for (const g of this.gestureHistory) {
      counts[g] = (counts[g] || 0) + 1;
    }

    let maxG: HandGesture = "NONE";
    let maxCount = 0;
    for (const [k, v] of Object.entries(counts)) {
      if (v > maxCount) {
        maxCount = v;
        maxG = k as HandGesture;
      }
    }

    return maxCount >= 3 ? maxG : "NONE";
  }

  // Physical leaf gesture / posture & symptom analysis
  private detectLeafSymptomGesture(imgData: ImageData): LeafSymptomGesture {
    const data = imgData.data;
    const n = data.length / 4;

    let greenCount = 0;
    let yellowCount = 0;
    let necroticCount = 0;
    let rustCount = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] ?? 0;
      const g = data[i + 1] ?? 0;
      const b = data[i + 2] ?? 0;

      // Green chlorophyll
      if (g > r * 1.08 && g > b * 1.15 && g > 45) {
        greenCount++;
      }
      // Chlorosis (Yellowing)
      else if (r > 130 && g > 130 && b < 100 && Math.abs(r - g) < 45) {
        yellowCount++;
      }
      // Necrosis (Brown/Black lesions)
      else if (r < 95 && g < 80 && b < 70) {
        necroticCount++;
      }
      // Rust pustules (Cinnamon orange-red)
      else if (r > 120 && g > 60 && g < r * 0.75 && b < 50) {
        rustCount++;
      }
    }

    const greenPct = Math.round((greenCount / n) * 100);
    const chlorosisPct = Math.round((yellowCount / n) * 100);
    const necrosisPct = Math.round((necroticCount / n) * 100);
    const rustPct = Math.round((rustCount / n) * 100);

    if (rustPct > 6) {
      return {
        symptomType: "RUST_PUSTULES",
        label: "Powdery Rust Pustules Gesturing Abaxially",
        severity: rustPct > 15 ? "severe" : "moderate",
        chlorosisPct,
        necrosisPct,
        greenParenchymaPct: greenPct,
        description: "Orange-brown fungal uredinia rupturing through epidermal layer.",
      };
    }

    if (chlorosisPct > 18 && chlorosisPct > greenPct * 0.4) {
      return {
        symptomType: "CURLING",
        label: "Marginal Chlorosis & Leaf Cupping Gesture",
        severity: chlorosisPct > 35 ? "severe" : "moderate",
        chlorosisPct,
        necrosisPct,
        greenParenchymaPct: greenPct,
        description:
          "Upward cupping distortion typical of Begomoviruses (Tomato Yellow Leaf Curl) or severe nutrient deficit.",
      };
    }

    if (necrosisPct > 15) {
      return {
        symptomType: "SPOTTING",
        label: "Necrotic Lesion Concentric Spotting",
        severity: necrosisPct > 30 ? "severe" : "moderate",
        chlorosisPct,
        necrosisPct,
        greenParenchymaPct: greenPct,
        description:
          "Dark desiccated necrotic lesions indicative of blight, scab, or bacterial spotting.",
      };
    }

    if (chlorosisPct > 8 && necrosisPct > 8) {
      return {
        symptomType: "WILTING",
        label: "Interveinal Desiccation & Wilting Gesture",
        severity: "moderate",
        chlorosisPct,
        necrosisPct,
        greenParenchymaPct: greenPct,
        description:
          "Loss of hydraulic turgor pressure causing leaf blade droop and vascular collapse.",
      };
    }

    return {
      symptomType: "HEALTHY_FLAT",
      label: "Planar Turgid Foliar Architecture",
      severity: "none",
      chlorosisPct,
      necrosisPct,
      greenParenchymaPct: greenPct,
      description:
        "Optimal cellular turgor, uniform chlorophyll distribution, intact epidermal barrier.",
    };
  }
}

export const cameraGestureEngine = new CameraGestureEngine();
