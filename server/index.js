import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import router from './routes/appRoutes.js';
import colors from 'colors';
import morgan from 'morgan';
import { setupBullBoard } from './queues/bullBoard.js';
import { createReminderWorker } from './workers/reminderWorker.js';
import { createBackupWorker } from './workers/backupWorker.js';
import { closeQueues } from './queues/queueConfig.js';
import { syncAllBackupSchedules } from './services/backupService.js';
import { setupCronJobs } from './cron/reconciliationCron.js';
import { syncBirthdays } from './models/birthdayModel.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Diagnostic logging middleware
app.use((req, res, next) => {
    const origin = req.headers.origin || 'No Origin';
    const log = `[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${origin}\n`;
    fs.appendFileSync('server_reqs.log', log);
    next();
});
// Increase body size limits to support file uploads (50MB)
app.use(express.json({ limit: '50mb' }));
// app.use(morgan('dev'))
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(helmet());
app.set('trust proxy', true);

// Global process-level error handlers (prevent crashes)
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Promise Rejection:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

// To get the real client IP in your routes/middleware:
// const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;

// Add request logging
// app.use((req, res, next) => {
//     console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
//     next();
// });

// CORS configuration
const allowedOrigins = [
    `http://localhost:${process.env.CLIENT_PORT || 5173}`,
    `http://${process.env.HOME_IP || 'localhost'}:${process.env.CLIENT_PORT || 5173}`,
    `http://localhost`,
    `https://localhost`,
    `http://127.0.0.1`,
    `http://ocs365.in`,
    `https://ocs365.in`,
    `http://dev.ocs365.in`,
    `https://dev.ocs365.in`,
    `capacitor://localhost`,
    `ionic://localhost`,
    /^chrome-extension:\/\/.*/,
];

// Add origins from .env if provided
if (process.env.ALLOWED_ORIGINS) {
    const envOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
    allowedOrigins.push(...envOrigins);
}

app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));

// /**
//  * Rate limiting middleware
//  * @type {RateLimitRequestHandler}
//  */
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again later.',
// });

// app.use(limiter);
app.get('/api/download/subsync.apk', (req, res) => {
    const locations = [
        process.env.APK_PATH, // Custom path from .env
        path.join(__dirname, 'downloads', 'subsync.apk'), // Local development path
        '/var/www/ocs365.in/app/subsync.apk', // New production path
        '/var/www/ocs365.in/subsync/server/downloads/subsync.apk' // Old production path
    ].filter(Boolean);

    let foundPath = null;
    for (const loc of locations) {
        if (fs.existsSync(loc)) {
            foundPath = loc;
            break;
        }
    }

    if (!foundPath) {
        console.error('[DOWNLOAD] APK not found in any of searching locations:', locations);
        return res.status(404).json({ 
            success: false, 
            error: { code: 'NOT_FOUND', message: 'APK file not found on server' } 
        });
    }

    console.log(`[DOWNLOAD] Serving APK from: ${foundPath}`);
    res.download(foundPath, 'subsync.apk', (err) => {
        if (err) {
            console.error('[DOWNLOAD] Error sending file:', err);
            if (!res.headersSent) {
                res.status(500).json({ success: false, error: { code: 'DOWNLOAD_FAILED', message: 'Failed to send APK file' } });
            }
        }
    });
});
app.use("/api", router);

// Setup Bull Board for queue monitoring
setupBullBoard(app);

// Start BullMQ workers
let reminderWorker = null;
let backupWorker = null;
try {
    reminderWorker = createReminderWorker();
    console.log('Reminder worker started successfully'.bgGreen.white);
} catch (error) {
    console.error('Failed to start reminder worker:'.bgRed.white, error);
}

try {
    backupWorker = createBackupWorker();
    console.log('Backup worker started successfully'.bgGreen.white);

    // Sync backup schedules to BullMQ
    syncAllBackupSchedules();
} catch (error) {
    console.error('Failed to start backup worker:'.bgRed.white, error);
}

// Setup cron jobs
try {
    setupCronJobs();
    console.log('Cron jobs scheduled successfully'.bgGreen.white);
} catch (error) {
    console.error('Failed to setup cron jobs:'.bgRed.white, error);
}

// 404 handler for unknown routes
app.use((req, res, next) => {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

// Centralized error handler (last)
app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    const isProduction = process.env.NODE_ENV === 'production';

    const code = err.code || (status >= 500 ? 'INTERNAL_ERROR' : 'ERROR');

    // In production, hide detailed error messages for internal server errors (500+)
    const message = (isProduction && status >= 500)
        ? 'Internal Server Error'
        : (err.message || 'Internal Server Error');

    console.error('Error:', { status, code, message: err.message || message });
    return res.status(status).json({ success: false, error: { code, message } });
});

const server = app.listen(process.env.NODE_PORT || 3000, () => {
    console.log(`Server is running at http://localhost:${process.env.NODE_PORT || 3000}`.bgGreen.white);
    console.log(`Bull Board available at http://localhost:${process.env.NODE_PORT || 3000}/admin/queues`.bgCyan.white);

    // Run an initial birthday sync on startup to populate from users/customers/contacts
    syncBirthdays()
        .then(() => console.log('Initial birthday sync completed'.bgGreen.white))
        .catch(err => console.error('Initial birthday sync failed:', err));
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    if (reminderWorker) {
        await reminderWorker.close();
    }
    if (backupWorker) {
        await backupWorker.close();
    }
    await closeQueues();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    if (reminderWorker) {
        await reminderWorker.close();
    }
    await closeQueues();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
