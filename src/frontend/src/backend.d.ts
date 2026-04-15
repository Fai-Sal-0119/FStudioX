import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type AiAudioResult = {
    __kind__: "ok";
    ok: {
        audioBase64: string;
        metadata: string;
        mimeType: string;
    };
} | {
    __kind__: "err";
    err: string;
};
export type Time = bigint;
export interface Project {
    title: string;
    content: string;
    projectType: string;
    owner: Principal;
    createdAt: Time;
    updatedAt: Time;
}
export type AiImageResult = {
    __kind__: "ok";
    ok: {
        mimeType: string;
        imageBase64: string;
    };
} | {
    __kind__: "err";
    err: string;
};
export type AiDesignResult = {
    __kind__: "ok";
    ok: {
        suggestions: string;
    };
} | {
    __kind__: "err";
    err: string;
};
export interface backendInterface {
    createProject(title: string, projectType: string, content: string): Promise<bigint>;
    deleteProject(id: bigint): Promise<void>;
    /**
     * / Poll a Replicate prediction by ID to check if it has completed.
     * / Returns the raw JSON response from Replicate (status, output, error fields).
     */
    getAiPredictionStatus(predictionId: string): Promise<AiDesignResult>;
    getProject(id: bigint): Promise<Project>;
    getProjects(): Promise<Array<Project>>;
    /**
     * / Process base64-encoded audio using an AI operation.
     * / operation: "vocals_separate" | "enhance_voice" | "normalize"
     * / Returns processed audio as base64 or a mock if no API key is set.
     */
    processAiAudio(audioBase64: string, operation: string): Promise<AiAudioResult>;
    /**
     * / Get AI-powered design suggestions: font matches, color palettes, text suggestions.
     * / Returns JSON string with suggestions array.
     */
    processAiDesign(prompt: string, designType: string, brandColors: string): Promise<AiDesignResult>;
    /**
     * / Process a base64-encoded image using an AI operation.
     * / operation: "colorize" | "cartoon" | "portrait_blur" | "object_remove" | "age_filter"
     * / Returns the processed image as base64 or a mock if no API key is set.
     */
    processAiImage(imageBase64: string, operation: string): Promise<AiImageResult>;
    setAiApiKey(key: string): Promise<void>;
    updateProject(id: bigint, title: string | null, content: string | null): Promise<void>;
}
