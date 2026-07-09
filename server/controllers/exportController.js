import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { format } from 'date-fns';
import { logActivity } from "../models/activityLogModel.js";
import { getAllUsers, getUserByUsername } from "../models/userModel.js";
import { compileUsersInsights } from "../services/insightsService.js";
import { generateExcelReport } from "../services/excelExportService.js";
import { generatePdfReport } from "../services/pdfExportService.js";
import { createTask, updateProgress, completeTask, failTask, getTask } from "../utils/exportProgress.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tmpDir = path.join(__dirname, '../tmp');
if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
}

/**
 * POST /time-tracking/reports/export-insights
 * Trigger asynchronous report generation
 */
export async function exportInsightsController(req, res) {
    try {
        const currentUser = req.user;
        const hasTeamView = currentUser?.permissions?.includes('time-tracking.view-team') || 
                            currentUser?.permissions?.includes('time-tracking.manage') || 
                            currentUser?.roleKey === 'admin';

        const {
            format: formatType = 'excel', // 'excel' | 'pdf'
            userIds = 'all', // 'all' | Array of strings
            startDate,
            endDate,
            customerId,
            projectId,
            activityTypeId,
            isBillable,
            includeCharts = true,
            orientation = 'portrait',
            companyName = 'Online Consultancy Services'
        } = req.body;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Date range (startDate and endDate) is required.' });
        }

        // Security logic: regular users are locked into their own data
        let targetUserIds = [];
        if (!hasTeamView) {
            targetUserIds = [currentUser.username];
        } else if (userIds === 'all') {
            const allUsersList = await getAllUsers();
            targetUserIds = allUsersList.map(u => u.username);
        } else {
            targetUserIds = Array.isArray(userIds) ? userIds : [userIds];
        }

        if (targetUserIds.length === 0) {
            return res.status(400).json({ error: 'No users found matching export scope.' });
        }

        // Generate a unique taskId
        const taskId = 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

        // Register the pending task
        createTask(taskId, {
            format: formatType,
            userIds: targetUserIds,
            startDate,
            endDate,
            includeCharts,
            orientation,
            companyName
        });

        // Respond immediately to the frontend
        res.status(202).json({ taskId, message: 'Export job registered. Processing in background...' });

        // Trigger Asynchronous Processing in the background
        (async () => {
            try {
                updateProgress(taskId, 10, 'processing');

                // Step 1: Fetch user profiles
                const selectedUsers = [];
                for (const username of targetUserIds) {
                    const profile = await getUserByUsername(username);
                    if (profile) {
                        selectedUsers.push(profile);
                    }
                }
                updateProgress(taskId, 30, 'processing');

                // Step 2: Fetch report aggregates and compute insights
                const userInsights = await compileUsersInsights(selectedUsers, {
                    startDate,
                    endDate,
                    customerId,
                    projectId,
                    activityTypeId,
                    isBillable
                });
                updateProgress(taskId, 60, 'processing');

                // Step 3: Call Excel or PDF builder
                const dateRangeText = `${format(new Date(startDate), 'yyyy-MM-dd')} to ${format(new Date(endDate), 'yyyy-MM-dd')}`;
                
                const fileExt = formatType === 'pdf' ? '.pdf' : '.xlsx';
                const fileScope = targetUserIds.length === 1 ? `_Insights_${targetUserIds[0]}` : `_All_Insights`;
                const finalFileName = `User_Insights${fileScope}_${format(new Date(), 'yyyy-MM-dd')}${fileExt}`;
                const finalFilePath = path.join(tmpDir, `${taskId}${fileExt}`);

                if (formatType === 'pdf') {
                    await generatePdfReport(finalFilePath, {
                        insights: userInsights,
                        dateRangeText,
                        companyName,
                        includeCharts,
                        orientation
                    });
                } else {
                    const buffer = await generateExcelReport({
                        insights: userInsights,
                        dateRangeText,
                        companyName,
                        includeCharts
                    });
                    fs.writeFileSync(finalFilePath, buffer);
                }

                updateProgress(taskId, 90, 'processing');

                // Log auditing event
                await logActivity({
                    username: currentUser.username,
                    action: 'export_insights',
                    resourceType: 'time_tracking',
                    details: {
                        format: formatType,
                        usersCount: targetUserIds.length,
                        dateRange: dateRangeText
                    }
                });

                completeTask(taskId, finalFilePath, finalFileName);
            } catch (err) {
                console.error(`Background export ${taskId} failed:`, err);
                failTask(taskId, err.message || 'Fatal generation error');
            }
        })();

    } catch (error) {
        console.error('Error in exportInsightsController:', error);
        res.status(500).json({ error: error.message || 'Internal export trigger failure' });
    }
}

/**
 * GET /time-tracking/reports/export-insights/status/:taskId
 * Check active processing progress of an export task
 */
export async function getExportStatusController(req, res) {
    try {
        const { taskId } = req.params;
        const task = getTask(taskId);

        if (!task) {
            return res.status(404).json({ error: 'Export task not found or expired.' });
        }

        res.json({
            id: task.id,
            status: task.status,
            progress: task.progress,
            error: task.error,
            fileName: task.fileName
        });
    } catch (error) {
        console.error('Error in getExportStatusController:', error);
        res.status(500).json({ error: 'Failed to inspect export status' });
    }
}

/**
 * GET /time-tracking/reports/export-insights/download/:taskId
 * Stream and download final output file, and unlink from temp folders
 */
export async function downloadExportController(req, res) {
    try {
        const { taskId } = req.params;
        const task = getTask(taskId);

        if (!task || task.status !== 'completed' || !task.filePath || !fs.existsSync(task.filePath)) {
            return res.status(404).json({ error: 'Export output file not found, expired, or failed.' });
        }

        // Set headers for download
        res.setHeader('Content-Disposition', `attachment; filename="${task.fileName}"`);
        const fileStream = fs.createReadStream(task.filePath);
        
        fileStream.pipe(res);

        // Once stream completes, clean up file
        fileStream.on('end', () => {
            try {
                fs.unlinkSync(task.filePath);
                task.filePath = null; // Prevent double unlinking
            } catch (err) {
                console.warn(`Clean up error unlinking temp export file ${taskId}:`, err.message);
            }
        });

    } catch (error) {
        console.error('Error in downloadExportController:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to stream download' });
        }
    }
}
