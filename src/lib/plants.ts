export type WateringState = "ok" | "due" | "overdue";

export function wateringStatus(
  lastWateredAt: string | null,
  intervalDays: number,
): { state: WateringState; label: string } {
  const interval = Math.max(1, intervalDays || 7);
  if (!lastWateredAt) {
    return { state: "due", label: "Water now" };
  }
  const next = new Date(lastWateredAt);
  next.setDate(next.getDate() + interval);
  const diffDays = Math.ceil((next.getTime() - Date.now()) / 86_400_000);
  if (diffDays < 0) {
    return { state: "overdue", label: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"}` };
  }
  if (diffDays === 0) {
    return { state: "due", label: "Water today" };
  }
  return { state: "ok", label: `Next in ${diffDays} day${diffDays === 1 ? "" : "s"}` };
}

export const healthStyles: Record<string, { label: string; className: string }> = {
  healthy: { label: "Healthy", className: "bg-leaf-soft text-leaf" },
  needs_attention: { label: "Needs attention", className: "bg-sandy/60 text-sienna-deep" },
  diseased: { label: "Diseased", className: "bg-destructive/10 text-destructive" },
};

export const severityStyles: Record<string, { label: string; className: string }> = {
  mild: { label: "Mild", className: "bg-leaf-soft text-leaf" },
  moderate: { label: "Moderate", className: "bg-sandy/60 text-sienna-deep" },
  severe: { label: "Severe", className: "bg-destructive/10 text-destructive" },
};

export const wateringStateStyles: Record<WateringState, string> = {
  ok: "bg-leaf-soft text-leaf",
  due: "bg-sandy/60 text-sienna-deep",
  overdue: "bg-destructive/10 text-destructive",
};

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Downscale an image file in the browser to keep AI payloads small,
 * returning a JPEG data URL.
 */
export async function fileToResizedDataUrl(file: File, maxSize = 1280, quality = 0.82): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported in this browser");
    ctx.drawImage(bitmap, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    bitmap.close();
  }
}
