import app from "./client.js";

app.message('secret button', async ({ message, say }) => {
	// say() sends a message to the channel where the event was triggered
	await say({
		blocks: [
			{
				"type": "section",
				"text": {
					"type": "mrkdwn",
					"text": `<@${message.user}> mentioned the secret button! Here it is:`
				},
				"accessory": {
					"type": "button",
					"text": {
						"type": "plain_text",
						"text": "Secret Button :chess-brilliant:"
					},
					"action_id": "button_click"
				}
			}
		],
		text: `<@${message.user}> mentioned the secret button! Here it is:`
	});
});

app.action('button_click', async ({ body, ack, say }) => {
	// Acknowledge the action
	await ack();
	await say({
		blocks: [
			{
				"type": "section",
				"text": {
					"type": "mrkdwn",
					"text": `<@${body.user.id}> found the secret button :chess-brilliant: Here it is again.`
				},
				"accessory": {
					"type": "button",
					"text": {
						"type": "plain_text",
						"text": "Secret Button :chess-brilliant:"
					},
					"action_id": "button_click"
				}
			}
		],
		text: `<@${body.user.id}> found the secret button :chess-brilliant: Here it is again.`
	});
});