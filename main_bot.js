YTToken = /* put your YouTube authorization token here */;
AIToken = /* put your Groq API key here */;

async function AI(question, authorhandler) {
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
                    content: `You are KubuAI, a witty AI. Respond at maximum 200 characters. You are inspired from AquilAI, and AquilAI is inpired from NexoAI. Your questions are sent from a public chat, since you’re meant to be a YouTube chatbot. Here’s the person that asked you a question, so that you can know their name: ${authorhandler}`
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
            params: 'Q2lrcUp3b1lWVU5TWHpaWVVrZEVVRmh4TWxsbVltSnFSbGxGV2tGQkVndFBXbWxtWmxKNWEwcFlPQkFCR0FRJTNE',
            richMessage: {
                textSegments: [
                    {
                        text
                    }
                ]
            }
        }),
        method: 'POST',
    });
}

function messageRunsToText(parts) {
    return parts.map(part => {
        if (part.type === "text")
            return part.value;

        if (part.type === "emoji")
            return part.id;

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

// Emoji paresr
function parseMessageRuns(runs = []) {
 return runs.map(item => {
  if (item.text) {
   return { type: "text", value: item.text };
  }

  if (item.emoji?.emojiId) {
   const emoji = item.emoji;

   // Pick thumbnail[1] or fallback to [0]
   const thumb =
    emoji.image?.thumbnails?.[1]?.url ||
    emoji.image?.thumbnails?.[0]?.url;

   return {
    type: "emoji",
    id: emoji.emojiId,
    url: thumb
   };
  }

  return null;
 }).filter(Boolean);
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
                const message = parseMessageRuns(renderer.message?.runs ?? []);
                const authorhandler = renderer.authorName?.simpleText ?? "Unknown";
                plainText = messageRunsToText(message);

                console.log(`${authorhandler}: ${plainText}`)
                if (plainText.startsWith('!say ') && !plainText.includes('!say !say !say'))
                    sendMessage(plainText.slice(5));

                if (plainText.startsWith('!kubuai '))
                    AI(plainText.slice(8), authorhandler).then(result => {
                        sendMessage(result);
                    });
            }
        } catch (e) {
            console.log("error:", e);
        }
    }
}


const config = {'video_id':'OZiffRykJX8'}; // put your video id here
currentVideoId = config.video_id;
if (currentVideoId) {
    newContinuation = await getInitialContinuation(currentVideoId);
    pollChat();
}

sendMessage('Kubutek bot is running! Talk with KubuAI: !kubuai, AI model: llama-3.3-70b-versatile')
