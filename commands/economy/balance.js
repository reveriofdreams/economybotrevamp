const { ApplicationCommandOptionType } = require('discord.js');
const UserProfile = require('../../schemas/UserProfile');

module.exports = {
    run: async ({ interaction }) => {
        if (!interaction.inGuild()) {
            return interaction.reply({
                content: "This command can only be executed inside a server.",
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

            let replyMessage;
            if (targetUser.id === interaction.user.id) {
                replyMessage = `Your current balance is **$${userProfile.balance}**.`;
            } else {
                replyMessage = `<@${targetUser.id}>'s current balance is **$${userProfile.balance}**.`;
            }

            await interaction.editReply(replyMessage);

        } catch (error) {
            console.error(`Error handling /balance for user ${interaction.user.id} (target: ${targetUser.id}):`, error);

            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({
                    content: "An unexpected error occurred while trying to check the balance. Please try again later.",
                    ephemeral: true,
                });
            } else {
                await interaction.reply({
                    content: "An unexpected error occurred. Please try again later.",
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