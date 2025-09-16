# Economy Bot

## Overview

This is a Discord economy bot built with Node.js that provides balance management commands for Discord servers. The bot allows administrators to add and withdraw virtual currency from user accounts, while all users can check their balance. It features a simple web server for health checks and uses MongoDB for persistent data storage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Bot Framework
- **Discord.js v14**: Modern Discord bot framework with proper intents configuration for guild operations, member management, and message handling
- **djs-commander**: Command handler framework for organizing Discord slash commands and events in separate files
- **Event-driven architecture**: Modular event system with separate handlers for client ready state and message interactions

### Data Storage
- **MongoDB with Mongoose**: NoSQL database for persistent user data storage
- **UserProfile Schema**: Simple schema tracking user ID, balance, and timestamps with automatic upsert functionality
- **Graceful database handling**: Bot continues operation even if database connection fails, with clear error messaging

### Web Server Component
- **Express.js**: Lightweight HTTP server on port 5000 for health checks and monitoring
- **Basic endpoint**: Single route (`/`) that confirms bot operational status

### Command Structure
- **Economy Commands**: Balance checking, administrator-only balance addition/withdrawal
- **Permission-based access**: Administrator permissions required for balance modification commands
- **Guild-only execution**: All economy commands restricted to Discord servers (not DMs)
- **Input validation**: Amount validation ensuring positive whole numbers for transactions

### Error Handling
- **Comprehensive error catching**: Database errors, Discord API errors, and invalid inputs
- **User-friendly error messages**: Clear feedback for permission issues, invalid amounts, and system errors
- **Graceful degradation**: Bot functionality maintained even with database connectivity issues

## External Dependencies

### Discord Integration
- **Discord API**: Full integration through discord.js for slash commands, user interactions, and server management
- **Bot permissions**: Requires guild access, member reading, and message content permissions

### Database Services
- **MongoDB**: Primary data storage for user profiles and economy data
- **Connection flexibility**: Supports both standard MongoDB and MongoDB Atlas (mongodb+srv://) connection strings

### Development Tools
- **Cloudflare Wrangler**: Development dependency for potential deployment to Cloudflare Workers
- **Environment variables**: Secure configuration management for Discord token and database credentials

### Runtime Environment
- **Node.js**: Server-side JavaScript runtime
- **dotenv**: Environment variable management for secure credential handling
