tutorial from:
https://www.youtube.com/watch?v=BrcugNqRwUs

1. cd functions/ and npm i
2. npm run serve
3. setup your openai id + key and alpaca id + key in firebase functions config with:
```
npm install -g firebase-tools # install the firebase-cli tool
firebase login
firebase functions:config:set openai.id="openai API ID" openai.key="openai Key"
firebase functions:config:set alpaca.id="alpaca API ID" alpaca.key="alpaca Key"
npm run serve # start serving the function locally
```

4. call to the hello-world function to trigger the trade, e.g.:
http function initialized (http://127.0.0.1:5001/hm-fireship-tradebot/us-central1/helloWorld).