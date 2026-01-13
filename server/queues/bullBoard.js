import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js';
import { ExpressAdapter } from '@bull-board/express';
import { subscriptionRemindersQueue, pdfGenerationQueue, backupTasksQueue } from './queueConfig.js';

/**
 * Setup Bull Board for queue monitoring
 * @param {express.App} app Express app instance
 * @returns {ExpressAdapter} The adapter for mounting
 */
export function setupBullBoard(app) {
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');

    createBullBoard({
        queues: [
            new BullMQAdapter(subscriptionRemindersQueue),
            new BullMQAdapter(pdfGenerationQueue),
            new BullMQAdapter(backupTasksQueue),
        ],
        serverAdapter,
    });

    // Basic auth middleware (simple implementation - use proper auth in production)
    const basicAuth = (req, res, next) => {
        const auth = req.headers.authorization;
        const expectedAuth = process.env.BULL_BOARD_AUTH || 'admin:admin'; // Default credentials

        if (!auth || !auth.startsWith('Basic ')) {
            res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board"');
            return res.status(401).send('Authentication required');
        }

        const credentials = Buffer.from(auth.slice(6), 'base64').toString('utf-8');
        if (credentials !== expectedAuth) {
            res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board"');
            return res.status(401).send('Invalid credentials');
        }

        next();
    };

    app.use('/admin/queues', basicAuth, serverAdapter.getRouter());

    console.log('Bull Board mounted at /admin/queues');
    return serverAdapter;
}

