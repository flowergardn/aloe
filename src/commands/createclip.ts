import { ContextMenu, Discord, ModalComponent } from 'discordx';
import {
	ActionRowBuilder,
	ApplicationCommandType,
	Colors,
	EmbedBuilder,
	MessageContextMenuCommandInteraction,
	ModalBuilder,
	ModalSubmitInteraction,
	TextInputBuilder,
	TextInputStyle,
	inlineCode
} from 'discord.js';
import NodeCache from 'node-cache';
import { prisma } from '..';

const cache = new NodeCache({
	stdTTL: 60 * 5
});

@Discord()
export class CreateClip {
	@ContextMenu({
		name: 'Clip this',
		type: ApplicationCommandType.Message
	})
	async clipThis(interaction: MessageContextMenuCommandInteraction) {
		const modal = new ModalBuilder().setTitle('Name this clip').setCustomId('name-clip');

		cache.set(interaction.user.id, interaction.targetMessage.id);

		modal.addComponents([
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder().setStyle(TextInputStyle.Short).setCustomId('name').setLabel('Name')
			)
		]);

		interaction.showModal(modal);
	}

	@ModalComponent({ id: 'name-clip' })
	async handleForm(interaction: ModalSubmitInteraction) {
		if (!cache.has(interaction.user.id)) return await interaction.deferUpdate();
		await interaction.deferReply({
			ephemeral: true
		});

		const clipName = interaction.fields.getTextInputValue('name');

		const msgId: string = cache.get(interaction.user.id);
		const msg = await interaction.channel.messages.fetch(msgId);

		await prisma.clips.create({
			data: {
				identifier: clipName,
				content: msg.content,
				createdBy: interaction.user.id,
				serverId: interaction.guildId
			}
		});

		const embed = new EmbedBuilder()
			.setColor(Colors.Green)
			.setTitle('Clip created!')
			.setDescription(`That message will be sent any time someone says ${inlineCode(clipName)}`);

		interaction.editReply({
			embeds: [embed]
		});
	}
}
