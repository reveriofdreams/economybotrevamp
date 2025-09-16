const { ApplicationCommandOptionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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

        const targetUser = interaction.options.getUser('user') || interaction.user;
        
        // Get member to access displayName
        let targetMember;
        try {
            targetMember = await interaction.guild.members.fetch(targetUser.id);
        } catch (error) {
            targetMember = null;
        }
        const displayName = targetMember?.displayName || targetUser.globalName || targetUser.username;

        if (!interaction.replied && !interaction.deferred) {
            await interaction.deferReply();
        }

        try {
            // Get all vouches for the target user
            const vouches = await Vouch.find({ targetUserId: targetUser.id }).sort({ createdAt: -1 });

            if (vouches.length === 0) {
                const noVouchesEmbed = new EmbedBuilder()
                    .setColor('#ffaa00')
                    .setTitle('📝 No Vouches Found')
                    .setThumbnail(targetUser.displayAvatarURL())
                    .setDescription(targetUser.id === interaction.user.id 
                        ? 'You haven\'t received any vouches yet.' 
                        : `<@${targetUser.id}> hasn't received any vouches yet.`)
                    .setTimestamp();

                return interaction.editReply({ 
                    embeds: [noVouchesEmbed],
                    allowedMentions: { parse: [] }
                });
            }

            // Calculate average rating
            const totalRating = vouches.reduce((sum, vouch) => sum + vouch.rating, 0);
            const averageRating = (totalRating / vouches.length).toFixed(1);
            const averageStars = '⭐'.repeat(Math.round(averageRating)) + '☆'.repeat(5 - Math.round(averageRating));

            // Create main embed with summary
            const summaryEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`📋 Vouches for ${displayName}`)
                .setThumbnail(targetUser.displayAvatarURL())
                .addFields(
                    {
                        name: 'Total Vouches',
                        value: `${vouches.length}`,
                        inline: true
                    },
                    {
                        name: 'Average Rating',
                        value: `${averageStars} (${averageRating}/5)`,
                        inline: true
                    }
                )
                .setTimestamp();

            const embeds = [summaryEmbed];

            // Pagination setup
            const vouchesPerPage = 3;
            const totalPages = Math.ceil(vouches.length / vouchesPerPage);
            let currentPage = 0;

            const generatePage = (page) => {
                const startIndex = page * vouchesPerPage;
                const endIndex = startIndex + vouchesPerPage;
                const pageVouches = vouches.slice(startIndex, endIndex);
                
                const pageEmbeds = [summaryEmbed];
                
                pageVouches.forEach((vouch, index) => {
                    const stars = '⭐'.repeat(vouch.rating) + '☆'.repeat(5 - vouch.rating);
                    const vouchEmbed = new EmbedBuilder()
                        .setColor('#4CAF50')
                        .setTitle(`${displayName}'s Review #${startIndex + index + 1}`)
                        .addFields(
                            {
                                name: 'Rating',
                                value: `${stars} (${vouch.rating}/5)`,
                                inline: false
                            },
                            {
                                name: 'Comment',
                                value: vouch.comment,
                                inline: false
                            },
                            {
                                name: 'Reviewed by',
                                value: `<@${vouch.voucherId}>`,
                                inline: true
                            },
                            {
                                name: 'Date',
                                value: `<t:${Math.floor(vouch.createdAt.getTime() / 1000)}:R>`,
                                inline: true
                            }
                        );
                    
                    pageEmbeds.push(vouchEmbed);
                });

                // Add page info
                if (totalPages > 1) {
                    const pageInfoEmbed = new EmbedBuilder()
                        .setColor('#666666')
                        .setDescription(`📄 Page ${page + 1} of ${totalPages} • Showing ${pageVouches.length} vouches`);
                    pageEmbeds.push(pageInfoEmbed);
                }

                return pageEmbeds;
            };

            const generateButtons = (page) => {
                if (totalPages <= 1) return [];
                
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('vouches_prev')
                            .setLabel('◀ Previous')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(page === 0),
                        new ButtonBuilder()
                            .setCustomId('vouches_next')
                            .setLabel('Next ▶')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(page === totalPages - 1)
                    );
                return [row];
            };

            const message = await interaction.editReply({ 
                embeds: generatePage(currentPage),
                components: generateButtons(currentPage),
                allowedMentions: { parse: [] }
            });

            // Add button interaction handling if there are multiple pages
            if (totalPages > 1) {
                const collector = message.createMessageComponentCollector({
                    filter: (i) => i.user.id === interaction.user.id,
                    time: 300000 // 5 minutes
                });

                collector.on('collect', async (buttonInteraction) => {
                    if (buttonInteraction.customId === 'vouches_prev') {
                        currentPage = Math.max(0, currentPage - 1);
                    } else if (buttonInteraction.customId === 'vouches_next') {
                        currentPage = Math.min(totalPages - 1, currentPage + 1);
                    }

                    await buttonInteraction.update({
                        embeds: generatePage(currentPage),
                        components: generateButtons(currentPage),
                        allowedMentions: { parse: [] }
                    });
                });

                collector.on('end', async () => {
                    try {
                        await interaction.editReply({
                            embeds: generatePage(currentPage),
                            components: [],
                            allowedMentions: { parse: [] }
                        });
                    } catch (error) {
                        // Message might have been deleted, ignore error
                    }
                });
            }

        } catch (error) {
            console.error(`Error fetching vouches:`, error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('❌ Error')
                .setDescription('An unexpected error occurred while fetching vouches. Please try again later.')
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
        name: 'vouches',
        description: "View all vouches/reviews for a user.",
        options: [
            {
                name: 'user',
                description: "The user whose vouches you want to see (defaults to yourself).",
                type: ApplicationCommandOptionType.User,
                required: false,
            },
        ],
    },
};