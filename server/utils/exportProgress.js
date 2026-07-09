import fs from 'fs';

const activeTasks = new Map();

/**
 * Register a new export task
 * @param {string} taskId 
 * @param {Object} info 
 */
export function createTask(taskId, info) {
    activeTasks.set(taskId, {
        id: taskId,
        progress: 0,
        status: 'pending', // 'pending' | 'processing' | 'completed' | 'failed'
        filePath: null,
        fileName: null,
        error: null,
        createdAt: new Date(),
        ...info
    });
}

/**
 * Update progress percentage and status of a task
 * @param {string} taskId 
 * @param {number} progress 
 * @param {string} status 
 */
export function updateProgress(taskId, progress, status = 'processing') {
    const task = activeTasks.get(taskId);
    if (task) {
        task.progress = Math.min(100, Math.max(0, progress));
        task.status = status;
    }
}

/**
 * Mark a task as completed with file path
 * @param {string} taskId 
 * @param {string} filePath 
 * @param {string} fileName 
 */
export function completeTask(taskId, filePath, fileName) {
    const task = activeTasks.get(taskId);
    if (task) {
        task.progress = 100;
        task.status = 'completed';
        task.filePath = filePath;
        task.fileName = fileName;
    }
}

/**
 * Mark a task as failed
 * @param {string} taskId 
 * @param {string} error 
 */
export function failTask(taskId, error) {
    const task = activeTasks.get(taskId);
    if (task) {
        task.progress = 100;
        task.status = 'failed';
        task.error = error;
    }
}

/**
 * Get task details by ID
 * @param {string} taskId 
 * @returns {Object}
 */
export function getTask(taskId) {
    return activeTasks.get(taskId);
}

// Clean up tasks and temporary export files older than 30 minutes
setInterval(() => {
    const now = new Date();
    for (const [id, task] of activeTasks.entries()) {
        if (now - task.createdAt > 30 * 60 * 1000) {
            if (task.filePath && fs.existsSync(task.filePath)) {
                try {
                    fs.unlinkSync(task.filePath);
                } catch (e) {
                    console.error(`Error unlinking file for task ${id}:`, e);
                }
            }
            activeTasks.delete(id);
        }
    }
}, 10 * 60 * 1000);
