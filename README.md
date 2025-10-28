# HealthLink WhatsApp Bot 🤖

An intelligent WhatsApp bot for HealthLink that uses semantic matching to answer user questions about the platform.

## 🚀 Quick Start

### Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   ```bash
   cp config.env.example .env
   # Edit .env with your settings
   ```

3. **Start the bot:**
   ```bash
   # Windows
   start_server.bat
   
   # Linux/Mac
   chmod +x start_server.sh
   ./start_server.sh
   ```

4. **Scan QR code** with WhatsApp

### Production Deployment

For production deployment on Debian/Ubuntu servers, see **[PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)**.

## ✨ Features

- ✅ **Intelligent Q&A**: Uses semantic search to answer questions
- ✅ **Fast**: < 50ms per query (persistent server architecture)
- ✅ **Scalable**: Can handle hundreds of requests per second
- ✅ **Multilingual**: Supports French and English
- ✅ **Media Support**: Sends images with responses
- ✅ **Smart Routing**: Different behaviors for questions, greetings, and commands
- ✅ **REST API**: HTTP API for sending messages programmatically
- ✅ **Session Management**: Prevents duplicate processing
- ✅ **Production Ready**: Systemd services, logging, monitoring, backups

## 🏗️ Architecture

### Components

1. **`main.js`** - WhatsApp bot (Node.js)
2. **`semantic_server.py`** - Semantic search server (Python)
3. **`qa_knowledge.json`** - Knowledge base (JSON)
4. **`images/`** - Product images

### Message Flow

```
User Message → WhatsApp Bot → Semantic Server → Knowledge Base → Response
```

## 📁 Project Structure

```
whatsapp-web-node-test/
├── main.js                    # Main bot application
├── semantic_server.py         # Semantic search server
├── qa_knowledge.json          # Q/A knowledge base
├── config.env.example         # Environment configuration template
├── requirements.txt           # Python dependencies
├── package.json               # Node.js dependencies
├── images/                    # Product images
├── start_server.sh           # Linux/Mac startup script
├── start_server.bat          # Windows startup script
├── start_production.sh       # Production startup script
├── deploy_debian.sh          # Automated deployment script
├── healthlink-bot.service     # Systemd service for bot
├── healthlink-semantic.service # Systemd service for semantic server
├── PRODUCTION_DEPLOYMENT.md  # Production deployment guide
├── UPDATE_QA.md              # Knowledge base update guide
└── README.md                 # This file
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file from `config.env.example`:

```env
# WhatsApp Bot Configuration
WHATSAPP_SECRET=your_secret_token_here
WHATSAPP_API_PORT=15852

# Semantic Search Server Configuration
SEMANTIC_SERVER_PORT=8000
SEMANTIC_SERVER_HOST=127.0.0.1

# Production Settings
NODE_ENV=production
LOG_LEVEL=info
```

## 🎯 Bot Modes

### Question Mode
When users ask questions (e.g., "Qu'est-ce que HealthLink?"):
- Bot calls semantic search
- Returns matching answer from knowledge base
- No media sent

### Go Mode
When users type "go" or "go!":
- Returns full introduction to HealthLink
- Sends product images

### Greeting Mode
For greetings (bonjour, salut, etc.):
- Friendly welcome message
- Invites user to ask questions
- Sends product images

## 🔌 API Endpoints

### POST `/send`

Send a message via HTTP API.

**Request:**
```json
{
  "to": "243892615790",
  "message": "Hello!",
  "token": "your_secret_token"
}
```

**Response:**
```json
{
  "success": true
}
```

## 📚 Documentation

- **[PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)** - Complete production deployment guide
- **[UPDATE_QA.md](UPDATE_QA.md)** - How to update the knowledge base
- **[QUICK_START.md](QUICK_START.md)** - Quick start guide for development

## 🛠️ Development

### Testing

```bash
# Test semantic search
curl "http://127.0.0.1:8000/?q=Qu'est-ce%20que%20HealthLink%3F"

# Test bot API
curl -X POST http://127.0.0.1:15852/send \
  -H "Content-Type: application/json" \
  -d '{"to":"243892615790","message":"Test","token":"your_token"}'
```

### Adding Q/A Pairs

Edit `qa_knowledge.json` and add entries:
```json
{
  "question": "Your question?",
  "answer": "Your detailed answer"
}
```

No retraining needed - just save and the bot uses it immediately!

## 🔒 Security

- **API Authentication**: Token-based security
- **Dedicated User**: Runs as `whatsapp-bot` user in production
- **Firewall**: Only necessary ports open
- **Logging**: Comprehensive audit trail
- **File Permissions**: Proper ownership and permissions

## 📊 Performance

- **Memory**: ~50 MB total
- **Startup**: < 1 second
- **Query response**: < 50ms
- **Concurrent users**: Hundreds per second
- **No downloads**: Everything works offline

## 🚨 Troubleshooting

### Common Issues

**"python: command not found"**
```bash
# Use python3 instead
python3 semantic_server.py 8000
```

**"Port 8000 already in use"**
```bash
# Change port in .env file
SEMANTIC_SERVER_PORT=8001
```

**"Can't connect to semantic server"**
```bash
# Make sure semantic server is running first
python3 semantic_server.py 8000
```

### Production Issues

See **[PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)** for production troubleshooting.

## 📦 Dependencies

### Node.js
- `express` - Web framework
- `whatsapp-web.js` - WhatsApp client
- `qrcode-terminal` - QR code display
- `dotenv` - Environment variables

### Python
- `scikit-learn` - TF-IDF vectorization and cosine similarity
- `numpy` - Numerical operations

## 📄 License

MIT

## 📞 Support

- **WhatsApp**: https://wa.me/243892615790
- **Website**: https://gethealth.link
- **Documentation**: See files in this repository

