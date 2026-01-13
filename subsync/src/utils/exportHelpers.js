/**
 * Export Helper Functions
 * Reusable export functions for generating CSV and formatted text reports
 */

export const exportToCSV = (data, headers, filename) => {
    // Build CSV headers
    const csvHeaders = headers.join(",");

    // Build CSV rows
    const rows = data.map(row => {
        return headers.map(header => {
            const value = row[header] || "";
            // Escape quotes and wrap in quotes
            return `"${String(value).replace(/"/g, '""')}"`;
        }).join(",");
    });

    // Combine headers and rows
    const csvContent = [csvHeaders, ...rows].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const exportToFormattedText = (data, fields, title, filename) => {
    let content = `${title.toUpperCase()} - EXPORT REPORT\n`;
    content += "=".repeat(80) + "\n\n";
    content += `Generated on: ${new Date().toLocaleString('en-IN')}\n`;
    content += `Total Records: ${data.length}\n`;
    content += "\n" + "=".repeat(80) + "\n\n";

    // Add each entry
    data.forEach((entry, index) => {
        content += `ENTRY #${index + 1}\n`;
        content += "-".repeat(80) + "\n";

        fields.forEach(field => {
            if (entry[field.key] !== undefined) {
                const label = field.label.padEnd(20);
                content += `${label}: ${entry[field.key] || '-'}\n`;
            }
        });

        content += "\n";
    });

    content += "=".repeat(80) + "\n";
    content += "END OF REPORT\n";

    // Download as text file
    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.txt`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
