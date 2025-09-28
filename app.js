import app from "./client.js";
import { getOptedIn, logInteraction, saveState } from "./datahandler.js";
const aiApiUrl = "https://openrouter.ai/api/v1/chat/completions";
const headers = {
	"Authorization": `Bearer ${process.env.CEMOJIS_AI_API_KEY}`,
	"Content-Type": "application/json"
};
const reaction_emojis = [
	"chess-brilliant",
	"great",
	"bestmove",
	"excellent_move",
	"good_move",
	"book_move",
	"inaccuracy",
	"real-chess-mistake",
	"real-chess-missed-win",
	"blunder"
];
const systemMessage = `The user message consists of a message sent in a conversation. Your job is to analyze the message and determine how it would fit as a chess move. `
	+ `For example, a VERY common question or statement that might usually start a conversation would be a book move. A book move should ONLY be chosen if the message makes sense to start a conversation`
	+ `The best response to a question or statement would likely be a best move. A response that might not be the best but is still good and understandable would be an excellent move. A simply acceptable response would be a good move. A message that is a bit of a mistake or worse than a good move would be an inaccuracy. Worse than that, a mistake. Even worse, a blunder. A message that is unexpected but much better than the expected best move is a great move. A message that is very unexpected, brings more information, and is far beyond the expected best message would be considered a brilliant move. Finally, a message that had a really obvious best move that wasn't said could possibly be a miss instead. What you HAVE to do is respond EXACTLY with one of these following strings according to your best analysis: ${reaction_emojis.join(", ")}.`;

app.message('', async ({ message }) => {
	const optedIn = getOptedIn().opted_in;
	if (!optedIn.includes(message.user)) return;
	if (message.text.toLowerCase().includes("secret button")) {
		await app.client.reactions.add({
			"channel": message.channel,
			"name": reaction_emojis[0],
			"timestamp": message.ts
		});
		return;
	}
	const response = await fetch(aiApiUrl, {
		method: "POST",
		headers,
		body: JSON.stringify({
			"model": "openai/gpt-oss-120b",
			"messages": [
				{
					"role": "system",
					"content": systemMessage
				},
				{
					"role": "user",
					"content": message.text
				}
			]
		})
	});
	const data = await response.json();
	console.log(data.choices[0].message);
	await app.client.reactions.add({
		"channel": message.channel,
		"name": (res => (reaction_emojis.includes(res) ? res : "error_web"))(data.choices[0].message.content),
		"timestamp": message.ts
	});

});

app.command('/chess-emojis-opt-in', async (interaction) => {
	await interaction.ack();
	await logInteraction(interaction);
	let userId = interaction.payload.user_id;
	let optedIn = getOptedIn().opted_in;

	if (optedIn.includes(userId)) {
		await interaction.client.chat.postEphemeral({
			"channel": interaction.command.channel_id,
			"user": userId,
			"text": `<@${userId}> has already opted into the Chess Emojis bot's reactions! :${reaction_emojis[6]}:`
		});
		return;
	}

	await interaction.client.chat.postEphemeral({
		"channel": interaction.command.channel_id,
		"user": userId,
		"text": `<@${userId}> opted into the Chess Emoji bot's reactions!!! :${reaction_emojis[0]}:`
	});
	optedIn.push(userId);
	saveState({ "opted_in": optedIn });
});

app.command('/chess-emojis-opt-out', async (interaction) => {
	await interaction.ack();
	await logInteraction(interaction);
	let userId = interaction.payload.user_id;
	let optedIn = getOptedIn().opted_in;

	if (optedIn.includes(userId)) {
		await interaction.client.chat.postEphemeral({
			"channel": interaction.command.channel_id,
			"user": userId,
			"text": `<@${userId}> opted out the Chess Emoji bot's reactions. :${reaction_emojis[9]}:`
		});
		optedIn.splice(optedIn.indexOf(userId), 1);
		saveState({ "opted_in": optedIn });
		return;
	}

	await interaction.client.chat.postEphemeral({
		"channel": interaction.command.channel_id,
		"user": userId,
		"text": `<@${userId}> You can't opt out because you aren't opted into the Chess Emojis bot's reactions! :${reaction_emojis[7]}:`
	});
});

app.message(/secret button/i, async ({ message, say }) => {
	// say() sends a message to the channel where the event was triggered
	await app.client.chat.postEphemeral({
		channel: message.channel,
		user: message.user,
		blocks: [
			{
				"type": "section",
				"text": {
					"type": "mrkdwn",
					"text": `<@${message.user}> mentioned the secret button! Here it is:`
				}
			},
			{
				"type": "actions",
				"elements": [
					{
						"type": "button",
						"text": {
							"type": "plain_text",
							"text": "Secret Button :" + reaction_emojis[0] + ":"
						},
						"action_id": "button_click"
					}
				]
			}
		],
		text: `<@${message.user}> mentioned the secret button! Here it is:`,
		thread_ts: message.ts
	});
});

app.action('button_click', async ({ body, ack, respond }) => {
	// Acknowledge the action
	await ack();
	console.log(body.channel.id, body.user.id, body.container.message_ts);
	await app.client.chat.postEphemeral({
		channel: body.channel.id,
		user: body.user.id,
		blocks: [
			{
				"type": "section",
				"text": {
					"type": "mrkdwn",
					"text": `<@${body.user.id}> found the secret button :${reaction_emojis[0]}: Here it is again.`
				}
			},
			{
				"type": "actions",
				"elements": [
					{
						"type": "button",
						"text": {
							"type": "plain_text",
							"text": "Secret Button :" + reaction_emojis[0] + ":"
						},
						"action_id": "button_click"
					}
				]
			}
		],
		text: `<@${body.user.id}> found the secret button :${reaction_emojis[0]}: Here it is again.`,
		thread_ts: body.container.message_ts
	});
});