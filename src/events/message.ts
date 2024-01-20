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

		message.channel.send(clip.content);
	}
}
