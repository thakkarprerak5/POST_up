/**
 * Utility function to export analytics data to CSV format
 * Converts data array to CSV and triggers automatic download
 */
export const exportAnalyticsToCSV = (data: any[], filename: string = "analytics-report") => {
    if (!data || data.length === 0) {
        console.warn("No data to export");
        return;
    }

    // Get column headers from first object
    const headers = Object.keys(data[0]);

    // Create CSV content
    const csvContent = [
        // Header row
        headers.join(","),
        // Data rows
        ...data.map(row =>
            headers.map(header => {
                const cell = row[header];
                // Handle cells with commas or quotes
                if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
                    return `"${cell.replace(/"/g, '""')}"`;
                }
                return cell;
            }).join(",")
        )
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
