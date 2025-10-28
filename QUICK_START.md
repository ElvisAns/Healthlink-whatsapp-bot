# Quick Start Guide 🚀

Get your intelligent WhatsApp bot running in 3 steps!

## Step 1: Install Dependencies

**Python:**
```bash
pip install scikit-learn numpy
```

**Node.js:**
```bash
npm install
```

## Step 2: Run the Bot

### Option A: Single Command (Recommended)

**Windows:**
```bash
start_server.bat
```

**Linux/Mac:**
```bash
chmod +x start_server.sh
./start_server.sh
```

This starts both:
1. Python Semantic Search Server (port 8000)
2. WhatsApp Bot

### Option B: Two Terminals

**Terminal 1:**
```bash
python semantic_server.py 8000
```

**Terminal 2:**
```bash
node main.js
```

## Step 3: Scan QR Code

Scan the QR code displayed in your terminal with WhatsApp.

## Test the Bot

Try these messages:

- **"Qu'est-ce que HealthLink?"** - What is HealthLink?
- **"Comment commander?"** - How to order?
- **"Tarifs"** - Pricing
- **"Comment créer un compte?"** - How to create account?
- **"go"** - Full introduction

## What's Running?

1. **Semantic Server** (`semantic_server.py`)
   - Runs continuously on port 8000
   - Pre-loads all Q/A pairs and vectors
   - Responds to HTTP requests in < 50ms

2. **WhatsApp Bot** (`main.js`)
   - Connects to WhatsApp Web
   - Handles messages and calls semantic server
   - Sends intelligent responses

## Performance

- ⚡ **Fast**: < 50ms per query
- 📈 **Scalable**: Handles many concurrent requests
- 💾 **Efficient**: Pre-loaded vectors, no repeated loading
- 🔄 **Persistent**: Python server runs continuously

## Troubleshooting

### "Port 8000 already in use"
Change the port in `semantic_server.py` and `main.js`:
```python
# semantic_server.py
run_server(8001)  # Different port

# main.js
port: 8001  # Same port
```

### "Can't connect to semantic server"
Make sure the Python server is running first:
```bash
python semantic_server.py 8000
```

You should see:
```
✅ Loaded 32 Q/A pairs
🚀 Server ready!
🌐 Semantic Search Server running on http://127.0.0.1:8000
```

### Python command not found
Use `python3` instead:
```bash
python3 semantic_server.py 8000
```

## Next Steps

- Read `UPDATE_QA.md` to add more Q/A pairs
- Read `PERFORMANCE.md` for optimization details
- Read `README.md` for full documentation

Happy botting! 🤖

