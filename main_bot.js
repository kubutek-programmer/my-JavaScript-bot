YTToken = /* put your YouTube authorization token here */;
AIToken = /* put your Groq API key here */;

async function AI(question, authorhandle) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${AIToken}`
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: `You are KubuAI, a witty AI. Respond at maximum 200 characters. You are inspired from AquilAI, and AquilAI is inpired from NexoAI. Your questions are sent from a public chat, since you’re meant to be a YouTube chatbot. Here’s the person that asked you a question, so that you can know their name: ${authorhandle}`
                },
                {
                    role: 'user',
                    content: question
                }
            ]
        })
    });
    const data = await response.json();
    return data.choices[0].message.content;
}

function sendMessage(text) {
    fetch('https://www.youtube.com/youtubei/v1/live_chat/send_message?prettyPrint=false', {
        headers: {
            authorization: YTToken,
        },
        body: JSON.stringify({
            context: {
                client: {
                    clientName: 'WEB',
                    clientVersion: '2.20260630.03.00'
                }
            },
            params: 'Q2lrcUp3b1lWVU5UTlhwYU1YTlpZMGxqUTNCMVdUQlRWRWcyVFVobkVndE1TbVJPVG1oVFRHSXdUUkFCR0FRJTNE', // change this to the live chat id, you can get this by looking at your browsers devtools network tab and sending a message
            richMessage: {
                textSegments: [
                    {
                        text
                    }
                ]
            }
        }),
        method: 'POST',
    }).then((res) => {
        return res.json();
    }).then((json) => {
        console.log(json);
        if (json.errorMessage) sendMessage('Error: ${messageRunsToText(json.errorMessage.liveChatTextActionsErrorMessageRenderer.errorText.runs)}');
    });
}

function messageRunsToText(runs = []) {
    return runs.map(item => {
        if (item.text) {
            return item.text;
        }

        if (item.emoji?.emojiId) {
            return item.emoji.emojiId;
        }

        return "";
    }).join("");
}

// Variables for chat loop
const seenMessageIds = new Set();
let currentVideoId = "";
let numTimes = 0;
let newContinuation;
let pollRunning = false;
let pollingStopped = null;

// Function in testing
async function getInitialContinuation(videoId) {
 const res = await fetch(`https://www.youtube.com/live_chat?v=${videoId}`, {
  headers: {
   // Pretend to have a modern browser so YouTube doesn't complain
   "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
   "Accept-Language": 'en-US,en;q=0.9', // english
  }
 });

 const html = await res.text();

 // Use this to debug the HTML: console.log(html);

 const match = html.match(/"continuation":"([^"]+)"/); // extract continuation from returned HTML

 if (!match) {
  console.log(html);
  throw new Error("Failed to extract continuation");
 }

 return match[1];
}



function getContinuation(json) {
 const cont = json.continuationContents?.liveChatContinuation?.continuations?.[0];

 if (!cont) return null;

 return (
  cont.timedContinuationData?.continuation ||
  cont.invalidationContinuationData?.continuation ||
  cont.reloadContinuationData?.continuation ||
  cont.liveChatReplayContinuationData?.continuation ||
  null
 );
}

// Chat loop
async function pollChat() {
    pollRunning = true;
    while (true) {
        if (pollingStopped) {
            const resolve = pollingStopped;
            pollingStopped = null;
            resolve();
            return;
        }

        try {
            const response = await fetch("https://www.youtube.com/youtubei/v1/live_chat/get_live_chat?prettyPrint=false", {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    // Pretending to have a modern browser so YouTube doesn't complain
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36"
                },
                body: JSON.stringify({
                    context: {
                        client: {
                            clientName: 'WEB',
                            clientVersion: '2.20260603.05.00' // Pretending to have a new browser version so YouTube doesn't complain
                        }
                    },
                    continuation: newContinuation
                })
            });

            const json = await response.json();

            const nextContinuation = getContinuation(json);

            if (nextContinuation) {
                newContinuation = nextContinuation;
            }

            const actions = json.continuationContents?.liveChatContinuation?.actions ?? [];

            for (const action of actions) {
                const renderer = action.addChatItemAction?.item?.liveChatTextMessageRenderer;

                if (!renderer) continue;

                const messageId = renderer.id;

                // Skip duplicates
                if (messageId && seenMessageIds.has(messageId)) {
                    continue;
                }

                // Mark as seen
                if (messageId) {
                    seenMessageIds.add(messageId);

                    // Memory limit
                    if (seenMessageIds.size > 50000) {
                        const oldest = seenMessageIds.values().next().value;
                        seenMessageIds.delete(oldest);
                    }
                }
        		const pfp =
        		 renderer.authorPhoto?.thumbnails?.at(-1)?.url ||
        		 renderer.authorPhoto?.thumbnails?.[0]?.url;
                const message = messageRunsToText(renderer.message?.runs ?? []);
                const authorID = renderer.authorExternalChannelId ?? "Unknown";
                const authorhandle = renderer.authorName?.simpleText ?? "Unknown";

                console.log(`${authorhandle}: ${message}`)
                const isCommand = message.startsWith("!");
                
                if (isCommand) {
                    const [command, ...args] = message.split(" ");
                
                    const commands = {
                        '!say': () => {
                            if (!message.includes('!say !say !say')) {
                                sendMessage(args.join(' '));
                            }
                        },
                
                        '!kubuai': async () => {
                            sendMessage(await AI(args.join(' '), authorhandle));
                        },
                
                        '!commands': () => {
                            const page = args[0] ?? '1';
                
                            const pages = { // YouTube Live Chat has a 200-character limit
                                '1': 'Commands page 1/2: !commands / !cmds [page], !say [msg] - says a message, !kubuai [question] - asks KubuAI a question, !rng - generates a random number from 0 to 1, !revertical - [cant say, too long]',
                                '2': 'Commands page 2/2: !revertical - dawg WHO said "revertical" 😭✌, e - E, !userdata - Shows your user data',
                            };
                
                            if (pages[page]) {
                                sendMessage(pages[page]);
                            }
                        },
                
                        // Alias
                        '!cmds': () => commands['!commands'](),
                
                        '!rng': () => {
                            sendMessage(Math.random().toString());
                        },
                
                        '!revertical': () => {
                            sendMessage('dawg WHO said "revertical" 😭✌');
                        },

                        '!userdata': () => {
                            sendMessage(`Your data: Channel handle: ${authorhandle}, Channel ID: ${authorID}, Profile picture link: ${pfp}`);
                        }
                    };
                
                    commands[command]?.();
                }

                // support the funny E meme
                if (message.toLowerCase() == 'e' && authorhandle !== '@Kubutek-programmer') sendMessage("E");
            }
        } catch (e) {
            console.log("error:", e);
        }
    }
}


const config = {'video_id':'LJdNNhSLb0M'}; // put your video id here
currentVideoId = config.video_id;
if (currentVideoId) {
    newContinuation = await getInitialContinuation(currentVideoId);
    pollChat();
}

sendMessage('Kubutek bot is running! Talk with KubuAI: !kubuai, AI model: llama-3.3-70b-versatile');

setInterval(() => {
    sendMessage(`You can suggest what to add for KubuBot!`);
}, 120000);
