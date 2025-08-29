const { ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');
const UserProfile = require('../../schemas/UserProfile');

module.exports = {
    run: async ({ interaction }) => {
        if (!interaction.inGuild()) {
            return interaction.reply({
                content: "This command can only be executed inside a server.",
                ephemeral: true,
            });
        }

        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: "You must be an administrator to use this command.",
                ephemeral: true,
            });
        }

        const targetUser = interaction.options.getUser('target-user') || interaction.user;
        const amount = interaction.options.getNumber('amount');

        if (amount <= 0 || !Number.isInteger(amount)) {
            return interaction.reply({
                content: "Please specify a positive whole number amount to add.",
                ephemeral: true,
            });
        }

        await interaction.deferReply();

        try {
            const userProfile = await UserProfile.findOneAndUpdate(
                { userId: targetUser.id },
                { $inc: { balance: amount } }, 
                { upsert: true, new: true, setDefaultsOnInsert: true } 
            );

            const replyMessage = targetUser.id === interaction.user.id
                ? `Successfully added $${amount} to your balance. Your new balance is $${userProfile.balance}.`
                : `Successfully added $${amount} to <@${targetUser.id}>'s balance. Their new balance is $${userProfile.balance}.`;

            await interaction.editReply(replyMessage);

        } catch (error) {
            console.error(`Error handling /add-balance for ${targetUser.id}:`, error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({
                    content: "An unexpected error occurred while trying to add to the balance. Please try again later.",
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
        name: 'add-balance',
        description: "Add $ to a user's balance.",
        options: [
            {
                name: 'amount',
                description: "The amount of money to add.",
                type: ApplicationCommandOptionType.Number, 
                required: true,
            },
            {
                name: 'target-user',
                description: "The user whose balance you want to add to (defaults to yourself).",
                type: ApplicationCommandOptionType.User,
                required: false,
            },
        ],

        default_member_permissions: PermissionFlagsBits.Administrator,
    },
};