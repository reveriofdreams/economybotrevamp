module.exports = {
  name: 'clientReady',
  once: true,
  execute(client) {
    console.log(`✅ Logged in as ${client.user.tag} | Serving ${client.guilds.cache.size} servers`);
  }
};