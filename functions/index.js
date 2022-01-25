const functions = require("firebase-functions");

const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({
  organization: functions.config().openai.id, // REPLACE with your API credentials
  apiKey: functions.config().openai.key, // REPLACE with your API credentials
});
const openai = new OpenAIApi(configuration);

const Alpaca = require('@alpacahq/alpaca-trade-api');
const alpaca = new Alpaca({
  keyId: functions.config().alpaca.id, // REPLACE with your API credentials
  secretKey: functions.config().alpaca.key, // REPLACE with your API credentials
  paper: true,
});


const puppeteer = require('puppeteer');

async function scrape() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto('https://twitter.com/jimcramer', {
    waitUntil: 'networkidle2',
  });

  await page.waitForTimeout(3000);

  // await page.screenshot({ path: 'example.png' });

  const tweets = await page.evaluate(async () => {
    return document.body.innerText;
  });

  await browser.close();

  return tweets;
}

exports.helloWorld = functions.https.onRequest(async (request, response) => {

  const tweets = await scrape();

  // test logic here
  const gptCompletion = await openai.createCompletion('text-davinci-001', {
    prompt: `${tweets}. Jim Cramer recommends selling the following stock tickers: `,
    temperature: 0.7,
    max_tokens: 32,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });

  const stocksToBuy = gptCompletion.data.choices[0].text.match(/\b[A-Z]+\b/g);
  console.log(`Thanks for the tips Jim! ${stocksToBuy}`);

  if (!stocksToBuy) {
    console.log('Nothing to buy');
    return null;
  }

  //// ALPACA Make Trades ////

  // close all positions
  const cancel = await alpaca.cancelAllOrders();
  const liquidate = await alpaca.closeAllPositions();

  // get account
  const account = await alpaca.getAccount();
  console.log(`water we have: ${account.buying_power}`);

  // place order
  const order = await alpaca.createOrder({
    symbol: stocksToBuy[0],
    // qty: 1,
    notional: account.buying_power * 0.2, // will buy fractional shares
    side: 'buy',
    type: 'market',
    time_in_force: 'day',
  });

  console.log(`look mom i bought stonks: ${order.id}`);

  // response.send(gptCompletion.data);
  response.send(order);
});


// Cronjob gonna need to enable billing in Firebase
// Skipping this and just cron from your own server or whatever

// exports.getRichQuick = functions
//   .runWith({ memory: '4GB' })
//   .pubsub.schedule('0 23 * * 1-5')
//   .timeZone('Asia/Kuala_Lumpur')
//   .onRun(async (ctx) => {
//     console.log('This will run M-F at roughly 10:00 AM Eastern!');

//     const tweets = await scrape();

//     const gptCompletion = await openai.createCompletion('text-davinci-001', {
//       prompt: `${tweets} Jim Cramer recommends selling the following stock tickers: `,
//       temperature: 0.7,
//       max_tokens: 32,
//       top_p: 1,
//       frequency_penalty: 0,
//       presence_penalty: 0,
//     });

//     const stocksToBuy = gptCompletion.data.choices[0].text.match(/\b[A-Z]+\b/g);
//     console.log(`Thanks for the tips Jim! ${stocksToBuy}`);

//     if (!stocksToBuy) {
//       console.log('sitting this one out');
//       return null;
//     }

//     //// ALPACA Make Trades ////

//     // close all positions
//     const cancel = await alpaca.cancelAllOrders();
//     const liquidate = await alpaca.closeAllPositions();

//     // get account
//     const account = await alpaca.getAccount();
//     console.log(`water we have: ${account.buying_power}`);

//     // place order
//     const order = await alpaca.createOrder({
//       symbol: stocksToBuy[0],
//       // qty: 1,
//       notional: account.buying_power * 0.9, // will buy fractional shares
//       side: 'buy',
//       type: 'market',
//       time_in_force: 'day',
//     });

//     console.log(`i bought stonks: ${order.id}`);

//     return null;
//   });