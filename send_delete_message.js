YTToken = /* put your YouTube authorization token here */;

async function sendMessage(text) {
    return fetch('https://www.youtube.com/youtubei/v1/live_chat/send_message?prettyPrint=false', {
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
            params: 'Q2lrcUp3b1lWVU5wVjJVMldEYzBiV3RCZVd3d1NXcG9WRWRUYmxCUkVndEpZemRYWlZOTFMydEZjeEFCR0FFJTNE', // put the live chat continuation, you can get this by copying what YouTube sends through DevTools Network tab
            richMessage: {
                textSegments: [
                    {
                        text
                    }
                ]
            }
        }),
        method: 'POST',
    }).then((res) => res.json());
}

function sendDeleteMessage(text) {
    let jsonBody = {
        context: {
            client: {
                clientName: 'WEB',
                clientVersion: '2.20260630.03.00'
            }
        },
        params: undefined
    };

    sendMessage(text).then((jsonRes) => {
        console.log(jsonRes);

        jsonBody.params = jsonRes.actions[0].addChatItemAction.item.liveChatTextMessageRenderer.inlineActionButtons[0].buttonRenderer.serviceEndpoint.moderateLiveChatEndpoint.params;

        let json = {
            headers: {
                authorization: YTToken,
            },
            body: JSON.stringify(jsonBody),
            method: 'GET',
        };
        if (jsonRes.actions[0]?.addChatItemAction?.item?.liveChatTextMessageRenderer?.inlineActionButtons[0]?.buttonRenderer?.serviceEndpoint?.commandMetadata?.webCommandMetadata?.sendPost) json.method = 'POST';

fetch(jsonRes.actions[0].addChatItemAction.item.liveChatTextMessageRenderer.inlineActionButtons[0].buttonRenderer.serviceEndpoint.commandMetadata.webCommandMetadata.apiUrl, json);
    });
}

function massSendMessage(text, amount) {
    for (let i = 0; i < amount; i ++) {
        let jsonBody = {
            context: {
                client: {
                    clientName: 'WEB',
                    clientVersion: '2.20260630.03.00'
                }
            },
            params: undefined
        };
        
        sendMessage(text).then((jsonRes) => {
            console.log(`message number ${i+1} sent`);
        });
    }
}

function massDeleteMessage(text, amount) {
    for (let i = 0; i < amount; i ++) {
        let jsonBody = {
            context: {
                client: {
                    clientName: 'WEB',
                    clientVersion: '2.20260630.03.00'
                }
            },
            params: undefined
        };
        
        sendMessage(text).then((jsonRes) => {
            console.log(`message number ${i+1} sent`);
        
            jsonBody.params = jsonRes.actions[0].addChatItemAction.item.liveChatTextMessageRenderer.inlineActionButtons[0].buttonRenderer.serviceEndpoint.moderateLiveChatEndpoint.params;
        
            let json = {
                headers: {
                    authorization: YTToken,
                },
                body: JSON.stringify(jsonBody),
                method: 'GET',
            };
            if (jsonRes.actions[0]?.addChatItemAction?.item?.liveChatTextMessageRenderer?.inlineActionButtons[0]?.buttonRenderer?.serviceEndpoint?.commandMetadata?.webCommandMetadata?.sendPost) json.method = 'POST';
        
            fetch(jsonRes.actions[0].addChatItemAction.item.liveChatTextMessageRenderer.inlineActionButtons[0].buttonRenderer.serviceEndpoint.commandMetadata.webCommandMetadata.apiUrl, json).then((res) => {
                if (res.ok)
                    console.log(`message number ${i+1} succesfully deleted`);
            });
        });
    }
}
