import { Discord, Slash, SlashGroup, SlashOption } from 'discordx';
import { ApplicationCommandOptionType, CommandInteraction, bold, time } from 'discord.js';
import { prisma } from '..';

@Discord()
@SlashGroup({ description: 'Manage clip settings', name: 'clipsettings' })
@SlashGroup('clipsettings')
class ClipCommand {
	@Slash({
		description: 'Manage clip creation restriction',
		defaultMemberPermissions: 'ManageGuild'
	})
	async restrict(
		@SlashOption({
			description: 'Whether to restrict clip creation',
			name: 'restrict',
			required: true,
			type: ApplicationCommandOptionType.Boolean
		})
		restricted: boolean,
		interaction: CommandInteraction
	) {
		await interaction.deferReply({
			ephemeral: true
		});

		await prisma.server.update({
			where: {
				id: interaction.guildId
			},
			data: {
				restricted
			}
		});

		let msg = restricted ? 'can no longer' : 'can now';

		interaction.editReply({
			content: `Members ${msg} create clips.`
		});
	}

	@Slash({
		description: 'Manage clip trigger deletion',
		defaultMemberPermissions: 'ManageGuild'
	})
	async delete(
		@SlashOption({
			description: 'Whether to delete clip triggers',
			name: 'delete',
			required: true,
			type: ApplicationCommandOptionType.Boolean
		})
		deleteMsg: boolean,
		interaction: CommandInteraction
	) {
		await interaction.deferReply({
			ephemeral: true
		});

		await prisma.server.update({
			where: {
				id: interaction.guildId
			},
			data: {
				deleteMsg
			}
		});

		interaction.editReply({
			content: `${bold(deleteMsg ? 'Enabled' : 'disabled')} clip trigger deletion.`
		});
	}
}
