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

        const targetUser = interaction.options.getUser('target-user');
        const amount = interaction.options.getNumber('amount');

        if (amount <= 0 || !Number.isInteger(amount)) {
            return interaction.reply({
                content: "You must specify a positive whole number amount to withdraw.",
                ephemeral: true,
            });
        }

        await interaction.deferReply();

        try {

            let userProfile = await UserProfile.findOne({ userId: targetUser.id });

            if (!userProfile || userProfile.balance < amount) {
                const currentBalance = userProfile ? userProfile.balance : 0;
                return interaction.editReply({
                    content: `The user <@${targetUser.id}> does not have enough $ to withdraw $${amount}. Their current balance is $${currentBalance}.`,
                    ephemeral: false,
                });
            }

            userProfile.balance -= amount;
            await userProfile.save();

            let replyMessage;
            if (targetUser.id === interaction.user.id) {
                replyMessage = `Successfully withdrew $${amount} from your balance. Your new balance is $${userProfile.balance}.`;
            } else {
                replyMessage = `Successfully withdrew $${amount} from <@${targetUser.id}>'s balance. Their new balance is $${userProfile.balance}. ✅`;
            }

            interaction.editReply(replyMessage);

        } catch (error) {
            console.error(`Error handling /withdraw for ${targetUser.id}:`, error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({
                    content: "An unexpected error occurred while trying to withdraw from the balance. Please try again later.",
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
        name: 'withdraw',
        description: "Withdraw money from a user's balance (Admin only).",
        options: [
            {
                name: 'target-user', 
                description: "The user whose balance you want to withdraw from.",
                type: ApplicationCommandOptionType.User,
                required: true,
            },
            {
                name: 'amount',
                description: "The amount of money to withdraw.",
                type: ApplicationCommandOptionType.Number,
                required: true,
            },
        ],

        default_member_permissions: PermissionFlagsBits.Administrator,
    },
};