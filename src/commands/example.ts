import { Discord, Slash } from 'discordx';
import { CommandInteraction } from 'discord.js';

@Discord()
class ExampleCommand {
	@Slash({ description: 'No description specified' })
	async example(interaction: CommandInteraction) {
		interaction.reply({
			content: 'Hello, world! :wave:'
		});
	}
}
