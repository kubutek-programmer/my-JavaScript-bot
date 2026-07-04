YTToken = /* yk what to do i aint rewriting that */;

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
    }).then((res) => {
        return res.json();
    }).then((json) => {
        console.log(json); // this outputs the JSON returned by YouTube
    });
}

sendMessage('test');
