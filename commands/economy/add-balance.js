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

        const targetUser = interaction.options.getUser('target-user') || interaction.user;
        const amount = interaction.options.getNumber('amount');

        if (amount <= 0 || !Number.isInteger(amount)) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Invalid Amount')
                .setDescription('Please specify a positive whole number amount to add.')
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
            const userProfile = await UserProfile.findOneAndUpdate(
                { userId: targetUser.id },
                { $inc: { balance: amount } }, 
                { upsert: true, new: true, setDefaultsOnInsert: true } 
            );

            const successEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Balance Added Successfully')
                .setThumbnail(targetUser.displayAvatarURL())
                .addFields(
                    {
                        name: 'Amount Added',
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

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error(`Error handling /add-balance for ${targetUser.id}:`, error);
            if (interaction.deferred || interaction.replied) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('❌ Error')
                    .setDescription('An unexpected error occurred while trying to add to the balance. Please try again later.')
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