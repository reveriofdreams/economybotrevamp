const { ApplicationCommandOptionType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
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

        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Access Denied')
                .setDescription('You must be an administrator to use this command.')
                .setTimestamp();
            return interaction.reply({
                embeds: [errorEmbed],
                ephemeral: true,
            });
        }

        const targetUser = interaction.options.getUser('target-user');
        const amount = interaction.options.getNumber('amount');

        if (amount <= 0 || !Number.isInteger(amount)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Invalid Amount')
                .setDescription('You must specify a positive whole number amount to withdraw.')
                .setTimestamp();
            return interaction.reply({
                embeds: [errorEmbed],
                ephemeral: true,
            });
        }

        if (!interaction.replied && !interaction.deferred) {
            await interaction.deferReply();
        }

        try {

            let userProfile = await UserProfile.findOne({ userId: targetUser.id });

            if (!userProfile || userProfile.balance < amount) {
                const currentBalance = userProfile ? userProfile.balance : 0;
                const insufficientEmbed = new EmbedBuilder()
                    .setColor('#ffaa00')
                    .setTitle('⚠️ Insufficient Funds')
                    .setThumbnail(targetUser.displayAvatarURL())
                    .addFields(
                        {
                            name: 'Attempted Withdrawal',
                            value: `$${amount}`,
                            inline: true
                        },
                        {
                            name: 'Current Balance',
                            value: `$${currentBalance}`,
                            inline: true
                        },
                        {
                            name: 'User',
                            value: `<@${targetUser.id}>`,
                            inline: true
                        }
                    )
                    .setTimestamp();
                return interaction.editReply({
                    embeds: [insufficientEmbed],
                    ephemeral: false,
                });
            }

            userProfile.balance -= amount;
            await userProfile.save();

            const successEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Balance Withdrawn Successfully')
                .setThumbnail(targetUser.displayAvatarURL())
                .addFields(
                    {
                        name: 'Amount Withdrawn',
                        value: `$${amount}`,
                        inline: true
                    },
                    {
                        name: 'New Balance',
                        value: `$${userProfile.balance}`,
                        inline: true
                    },
                    {
                        name: 'User',
                        value: targetUser.id === interaction.user.id ? 'You' : `<@${targetUser.id}>`,
                        inline: true
                    }
                )
                .setTimestamp();

            interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error(`Error handling /withdraw for ${targetUser.id}:`, error);
            if (interaction.deferred || interaction.replied) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Error')
                    .setDescription('An unexpected error occurred while trying to withdraw from the balance. Please try again later.')
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