# My JavaScript bot
This repository contains the code that i use for my YouTube live chat bots. Make sure to open the DevTools Console and paste the files contents. Why? Because Node.js and everything else hates me and does 401 UNAUTHORIZED (same for another person who tried)

# Instructions to set up
Since these bots need your channel token to chat, you need to get yours, it is simple with DevTools. Just open the DevTools Network tab, filter for Fetch/XHR, in the input for filtering type `send_message` and click enter. Now with that DevTools window open, send a message in live chat. You'll see a fetch appear in DevTools, click on it, find the headers, find the authorization header, that's your token for your YouTube channel, save it into a variable called YTToken (my scripts use that variable)
To get your API key for Groq, just open the [Groq console](https://console.groq.com/home) and do the required steps to get your API key. Once you have your Groq api key, store it in a variable called AIToken since my script uses that variable.
