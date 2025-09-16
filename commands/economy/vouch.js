const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const Vouch = require('../../schemas/Vouch');

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

        const targetUser = interaction.options.getUser('user');
        const rating = interaction.options.getInteger('rating');
        const comment = interaction.options.getString('comment');

        // Check if user is trying to vouch for themselves
        if (targetUser.id === interaction.user.id) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Invalid Target')
                .setDescription('You cannot vouch for yourself!')
                .setTimestamp();
            return interaction.reply({
                embeds: [errorEmbed],
                ephemeral: true,
            });
        }

        // Check if user already vouched for this person
        const existingVouch = await Vouch.findOne({
            voucherId: interaction.user.id,
            targetUserId: targetUser.id
        });

        if (existingVouch) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#ffaa00')
                .setTitle('⚠️ Already Vouched')
                .setDescription(`You have already vouched for <@${targetUser.id}>. Each user can only vouch once per person.`)
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
            // Create new vouch
            const newVouch = new Vouch({
                voucherId: interaction.user.id,
                targetUserId: targetUser.id,
                rating: rating,
                comment: comment,
                voucherTag: interaction.user.tag,
                targetTag: targetUser.tag,
            });

            await newVouch.save();

            // Generate star display
            const stars = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);

            const successEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Vouch Added Successfully')
                .setThumbnail(targetUser.displayAvatarURL())
                .addFields(
                    {
                        name: 'Vouched User',
                        value: `<@${targetUser.id}>`,
                        inline: true
                    },
                    {
                        name: 'Rating',
                        value: `${stars} (${rating}/5)`,
                        inline: true
                    },
                    {
                        name: 'Comment',
                        value: comment,
                        inline: false
                    },
                    {
                        name: 'Vouched by',
                        value: `<@${interaction.user.id}>`,
                        inline: true
                    }
                )
                .setTimestamp();

            await interaction.editReply({ 
                embeds: [successEmbed],
                allowedMentions: { parse: [] }
            });

        } catch (error) {
            console.error(`Error creating vouch:`, error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('An unexpected error occurred while creating the vouch. Please try again later.')
                .setTimestamp();
            
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({
                    embeds: [errorEmbed],
                    ephemeral: true,
                });
            } else {
                await interaction.reply({
                    embeds: [errorEmbed],
                    ephemeral: true,
                });
            }
        }
    },

    data: {
        name: 'vouch',
        description: "Give a vouch/review to another user with star rating.",
        options: [
            {
                name: 'user',
                description: "The user you want to vouch for.",
                type: ApplicationCommandOptionType.User,
                required: true,
            },
            {
                name: 'rating',
                description: "Star rating (1-5 stars).",
                type: ApplicationCommandOptionType.Integer,
                required: true,
                choices: [
                    { name: '⭐ (1 star)', value: 1 },
                    { name: '⭐⭐ (2 stars)', value: 2 },
                    { name: '⭐⭐⭐ (3 stars)', value: 3 },
                    { name: '⭐⭐⭐⭐ (4 stars)', value: 4 },
                    { name: '⭐⭐⭐⭐⭐ (5 stars)', value: 5 },
                ]
            },
            {
                name: 'comment',
                description: "Your review/comment (max 500 characters).",
                type: ApplicationCommandOptionType.String,
                required: true,
            },
        ],
    },
};