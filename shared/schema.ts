import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  roll: text("roll").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  proximity: boolean("proximity").notNull().default(true),
});

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  roll: text("roll").notNull().unique(),
  name: text("name").notNull(),
  totalClasses: serial("total_classes").default(0),
  attendedClasses: serial("attended_classes").default(0),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).pick({
  roll: true,
  timestamp: true,
  proximity: true,
});

export const insertStudentSchema = createInsertSchema(students).pick({
  roll: true,
  name: true,
  totalClasses: true,
  attendedClasses: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

export interface AttendanceRecord {
  timestamp: string;
  roll: string;
  name?: string;
  proximity: boolean;
}

export interface StudentStats extends Student {
  percentage: number;
}
