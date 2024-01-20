import { ArgsOf, Discord, On } from 'discordx';
import { prisma } from '..';

@Discord()
class MessageEvents {
	@On({ event: 'messageCreate' })
	async onMessage([message]: ArgsOf<'messageCreate'>) {
		if (message.author.bot) return;

		const clip = await prisma.clips.findFirst({
			where: {
				identifier: {
					equals: message.content
				}
			}
		});

		if (!clip) return;

		const serverInfo = await prisma.server.findUnique({
			where: {
				id: message.guildId
			}
		});

		if (serverInfo.deleteMsg && message.deletable) message.delete();

		try {
			await message.channel.send({
				content: clip.content,
				allowedMentions: {
					parse: []
				}
			});
		} catch (err) {
			console.log(
				`Failed to send clip content in channel (${message.guildId} | ${message.channelId})`,
				err
			);
		}

		await prisma.clips.update({
			where: {
				id: clip.id
			},
			data: {
				uses: {
					increment: 1
				},
				lastUsed: new Date()
			}
		});
	}
}
