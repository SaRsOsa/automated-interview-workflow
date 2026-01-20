// Airtable Script: Batch Send Emails (Free Plan Compatible)
// This script runs in the Airtable Scripting Extension.

// --- CONFIGURATION ---
const TABLE_NAME = 'Interview Schedule';
const MAILERSEND_API_KEY = 'YOUR_MAILERSEND_API_KEY_HERE'; // Replace with your key
const SENDER_EMAIL = 'recruitment@yourdomain.com'; // Must be a verified sender
const SENDER_NAME = 'Weekday Recruiting';

// --- HELPER FUNCTION: SLEEP ---
// Rate limiting to avoid hitting API limits
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --- MAIN LOGIC ---
let table = base.getTable(TABLE_NAME);

// Query all records
let query = await table.selectRecordsAsync({ fields: table.fields });

// Filter for Pending records
let pendingRecords = query.records.filter(record => {
    let status = record.getCellValue('Status');
    // Handle status being an object {name: 'Pending'} or string (just in case)
    return status && (status.name === 'Pending' || status === 'Pending');
});

if (pendingRecords.length === 0) {
    output.text('No pending emails to send.');
} else {
    output.text(`Found ${pendingRecords.length} pending emails. Sending...`);

    for (let record of pendingRecords) {
        let candidateName = record.getCellValueAsString('Candidate Name');
        let candidateEmail = record.getCellValueAsString('Candidate Email');
        let calendlyLink = record.getCellValueAsString('Calendly Link');
        let roundName = record.getCellValueAsString('Round Name');
        let addedOnTime = record.getCellValue('Added On Time');

        if (!candidateEmail) {
            output.text(`Skipping ${candidateName}: No email found.`);
            continue;
        }

        // Send Email via MailerSend
        // IMPORTANT: Using remoteFetchAsync to bypass CORS
        try {
            // Add a small delay for rate limiting (500ms)
            await sleep(500);

            let response = await remoteFetchAsync('https://api.mailersend.com/v1/email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${MAILERSEND_API_KEY}`,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    "from": {
                        "email": SENDER_EMAIL,
                        "name": SENDER_NAME
                    },
                    "to": [
                        {
                            "email": candidateEmail,
                            "name": candidateName
                        }
                    ],
                    "subject": `Interview Invitation: ${roundName}`,
                    "text": `Hello ${candidateName},\n\nPlease schedule your ${roundName} using the link below:\n${calendlyLink}\n\nBest,\nWeekday Team`,
                    "html": `<p>Hello ${candidateName},</p><p>Please schedule your <strong>${roundName}</strong> using the link below:</p><p><a href="${calendlyLink}">${calendlyLink}</a></p><p>Best,<br>Weekday Team</p>`
                })
            });

            if (response.status >= 200 && response.status < 300) {
                // Calculate TAT
                let emailSentTime = new Date();
                let tatValue = "";

                if (addedOnTime) {
                    // Append current year if missing to help parsing, though JS usually defaults to current.
                    // "04 Nov 1:18" -> "04 Nov 2026 1:18" (if current year is 2026)
                    let addedOnDate = new Date(addedOnTime);

                    if (!isNaN(addedOnDate)) {
                        // If the parsed date is in the future (e.g., Nov 2026 vs Jan 2026), 
                        // it probably belongs to the previous year.
                        if (addedOnDate > emailSentTime) {
                            addedOnDate.setFullYear(addedOnDate.getFullYear() - 1);
                        }

                        let diffMs = emailSentTime - addedOnDate;
                        let diffHrs = (diffMs / (1000 * 60 * 60)).toFixed(2);
                        tatValue = `${diffHrs} Hours`;
                    }
                }

                // Update Record
                await table.updateRecordAsync(record, {
                    'Email Sent Time': emailSentTime.toISOString(),
                    'TAT': tatValue,
                    'Status': { name: 'Sent' }
                });

                output.text(`Sent to ${candidateName}`);
            } else {
                let errorText = await response.text();
                output.text(`Failed to send to ${candidateName}: ${errorText}`);
            }

        } catch (e) {
            output.text(`Error processing ${candidateName}: ${e}`);
        }
    }
    output.text('Batch processing complete!');
}
