'use strict';

// Current cache of items can be found here:
//  C:\Visual Studio\FFXIV Tools\FFXIV Tools\bin\Generated\Cache\Items

const https = require('https');

const BASE_URI = 'https://xivapi.com/search?string=';

// Item 8910
const searchFor = 'Augmented Ironworks Choker Of Aiming';
const uri = BASE_URI + encodeURIComponent(searchFor);

const request = https.get(uri, response => {
    let allData = '';

    console.log(`statusCode: ${response.statusCode}`);

    response.on('data', data => {
       allData += data;
    });

    response.on('end', () => {
        console.log(JSON.parse(allData));
    });
});

request.on('error', error => {
    console.error(error);
});

request.end();