import { Review, MediaType, WatchVerdict, ReviewStatus } from "../../src/types";

export interface ValidationError {
  field: string;
  message: string;
}

export function validateReviewInput(data: Partial<Review>): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!data.title || typeof data.title !== "string" || !data.title.trim()) {
    errors.push({ field: "title", message: "Title is required and must be a non-empty string." });
  }

  if (!data.longFormReview || typeof data.longFormReview !== "string" || !data.longFormReview.trim()) {
    errors.push({ field: "longFormReview", message: "Review content is required." });
  }

  if (data.releaseYear !== undefined && (isNaN(Number(data.releaseYear)) || Number(data.releaseYear) < 1888 || Number(data.releaseYear) > 2100)) {
    errors.push({ field: "releaseYear", message: "Release year must be a valid 4-digit year." });
  }

  if (data.abstractScore !== undefined) {
    const score = Number(data.abstractScore);
    if (isNaN(score) || score < 1 || score > 100) {
      errors.push({ field: "abstractScore", message: "Abstract score must be between 1 and 100 (or 1–10 normalized)." });
    }
  }

  const validTypes: MediaType[] = ["Movie", "Series", "Mini Series", "Anime", "Documentary", "Special"];
  if (data.type && !validTypes.includes(data.type)) {
    errors.push({ field: "type", message: `Content type must be one of: ${validTypes.join(", ")}` });
  }

  const validStatuses: ReviewStatus[] = ["published", "draft", "scheduled", "archived"];
  if (data.status && !validStatuses.includes(data.status)) {
    errors.push({ field: "status", message: `Status must be one of: ${validStatuses.join(", ")}` });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateSubscriberInput(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== "string") {
    return { valid: false, error: "Email is required." };
  }
  const clean = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(clean)) {
    return { valid: false, error: "Please provide a valid email address." };
  }
  return { valid: true };
}
