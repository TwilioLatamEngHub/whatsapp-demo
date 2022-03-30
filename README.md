# Nubank Whatsapp POC

## Requirements

### Functions Deployment
* [Twilio CLI](https://www.twilio.com/docs/twilio-cli/quickstart) installed
* [Twilio Serverless Toolkit](https://www.twilio.com/docs/labs/serverless-toolkit) installed

### Running the Script
* [Node.js](https://nodejs.org/en/) installed. (**Minimum Version**: Nodejs v12)


## Setup

1. Clone this repository
2. In the root folder, copy the Environment Variables file sample into a production file
    * `cp .env.example .env`
3. Install dependencies
    * `npm install`
4. Setup `.env` with your Twilio Project Service SIDs and WhatsApp Phone Number
   1. [Account SID and Auth Token](https://console.twilio.com/)
   2. [Sync Service SID](https://console.twilio.com/us1/develop/sync/services?frameUrl=%2Fconsole%2Fsync%2Fservices%3Fx-target-region%3Dus1)
   3. Create a new Sync Service Map, navigate back to your Sync Service and copy the SID
   4. [WhatsApp Phone Number](https://console.twilio.com/us1/develop/sms/senders/whatsapp-senders?frameUrl=%2Fconsole%2Fsms%2Fwhatsapp%2Fsenders%3Fx-target-region%3Dus1)
5. Navigate to `contact-helper`
    * `cd contact-helper` 
6. Copy the Serverless Application Environment Variables file sample into a production file
    * `cp .env.example .env`
7. Setup `.env` using the same info from the script Environment File, except for the WhatsApp Phone Number
8. Deploy the Twilio Functions
    * `twilio serverless:deploy`

## Running the Script

1. In the root folder, run `node load-contact-list.js [contacts list CSV path]`
2. The CSV file **must** contain the following columns (in any order):
    * NAME
    * PHONE
    * REASON

### Adding new templates

To add new templates to the script, two steps are needed, after the template is approved by WhatsApp:

1. Create a `[CONTACT_REASON].txt` file
2. Add `CONTACT REASON` to the `KNOWN_REASONS` constant in the script file (`load-contact-list.js`)

After that, contacts with the new contact reason in the `REASON` column will be correctly processed.