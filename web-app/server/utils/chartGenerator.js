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

