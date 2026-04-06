import { z } from "zod/v4";

// ─── Courses ───

export const createCourseSchema = z.object({
  title: z.string().min(1, "Tên khóa học không được để trống").max(200),
  description: z.string().max(2000).optional(),
});

export const updateCourseSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  thumbnailR2Key: z.string().max(500).nullable().optional(),
  isPublished: z.boolean().optional(),
});

// ─── Sessions ───

export const createSessionSchema = z.object({
  title: z.string().min(1, "Tên buổi học không được để trống").max(200),
  description: z.string().max(2000).nullable().optional(),
});

export const updateSessionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  orderIndex: z.number().int().min(0).optional(),
});

// ─── Materials ───

export const createMaterialSchema = z.object({
  type: z.enum(["video", "pdf", "recap", "link"]),
  title: z.string().min(1).max(200),
  r2Key: z.string().max(500).nullable().optional(),
  hlsEncryptionKey: z.string().max(500).nullable().optional(),
  externalUrl: z.string().url().max(2000).nullable().optional(),
  contentText: z.string().max(50000).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const updateMaterialSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  r2Key: z.string().max(500).nullable().optional(),
  externalUrl: z.string().max(2000).nullable().optional(),
  contentText: z.string().max(50000).nullable().optional(),
});

// ─── Enrollments ───

export const enrollStudentSchema = z.object({
  userId: z.string().min(1),
  courseId: z.number().int().positive(),
});

export const selfEnrollSchema = z.object({
  courseId: z.number().int().positive(),
});

// ─── Progress ───

export const updateProgressSchema = z.object({
  sessionId: z.number().int().positive(),
  completed: z.boolean(),
});

// ─── Upload ───

export const uploadRequestSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1).max(100),
  courseId: z.union([z.string(), z.number()]),
  sessionId: z.number().int().positive(),
});
