import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

const width = 800;
const height = 400;
const backgroundColour = 'white';

/**
 * Generate a pie chart as base64 image
 * @param {Object} data - { labels: [], datasets: [{ data: [], backgroundColor: [] }] }
 * @param {string} title
 * @returns {Promise<string>} base64 image string
 */
export async function generatePieChart(data, title = '') {
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour });

    const configuration = {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: !!title,
                    text: title,
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    position: 'right',
                    labels: {
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    };

    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    return `data:image/png;base64,${imageBuffer.toString('base64')}`;
}

/**
 * Generate a bar chart as base64 image
 * @param {Object} data - { labels: [], datasets: [{ label: '', data: [], backgroundColor: '' }] }
 * @param {string} title
 * @returns {Promise<string>} base64 image string
 */
export async function generateBarChart(data, title = '') {
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour });

    const configuration = {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: !!title,
                    text: title,
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: data.datasets.length > 1,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: {
                            size: 12
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    };

    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    return `data:image/png;base64,${imageBuffer.toString('base64')}`;
}

/**
 * Generate charts for DCR daily report
 * @param {Object} stats - Statistics data
 * @returns {Promise<Object>} Object with base64 chart images
 */
export async function generateDcrCharts(stats) {
    // Blue color palette for application branding
    const blueColors = [
        '#1e3a8a', '#1e40af', '#1d4ed8', '#2563eb', '#3b82f6',
        '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff',
        '#1e40af', '#2563eb', '#3b82f6'
    ];

    // Pie chart: Time spent per category
    const categoryTimeData = {
        labels: stats.callsPerCategory.map(c => c.category),
        datasets: [{
            data: stats.callsPerCategory.map(c => c.total_minutes),
            backgroundColor: blueColors.slice(0, stats.callsPerCategory.length)
        }]
    };
    const pieChartBase64 = await generatePieChart(categoryTimeData, 'Time Spent per Category (Minutes)');

    // Bar chart: Calls per category
    const categoryCallsData = {
        labels: stats.callsPerCategory.map(c => c.category),
        datasets: [{
            label: 'Number of Calls',
            data: stats.callsPerCategory.map(c => c.call_count),
            backgroundColor: '#2563eb'
        }]
    };
    const barChartCallsBase64 = await generateBarChart(categoryCallsData, 'Number of Calls per Category');

    // Bar chart: Time spent per user
    const userTimeData = {
        labels: stats.callsPerUser.map(u => u.user_name),
        datasets: [{
            label: 'Time Spent (Minutes)',
            data: stats.callsPerUser.map(u => u.total_minutes),
            backgroundColor: '#1d4ed8'
        }]
    };
    const barChartUserBase64 = await generateBarChart(userTimeData, 'Time Spent per User (Minutes)');

    return {
        pieChartTimeCategory: pieChartBase64,
        barChartCallsCategory: barChartCallsBase64,
        barChartTimeUser: barChartUserBase64
    };
}

