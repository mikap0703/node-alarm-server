require('dotenv').config();
const axios = require('axios').default;
const MailHandler = require('./email-handler');

const mail = new MailHandler(triggerAlarm, 2);

mail.startConnection();

function triggerAlarm(payload) {
    axios.post('https://app.divera247.com/api/alarm', {
        accesskey: process.env.API_KEY,
        ...payload
    })
        .then(function (response) {
            console.log(response);
        })
        .catch(function (error) {
            console.log(error);
        });
    console.log(payload)
}