// Airtable Script: Split Interview Rounds
// This script runs in the Airtable Scripting Extension.

// CONFIGURE THIS:
const SOURCE_TABLE_NAME = 'Raw Candidates';
const TARGET_TABLE_NAME = 'Interview Schedule';

// --- MAIN LOGIC ---
let sourceTable = base.getTable(SOURCE_TABLE_NAME);
let targetTable = base.getTable(TARGET_TABLE_NAME);

// Query all records from the source table
let query = await sourceTable.selectRecordsAsync({ fields: sourceTable.fields });

// Prepare batch create array
let recordsToCreate = [];

for (let record of query.records) {
    let candidateName = record.getCellValueAsString('Candidate');
    let candidateEmail = record.getCellValueAsString('Candidate Email');
    let addedOn = record.getCellValue('Added On'); // Keep the original format or string
    let schedulingMethod = record.getCellValueAsString('Scheduling method');

    // Regex to find "RoundX: URL" patterns
    // Matches "Round1: https://..." or "Round 2: http..."
    // Supports multi-line strings
    const roundRegex = /(Round\s*\d+):\s*(https?:\/\/[^\s",]+)/gi;

    let matches = [...schedulingMethod.matchAll(roundRegex)];

    if (matches.length > 0) {
        // If rounds are found, create a row for each round
        for (let match of matches) {
            let roundName = match[1]; // e.g., "Round1"
            let calendlyLink = match[2]; // e.g., "https://calendly..."

            recordsToCreate.push({
                fields: {
                    'Candidate Name': candidateName,
                    'Candidate Email': candidateEmail,
                    'Round Name': roundName,
                    'Calendly Link': calendlyLink,
                    'Added On Time': addedOn,
                    'Status': { name: 'Pending' }
                }
            });
        }
    } else {
        // If no specific round format is found, copy as single row if needed.
        if (schedulingMethod && schedulingMethod.trim().length > 0) {
            recordsToCreate.push({
                fields: {
                    'Candidate Name': candidateName,
                    'Candidate Email': candidateEmail,
                    'Round Name': 'Round 1', // Default
                    'Calendly Link': schedulingMethod, // Use the whole string or extract URL
                    'Added On Time': addedOn,
                    'Status': { name: 'Pending' }
                }
            });
        }
    }
}

// Airtable allows creating 50 records at a time
while (recordsToCreate.length > 0) {
    await targetTable.createRecordsAsync(recordsToCreate.slice(0, 50));
    recordsToCreate = recordsToCreate.slice(50);
}

output.text('Data splitting complete!');
