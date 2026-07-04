YTToken = /* put your YouTube authorization token here */;

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
            params: 'Q2lrcUp3b1lWVU5wVjJVMldEYzBiV3RCZVd3d1NXcG9WRWRUYmxCUkVndEdVR0kyWkZJeFdVaEVNQkFCR0FRJTNE', // put the live chat continuation, you can get this by copying what YouTube sends through DevTools Network tab
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
            params: 'Q2lrcUp3b1lWVU5wVjJVMldEYzBiV3RCZVd3d1NXcG9WRWRUYmxCUkVndG9aakJ1V1UxWmRWVTBXUkFCR0FRJTNE', // put the live chat continuation, you can get this by copying what YouTube sends through DevTools Network tab
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
    }).then((jsonRes) => {
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
