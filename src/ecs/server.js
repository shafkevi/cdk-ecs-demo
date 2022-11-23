'use strict';
const express = require('express');
const { Pool, Client } = require("pg");
const cors = require('cors');

// Constants
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';


  const credentials = {
    user: process.env.DB_USERNAME || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_DATABASE || "nodedemo",
    password: process.env.DB_PASSWORD || "yourpassword",
    port: process.env.DB_PORT || 5432,
  };
  console.log(credentials)

// App
const app = express();
app.use(cors());

app.get('/',  (req, res) => {
  console.log('/ endpoint please!');
  res.send({"message": `I am the api running on port ${process.env.PORT}`});
});

app.get('/timeout', (req, res) => {
  setTimeout(
    function(){
      let digits = [];  
      console.log(req.query.count);
      for (let i=0; i<req.query.count;i++){
        digits.push(Math.random());
      }
      console.log(digits);
      res.send(`Slept for ${req.query.timeout} seconds and then did some processing`);
    }, req.query.timeout*1000);
});

app.get('/upload',  (req, res) => {
  console.log('/upload please!');
  res.send({"message": `Eventually I will return a pre-signed S3 URL`});
});

app.get('/download',  (req, res) => {
  console.log('/upload please!');
  res.send({"message": `Eventually I will return a pre-signed S3 URL`});
});

app.get('/pg/init', async (req, res) => {
  console.log('Init pg');
  const pgClient = new Client(credentials);
  console.log('client init')
  await pgClient.connect();
  console.log('client connected')
  const result = await pgClient.query(`create table if not exists items (key text, value text)`);
  console.log(result);
  res.send({"message": `I initialized the table items for you.`});
});

app.get('/pg/put/:key/:value', async (req, res) => {
  console.log('put pg')
  const pgClient = new Client(credentials);
  console.log('client init')
  await pgClient.connect();
  console.log('client connected')
  const result = await pgClient.query(`insert into items (key,value) VALUES ('${req.params.key}', '${req.params.value}')`);
  console.log(result);
  res.send({"message": `I wrote ${req.params.key}:${req.params.value} for you`});
});

app.get('/pg/get/:key/', async (req, res) => {
  console.log('get pg')
  const pgClient = new Client(credentials);
  console.log('client init')
  await pgClient.connect();
  console.log('client connected')
  const result = await pgClient.query(`select * from items where key = '${req.params.key}'`);
  console.log(result);
  let value;
  try {
    value = result.rows[0].value;
    res.send({"message": `I grabbed ${req.params.key}:${value} for you`});
  }
  catch (err){
    res.send({"message": `I couldn't find ${req.params.key} in my database, beep boop bop.`});
  }
  
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
