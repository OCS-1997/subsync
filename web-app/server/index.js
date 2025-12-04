import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import router from './routes/appRoutes.js';
import colors from 'colors';
import morgan from 'morgan';
import { setupBullBoard } from './queues/bullBoard.js';
import { createReminderWorker } from './workers/reminderWorker.js';
import { closeQueues } from './queues/queueConfig.js';
import { setupCronJobs } from './cron/reconciliationCron.js';

dotenv.config();
const app = express();
app.use(express.json());
// app.use(morgan('dev'))
app.use(express.urlencoded({ extended: true }));
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
app.use(cors({
    origin: [
        `http://localhost:${process.env.CLIENT_PORT || 5173}`, // for dev outside Docker
        `http://${process.env.HOME_IP || 'localhost'}:${process.env.CLIENT_PORT || 5173}`, // for dev outside Docker
        `http://localhost`, // allows requests from your Nginx frontend (port 80)
        `http://127.0.0.1`,
        `http://ocs365.in`
    ],
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
app.use("/api", router);

// Setup Bull Board for queue monitoring
setupBullBoard(app);

// Start BullMQ workers
let reminderWorker = null;
try {
    reminderWorker = createReminderWorker();
    console.log('Reminder worker started successfully'.bgGreen.white);
} catch (error) {
    console.error('Failed to start reminder worker:'.bgRed.white, error);
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
    const code = err.code || (status >= 500 ? 'INTERNAL_ERROR' : 'ERROR');
    const message = err.message || 'Internal Server Error';
    console.error('Error:', { status, code, message });
    return res.status(status).json({ success: false, error: { code, message } });
});

const server = app.listen(process.env.NODE_PORT || 3000, () => {
    console.log(`Server is running at http://localhost:${process.env.NODE_PORT || 3000}`.bgGreen.white);
    console.log(`Bull Board available at http://localhost:${process.env.NODE_PORT || 3000}/admin/queues`.bgCyan.white);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    if (reminderWorker) {
        await reminderWorker.close();
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
