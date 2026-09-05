// kubutek: from now on i will add an "authorization" variable to all of my functions
function createComment(authorization, videoId, commentText) {
	fetch("https://www.youtube.com/youtubei/v1/comment/create_comment?prettyPrint=false", {
		headers: { authorization },
		body: JSON.stringify({
			context: {
				client: {
					clientName: 'WEB',
					clientVersion: '2.20260904.01.00'
				}
			},
			createCommentParams: encodeURIComponent(btoa(`\x12\v${videoId}*\x02\b\x00P\x0Eè\x02\x01¨\x03\x00`)),
			commentText
		}),
		method: 'POST'
	});
}
