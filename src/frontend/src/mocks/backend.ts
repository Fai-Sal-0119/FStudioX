import type { backendInterface } from "../backend";

const samplePrincipal = { toText: () => "aaaaa-aa", _isPrincipal: true } as any;

export const mockBackend: backendInterface = {
  createProject: async (_title: string, _projectType: string, _content: string) => BigInt(1),
  deleteProject: async (_id: bigint) => undefined,
  getProject: async (_id: bigint) => ({
    title: "My First Project",
    content: JSON.stringify({ type: "photo", data: {} }),
    projectType: "photo",
    owner: samplePrincipal,
    createdAt: BigInt(Date.now() * 1_000_000),
    updatedAt: BigInt(Date.now() * 1_000_000),
  }),
  getProjects: async () => [
    {
      title: "My First Project",
      content: JSON.stringify({ type: "photo", data: {} }),
      projectType: "photo",
      owner: samplePrincipal,
      createdAt: BigInt(Date.now() * 1_000_000),
      updatedAt: BigInt(Date.now() * 1_000_000),
    },
    {
      title: "Video Edit 01",
      content: JSON.stringify({ type: "video", data: {} }),
      projectType: "video",
      owner: samplePrincipal,
      createdAt: BigInt(Date.now() * 1_000_000),
      updatedAt: BigInt(Date.now() * 1_000_000),
    },
  ],
  updateProject: async (_id: bigint, _title: string | null, _content: string | null) => undefined,
  setAiApiKey: async (_key: string) => undefined,
  processAiImage: async (_imageBase64: string, _operation: string) => ({
    __kind__: "ok" as const,
    ok: { mimeType: "image/png", imageBase64: "" },
  }),
  processAiAudio: async (_audioBase64: string, _operation: string) => ({
    __kind__: "ok" as const,
    ok: { audioBase64: "", metadata: "{}", mimeType: "audio/mp3" },
  }),
  processAiDesign: async (_prompt: string, _designType: string, _brandColors: string) => ({
    __kind__: "ok" as const,
    ok: { suggestions: "[]" },
  }),
  getAiPredictionStatus: async (_predictionId: string) => ({
    __kind__: "ok" as const,
    ok: { suggestions: "{}" },
  }),
};
