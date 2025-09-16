const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const UserProfile = require('../../schemas/UserProfile');

module.exports = {
    run: async ({ interaction }) => {
        if (!interaction.inGuild()) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('This command can only be executed inside a server.')
                .setTimestamp();
            return interaction.reply({
                embeds: [errorEmbed],
                ephemeral: true,
            });
        }

        const targetUser = interaction.options.getUser('target-user') || interaction.user;

        if (!interaction.replied && !interaction.deferred) {
            await interaction.deferReply();
        }

        try {
            let userProfile = await UserProfile.findOne({ userId: targetUser.id });

            if (!userProfile) {
                userProfile = new UserProfile({ userId: targetUser.id, balance: 0 });
                await userProfile.save();
            }

            const balanceEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('💰 Balance Information')
                .setThumbnail(targetUser.displayAvatarURL())
                .addFields({
                    name: targetUser.id === interaction.user.id ? 'Your Balance' : `${targetUser.displayName}'s Balance`,
                    value: `$${userProfile.balance}`,
                    inline: true
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [balanceEmbed] });

        } catch (error) {
            console.error(`Error handling /balance for user ${interaction.user.id} (target: ${targetUser.id}):`, error);

            if (interaction.deferred || interaction.replied) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Error')
                    .setDescription('An unexpected error occurred while trying to check the balance. Please try again later.')
                    .setTimestamp();
                await interaction.editReply({
                    embeds: [errorEmbed],
                    ephemeral: true,
                });
            } else {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Error')
                    .setDescription('An unexpected error occurred. Please try again later.')
                    .setTimestamp();
                await interaction.reply({
                    embeds: [errorEmbed],
                    ephemeral: true,
                });
            }
        }
    },

    data: {
        name: 'balance',
        description: "Check your or another user's balance.",
        options: [
            {
                name: 'target-user',
                description: "The user whose balance you want to see (defaults to yourself).",
                type: ApplicationCommandOptionType.User,
                required: false, 
            },
        ],
    },
};