import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum,
  uuid,
  serial,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ───

export const userRoleEnum = pgEnum("user_role", ["admin", "instructor", "student"]);
export const materialTypeEnum = pgEnum("material_type", ["video", "pdf", "recap", "link"]);

// ─── Users (Better Auth compatible) ───

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("student"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Courses ───

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  thumbnailR2Key: text("thumbnail_r2_key"),
  instructorId: text("instructor_id").references(() => user.id),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Course Sessions (Lessons) ───

export const courseSessions = pgTable("course_sessions", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Session Materials ───

export const sessionMaterials = pgTable("session_materials", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .notNull()
    .references(() => courseSessions.id, { onDelete: "cascade" }),
  type: materialTypeEnum("type").notNull(),
  title: text("title").notNull(),
  r2Key: text("r2_key"),
  hlsEncryptionKey: text("hls_encryption_key"), // AES-128 key for video (stored here, NOT on R2)
  externalUrl: text("external_url"),
  contentText: text("content_text"), // Markdown for recap
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Enrollments ───

export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  courseId: integer("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
  lastAccessedAt: timestamp("last_accessed_at"),
});

// ─── Progress ───

export const progress = pgTable("progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  sessionId: integer("session_id")
    .notNull()
    .references(() => courseSessions.id, { onDelete: "cascade" }),
  completed: boolean("completed").notNull().default(false),
  watchSeconds: integer("watch_seconds").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Relations ───

export const userRelations = relations(user, ({ many }) => ({
  enrollments: many(enrollments),
  progress: many(progress),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  instructor: one(user, {
    fields: [courses.instructorId],
    references: [user.id],
  }),
  sessions: many(courseSessions),
  enrollments: many(enrollments),
}));

export const courseSessionsRelations = relations(courseSessions, ({ one, many }) => ({
  course: one(courses, {
    fields: [courseSessions.courseId],
    references: [courses.id],
  }),
  materials: many(sessionMaterials),
  progress: many(progress),
}));

export const sessionMaterialsRelations = relations(sessionMaterials, ({ one }) => ({
  session: one(courseSessions, {
    fields: [sessionMaterials.sessionId],
    references: [courseSessions.id],
  }),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  user: one(user, {
    fields: [enrollments.userId],
    references: [user.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
}));

export const progressRelations = relations(progress, ({ one }) => ({
  user: one(user, {
    fields: [progress.userId],
    references: [user.id],
  }),
  session: one(courseSessions, {
    fields: [progress.sessionId],
    references: [courseSessions.id],
  }),
}));
