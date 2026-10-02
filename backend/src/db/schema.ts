import { pgTable, uuid, text, timestamp, boolean, integer, json } from "drizzle-orm/pg-core";

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("TODO"),
  priority: text("priority").notNull().default("MEDIUM"),
  category: text("category"),
  tags: json("tags").$type<string[]>(),
  dueDate: timestamp("due_date"),
  subtasks: json("subtasks").$type<any[]>(),
  notes: text("notes"),
  archived: boolean("archived").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  deletedAt: timestamp("deleted_at"),
});

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("PLANNING"),
  priority: text("priority").notNull().default("MEDIUM"),
  progress: integer("progress").default(0),
  category: text("category"),
  techStack: json("tech_stack").$type<string[]>(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  startDate: timestamp("start_date"),
  targetDate: timestamp("target_date"),
  completionDate: timestamp("completion_date"),
  deletedAt: timestamp("deleted_at"),
});

export const projects2 = pgTable("projects2", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  status: text("status").notNull().default("PLANNING"),
  priority: text("priority").notNull().default("MEDIUM"),
  progress: integer("progress").default(0),
  startDate: timestamp("start_date"),
  dueDate: timestamp("due_date"),
  tags: json("tags").$type<string[]>(),
  detailedContent: text("detailed_content"),
  tasksContent: text("tasks_content"),
  notesContent: text("notes_content"),
  timelineContent: text("timeline_content"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const project2Files = pgTable("project2_files", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  size: integer("size").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const project2Links = pgTable("project2_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  category: text("category"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const notes = pgTable("notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  category: text("category"),
  tags: json("tags").$type<string[]>(),
  pinned: boolean("pinned").default(false),
  archived: boolean("archived").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const calendarEvents = pgTable("calendar_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  start: timestamp("start_date", { withTimezone: true, mode: 'string' }).notNull(),
  end: timestamp("end_date", { withTimezone: true, mode: 'string' }).notNull(),
  color: text("color"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const ideas = pgTable("ideas", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  problem: text("problem"),
  solution: text("solution"),
  category: text("category"),
  status: text("status").notNull().default("CAPTURED"),
  priority: text("priority").notNull().default("MEDIUM"),
  tags: json("tags").$type<string[]>(),
  notes: text("notes"),
  techStack: json("tech_stack").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const applications = pgTable("applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  company: text("company").notNull(),
  role: text("role").notNull(),
  jobType: text("job_type"),
  location: text("location"),
  status: text("status").notNull().default("WISHLIST"),
  salary: text("salary"),
  applicationDate: timestamp("application_date"),
  interviewDate: timestamp("interview_date"),
  followUpDate: timestamp("follow_up_date"),
  deadline: timestamp("deadline"),
  notes: text("notes"),
  requirements: text("requirements"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const learningItems = pgTable("learning_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  parentId: uuid("parent_id"),
  progress: integer("progress").default(0),
  status: text("status").notNull().default("NOT_STARTED"),
  difficulty: text("difficulty").notNull().default("MEDIUM"),
  studyTime: integer("study_time").default(0),
  notes: text("notes"),
  resources: json("resources").$type<any[]>(),
  startDate: timestamp("start_date"),
  targetDate: timestamp("target_date"),
  lastStudied: timestamp("last_studied"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const worksheets = pgTable("worksheets", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  columns: json("columns").$type<any[]>(),
  rows: json("rows").$type<any[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const goals = pgTable("goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  progress: integer("progress").default(0),
  status: text("status").notNull().default("ACTIVE"),
  category: text("category"),
  linkedProjects: json("linked_projects").$type<string[]>(),
  linkedTasks: json("linked_tasks").$type<string[]>(),
  startDate: timestamp("start_date"),
  targetDate: timestamp("target_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: text("type").notNull(),
  message: text("message").notNull(),
  entityId: text("entity_id"),
  entityType: text("entity_type"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  id: text("id").primaryKey(), // We'll just have one row with id='global'
  accentColor: text("accent_color").default("#00d4aa"),
  theme: text("theme").default("dark"),
  density: text("density").default("normal"),
  animations: boolean("animations").default(true),
  gridBackground: boolean("grid_background").default(true),
  sidebarCollapsed: boolean("sidebar_collapsed").default(false),
  dashboardLayout: json("dashboard_layout").$type<any>(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const whiteboards = pgTable("whiteboards", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  data: json("data").$type<any>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const whiteboards2 = pgTable("whiteboards2", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  data: json("data").$type<any>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  read: boolean("read").default(false).notNull(),
  entityId: text("entity_id"),
  entityType: text("entity_type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
