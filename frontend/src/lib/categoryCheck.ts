// Free, key-free AI check that runs in the browser (CLIP zero-shot via transformers.js).
// It only answers one question: does the captured photo/video visually show the chosen category?
import type { Department } from "@/lib/types";

export interface CategoryCheckResult {
  /** null = the AI model could not run on this device */
  match: boolean | null;
  confidence: number;
  detectedLabel: string;
  message: string;
}

type Classifier = (
  image: string | string[],
  labels: string[],
  options?: { hypothesis_template?: string },
) => Promise<Array<{ label: string; score: number }> | Array<Array<{ label: string; score: number }>>>;

const MODEL = "Xenova/clip-vit-base-patch32";

const UNRELATED = [
  "a selfie or portrait of a person's face",
  "the inside of a clean room",
  "a computer or phone screen",
  "a blank, dark or blurry picture",
  "a plate of food",
  "a pet animal",
];

let loader: Promise<Classifier> | null = null;

export function loadCategoryModel(): Promise<Classifier> {
  if (!loader) {
    loader = import("@huggingface/transformers")
      .then(async ({ pipeline }) => {
        const pipe = await pipeline("zero-shot-image-classification", MODEL);
        return pipe as unknown as Classifier;
      })
      .catch((error) => {
        loader = null; // allow a retry next time
        throw error;
      });
  }
  return loader;
}

function labelFor(department: Department) {
  return `${department.name.toLowerCase()} problem: ${department.description.toLowerCase()}`;
}

/** Grab up to `count` evenly spaced frames from a recorded video as JPEG data URLs. */
export async function videoFrames(blob: Blob, count = 3): Promise<string[]> {
  const url = URL.createObjectURL(blob);
  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.src = url;
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error("video unreadable"));
    });
    // MediaRecorder webm files often report Infinity duration until seeked to the end.
    if (!Number.isFinite(video.duration)) {
      video.currentTime = 1e6;
      await new Promise((r) => (video.onseeked = r));
    }
    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d")!;
    const frames: string[] = [];
    for (let i = 0; i < count; i++) {
      video.currentTime = Math.min(duration - 0.05, (duration * (i + 0.5)) / count);
      await new Promise((r) => (video.onseeked = r));
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push(canvas.toDataURL("image/jpeg", 0.85));
    }
    return frames;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function checkCategory(
  blob: Blob,
  selected: Department,
  all: Department[],
): Promise<CategoryCheckResult> {
  const isVideo = blob.type.startsWith("video/");
  let classifier: Classifier;
  try {
    classifier = await loadCategoryModel().catch(() => loadCategoryModel());
  } catch {
    return {
      match: null,
      confidence: 0,
      detectedLabel: "",
      message: "The AI checker could not load (check your internet once). You can still submit.",
    };
  }

  try {
    const images = isVideo ? await videoFrames(blob) : [await blobToDataUrl(blob)];
    const categoryLabels = all.map(labelFor);
    const labels = [...categoryLabels, ...UNRELATED];
    const totals = new Map<string, number>();
    for (const image of images) {
      const raw = await classifier(image, labels, { hypothesis_template: "a photo of {}" });
      const scores = (Array.isArray(raw[0]) ? raw[0] : raw) as Array<{ label: string; score: number }>;
      for (const s of scores) totals.set(s.label, (totals.get(s.label) ?? 0) + s.score / images.length);
    }
    const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    const target = labelFor(selected);
    const targetScore = totals.get(target) ?? 0;
    const rank = ranked.findIndex(([label]) => label === target);
    const top = ranked[0];
    const topIsUnrelated = UNRELATED.includes(top[0]);
    const match = rank === 0 || (rank <= 1 && targetScore >= 0.15 && !topIsUnrelated);
    const topName = topIsUnrelated
      ? top[0]
      : all.find((d) => labelFor(d) === top[0])?.name ?? top[0];
    return {
      match,
      confidence: targetScore,
      detectedLabel: topName,
      message: match
        ? `Looks like a ${selected.name} issue (${Math.round(targetScore * 100)}%).`
        : `This ${isVideo ? "video" : "photo"} looks like "${topName}", not ${selected.name}. Capture the problem clearly and try again.`,
    };
  } catch {
    return {
      match: null,
      confidence: 0,
      detectedLabel: "",
      message: "The AI checker could not read this capture. You can still submit.",
    };
  }
}
