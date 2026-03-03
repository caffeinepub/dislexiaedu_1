import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface PdfMetadata {
    name: string;
    blobId: string;
    sizeBytes: bigint;
    uploadedAt: Time;
}
export interface StudySession {
    subject: string;
    date: Time;
    durationMinutes: bigint;
}
export interface PointsTransaction {
    timestamp: Time;
    points: bigint;
    eventType: string;
}
export interface UserProfile {
    fontFamily: FontFamily;
    highContrast: boolean;
    fontSize: bigint;
    lineSpacing: bigint;
    letterSpacing: bigint;
}
export enum FontFamily {
    arial = "arial",
    sansSerif = "sansSerif",
    verdana = "verdana",
    openDyslexic = "openDyslexic"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addGlossaryTerm(term: string, definition: string): Promise<void>;
    addPdfMetadata(name: string, blobId: string, sizeBytes: bigint): Promise<void>;
    addPoints(eventType: string, points: bigint): Promise<void>;
    addTip(tip: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deletePdfMetadata(blobId: string): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getGlossary(): Promise<Array<[string, string]>>;
    getPointsHistory(): Promise<Array<PointsTransaction>>;
    getStudySessions(user: Principal): Promise<Array<StudySession>>;
    getTips(): Promise<Array<string>>;
    getUserPdfs(): Promise<Array<PdfMetadata>>;
    getUserPoints(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    logStudySession(subject: string, duration: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchGlossary(term: string): Promise<string | null>;
}
