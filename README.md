# Automated Interview Scheduling Workflow

This project automates the interview management process using Airtable and MailerSend. It processes candidates from a CSV, splits them into individual interview rounds, and automates email invitations.

## Features

- **Data Splitting**: Converts multi-round interview rows into individual records.
- **Email Automation**: Sends customized interview invites via MailerSend.
- **TAT Tracking**: Calculates the Turnaround Time (TAT) from "Added On" to "Email Sent".
- **Free Plan Friendly**: Uses Airtable Scripting Extensions instead of paid Automations.

## File Structure

- `airtable_splitting_script.js`: Script to split candidate rounds.
- `airtable_send_emails_script.js`: Script to send emails and update status.
- `candidates.csv`: Sample dataset.

## Setup Instructions

### 1. Airtable Base Setup

1. Create a "Raw Candidates" table matching the CSV columns.
2. Create an "Interview Schedule" table with columns: `Candidate Name`, `Candidate Email`, `Round Name`, `Calendly Link`, `Added On Time`, `Email Sent Time`, `TAT` (Single line text), `Status` (Single Select: Pending/Sent).

### 2. Install Scripts

1. Add a **Scripting Extension** and paste the code from `airtable_splitting_script.js`.
2. Add a **Second Scripting Extension** and paste the code from `airtable_send_emails_script.js`.
   - Update `MAILERSEND_API_KEY` and `SENDER_EMAIL` in the script.

### 3. Usage

1. Import data into `Raw Candidates`.
2. Run the Splitting Script.
3. Run the Email Script.
