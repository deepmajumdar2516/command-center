"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./db");
const drizzle_orm_1 = require("drizzle-orm");
const tasks_1 = __importDefault(require("./routes/tasks"));
const projects_1 = __importDefault(require("./routes/projects"));
const projects2_1 = require("./routes/projects2");
const project2Files_1 = require("./routes/project2Files");
const project2Links_1 = require("./routes/project2Links");
const notes_1 = __importDefault(require("./routes/notes"));
const calendar_1 = __importDefault(require("./routes/calendar"));
const ideas_1 = __importDefault(require("./routes/ideas"));
const applications_1 = __importDefault(require("./routes/applications"));
const learning_1 = __importDefault(require("./routes/learning"));
const worksheets_1 = __importDefault(require("./routes/worksheets"));
const goals_1 = __importDefault(require("./routes/goals"));
const settings_1 = __importDefault(require("./routes/settings"));
const activity_1 = __importDefault(require("./routes/activity"));
const whiteboards_1 = require("./routes/whiteboards");
const whiteboards2_1 = require("./routes/whiteboards2");
const search_1 = require("./routes/search");
const notifications_1 = require("./routes/notifications");
const analytics_1 = require("./routes/analytics");
const backup_1 = require("./routes/backup");
const path_1 = __importDefault(require("path"));
const express_basic_auth_1 = __importDefault(require("express-basic-auth"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
// Basic Authentication for production
if (process.env.AUTH_USERNAME && process.env.AUTH_PASSWORD) {
    app.use((0, express_basic_auth_1.default)({
        users: { [process.env.AUTH_USERNAME]: process.env.AUTH_PASSWORD },
        challenge: true,
    }));
}
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../../uploads')));
app.get('/api/health', async (req, res) => {
    try {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000));
        await Promise.race([db_1.db.execute((0, drizzle_orm_1.sql) `SELECT 1`), timeout]);
        res.json({ status: 'ok', database: 'connected' });
    }
    catch (error) {
        res.status(500).json({ status: 'ok', database: 'offline' });
    }
});
app.use('/api/tasks', tasks_1.default);
app.use('/api/projects', projects_1.default);
app.use('/api/projects2', projects2_1.projects2Router);
app.use('/api/project2Files', project2Files_1.project2FilesRouter);
app.use('/api/project2Links', project2Links_1.project2LinksRouter);
app.use('/api/notes', notes_1.default);
app.use('/api/calendar', calendar_1.default);
app.use('/api/ideas', ideas_1.default);
app.use('/api/applications', applications_1.default);
app.use('/api/learning', learning_1.default);
app.use('/api/worksheets', worksheets_1.default);
app.use('/api/goals', goals_1.default);
app.use('/api/settings', settings_1.default);
app.use('/api/activity', activity_1.default);
app.use('/api/whiteboards', whiteboards_1.whiteboardsRouter);
app.use('/api/whiteboards2', whiteboards2_1.whiteboards2Router);
app.use('/api/search', search_1.searchRouter);
app.use('/api/notifications', notifications_1.notificationsRouter);
app.use('/api/analytics', analytics_1.analyticsRouter);
app.use('/api/backup', backup_1.backupRouter);
// Serve frontend in production
const frontendPath = path_1.default.join(__dirname, '../../frontend/dist');
app.use(express_1.default.static(frontendPath));
app.use((req, res) => {
    res.sendFile(path_1.default.join(frontendPath, 'index.html'));
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
// touch
