import { Discord, Slash, SlashGroup, SlashOption } from 'discordx';
import {
	ApplicationCommandOptionType,
	AutocompleteInteraction,
	Colors,
	CommandInteraction,
	EmbedBuilder,
	TimestampStyles,
	time
} from 'discord.js';
import { client, prisma } from '..';
import dayjs from 'dayjs';
import { Clips } from '@prisma/client';

async function loadClipAutocomplete(interaction: AutocompleteInteraction) {
	const searchText = interaction.options.getFocused();
	let clips: Clips[];

	if (searchText.length === 0) {
		clips = await prisma.clips.findMany({
			where: {
				serverId: interaction.guildId
			}
		});
	} else {
		clips = await prisma.clips.findMany({
			where: {
				serverId: interaction.guildId,
				identifier: {
					contains: searchText
				}
			}
		});
	}

	clips = clips.slice(0, 25);

	interaction.respond(
		clips.map((c) => {
			return {
				name: c.identifier,
				value: c.id
			};
		})
	);
}

@Discord()
@SlashGroup({ description: 'Manage clips', name: 'clip' })
@SlashGroup('clip')
class ClipCommand {
	private invalidClip(interaction: CommandInteraction) {
		const embed = new EmbedBuilder()
			.setColor(Colors.Red)
			.setTitle('Invalid clip!')
			.setDescription(`No clip was found with that ID`);
		interaction.editReply({
			embeds: [embed]
		});
	}

	@Slash({ description: 'View information for a clip' })
	async info(
		@SlashOption({
			autocomplete: loadClipAutocomplete,
			description: 'Clip to view',
			name: 'clip',
			required: true,
			type: ApplicationCommandOptionType.String
		})
		clipId: string,
		interaction: CommandInteraction
	) {
		await interaction.deferReply({
			ephemeral: true
		});

		const clipInfo = await prisma.clips.findUnique({
			where: {
				id: clipId
			}
		});

		if (!clipInfo) return this.invalidClip(interaction);

		const creator = await client.users.fetch(clipInfo.createdBy);
		const createdAt = dayjs(clipInfo.createdAt).unix();
		const usedAt = dayjs(clipInfo.lastUsed).unix();

		const embed = new EmbedBuilder()
			.setTitle(`Clip info | ${clipInfo.identifier}`)
			.setColor(Colors.Blue);
		embed.addFields([
			{
				name: 'Created at',
				value: `${time(createdAt, TimestampStyles.RelativeTime)}`,
				inline: true
			},
			{
				name: 'Last used',
				value: `${time(usedAt, TimestampStyles.RelativeTime)}`,
				inline: true
			},
			{
				name: 'Created by',
				value: `@${creator.username}`,
				inline: true
			},
			{
				name: 'Uses',
				value: `${clipInfo.uses}`,
				inline: true
			}
		]);

		interaction.editReply({
			embeds: [embed]
		});
	}

	@Slash({ description: 'Delete a clip' })
	async delete(
		@SlashOption({
			autocomplete: loadClipAutocomplete,
			description: 'Clip to delete',
			name: 'clip',
			required: true,
			type: ApplicationCommandOptionType.String
		})
		clipId: string,
		interaction: CommandInteraction
	) {
		await interaction.deferReply({
			ephemeral: true
		});

		const clipInfo = await prisma.clips.findUnique({
			where: {
				id: clipId
			}
		});

		if (!clipInfo) return this.invalidClip(interaction);

		const ownsClip = clipInfo.createdBy == interaction.user.id;
		const isModerator = interaction.memberPermissions.has('ManageMessages');

		if (!isModerator && !ownsClip) {
			const error = new EmbedBuilder()
				.setColor(Colors.Red)
				.setTitle("You can't delete this clip!")
				.setDescription(`You must be the owner of the clip, or a moderator of this server.`);
			interaction.editReply({
				embeds: [error]
			});
			return;
		}

		await prisma.clips.delete({
			where: {
				id: clipId
			}
		});

		const embed = new EmbedBuilder()
			.setColor(Colors.Green)
			.setTitle('Success!')
			.setDescription(`Successfully removed clip.`);

		interaction.editReply({
			embeds: [embed]
		});
	}
}
