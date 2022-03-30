const fs = require('fs');
const csv = require('csv-parser');
const handlebars = require('handlebars');
const retry = require('retry');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_KEY_SECRET;
const client = require('twilio')(apiKey, apiSecret, { accountSid: accountSid });

const KNOWN_REASONS = [
  'ACCOUNT_ACTIVATION',
  'ADDRESS_CHANGE',
  'MUDANCA_ENDERECO'
]

const operation = retry.operation({
  retries: 5,
  factor: 3,
  minTimeout: 1 * 1000,
  maxTimeout: 60 * 1000,
  randomize: true
});


try{
    
    const args = process.argv.slice(2);

    let contactData = [];

    console.log(`Reading ${args[0]}`);

    fs.createReadStream(args[0])
      .pipe(csv())
      .on('data', async (data) => {
          console.log(data);

          contactData.push(data);


      })
      .on('end', () => {

        console.log('Processing contact list');

        sendMessages(contactData);

        
      });


  }

  catch(err){

    console.error(err);
  }


const sendMessages = async (contactData) => {

  const SYNC_SERVICE_SID = process.env.SYNC_SERVICE_SID;
  const SYNC_MAP_SID = process.env.SYNC_MAP_SID;

  let promises = [];


  while(contactData.length > 0){
   
    console.log('Pulling items from contacts list');      
    contactData
      .splice(0,10)  // take first 10 elements
      .filter(contact => KNOWN_REASONS.includes(contact.REASON))    // filter invalid reasons 
      .forEach(contact => {   // iterates on the filtered list

        operation.attempt((currentAttempt) => {
          const mapItem = client.sync.services(SYNC_SERVICE_SID)
          .syncMaps(SYNC_MAP_SID)
          .syncMapItems
          .create({key: contact.PHONE, data: {
              name: contact.NAME,
              reason: contact.REASON
            }, ttl: 86400})
            .then(result => {
              console.log(result);

              sendSingleMessage(contact);

            })
            .catch(err => {

              if(err.code === 54208){       //updates the contact if already exists
                operation.attempt((currentAttempt => {
                  client.sync.services(SYNC_SERVICE_SID)
                  .syncMaps(SYNC_MAP_SID)
                  .syncMapItems(contact.PHONE)
                  .update({data: {name: contact.NAME, reason: contact.REASON}})
                    .then(result => {
                      console.log(result);
                      sendSingleMessage(contact)})
                    .catch(err => {
                      if(err.code === 20429){
                        operation.retry(err);
                      }
                    })

                }));
                
              }

              else if(err.code === 20429){
                operation.retry(err);

              }
            });

        promises.push(mapItem);

        })
        
        
        
    });

    await Promise.all(promises);


    
  }

  console.log('Finished processing messages. Waiting for sending confirmation');
}

const sendSingleMessage = (contact) => {
  const message = handlebars.compile(fs.readFileSync(`templates/${contact.REASON }.txt`, 'utf8'))({ 1: contact.NAME, 2: contact.LINK });

  client.messages
    .create({from: 'whatsapp:'+process.env.WA_SENDER_NUMBER, body: message, to: 'whatsapp:'+contact.PHONE})
    .then(message => console.log(`Message ${message.sid} sent to ${contact.PHONE} `))
    .catch(err => {
      if(err.code === 20429){
        operation.retry(err);
      }

      console.log(err);
    })

}
