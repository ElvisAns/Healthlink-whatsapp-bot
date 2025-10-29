const express = require('express');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Production logging
const logLevel = process.env.LOG_LEVEL || 'info';
const isProduction = process.env.NODE_ENV === 'production';

function log(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (level === 'error') {
        console.error(logMessage, ...args);
    } else if (level === 'warn') {
        console.warn(logMessage, ...args);
    } else if (level === 'info' || level === 'debug') {
        console.log(logMessage, ...args);
    }
}

const app = express();
app.use(express.json());

// --- WhatsApp Client ---
const client = new Client({
    authStrategy: new LocalAuth()
});

// --- Processing state ---
const processing = new Map(); // { from: true/false }

// Helper function to call semantic search server
async function semanticSearch(query) {
    return new Promise((resolve) => {
        const encodedQuery = encodeURIComponent(query);
        const options = {
            hostname: process.env.SEMANTIC_SERVER_HOST || '127.0.0.1',
            port: process.env.SEMANTIC_SERVER_PORT || 8000,
            path: `/?q=${encodedQuery}`,
            method: 'GET',
            timeout: 2000 // 2 second timeout
        };

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk.toString();
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve(result.answer || null);
                } catch (e) {
                    log('error', 'Failed to parse semantic search response:', e.message);
                    resolve(null);
                }
            });
        });

        req.on('error', (e) => {
            log('error', 'Semantic search server error:', e.message);
            resolve(null);
        });

        req.on('timeout', () => {
            log('warn', 'Semantic search server timeout');
            req.destroy();
            resolve(null);
        });

        req.end();
    });
}

// Helper function to simulate typing
async function simulateTypingAndSend(client, chatId, message, mediaFiles = []) {
    await new Promise(r => setTimeout(r, 3000));

    // Send media then text
    for (const media of mediaFiles) {
        await client.sendMessage(chatId, media);
    }

    await client.sendMessage(chatId, message);
}

// --- QR + Ready handlers ---
client.on('qr', qr => {
    log('info', 'QR code generated - scan with WhatsApp');
    if (!isProduction) {
        qrcode.generate(qr, { small: true });
    }
});
client.once('ready', () => log('info', 'WhatsApp Client is ready!'));
client.on('disconnected', reason => log('warn', 'WhatsApp disconnected:', reason));
client.on('auth_failure', msg => log('error', 'WhatsApp auth failure:', msg));

// --- Message handling ---
client.on('message', async message => {
    const { body, from } = message;

    log('debug', 'Received message from:', from);

    if(from.includes("243892615790" || from.includes("243831218743"))) return;
    if (from.includes('broadcast') || from.includes('status') || from.includes('group') || from.includes('channel') || from.includes('newsletter') || from.length !== 17) return;
    
    if (processing.get(from)) {
        log('debug', `Ignored message from ${from}: already processing`);
        return;
    }

    processing.set(from, true); // mark as processing

    try {
        const text = body.toLowerCase();
        let finalMessage = '';
        let salutation = 'Bonjour';

        if (text.includes('salut')) salutation = 'Salut!';
        if (text.includes('bonsoir')) salutation = 'Bonsoir!';
        if (text.includes('midi')) salutation = 'Bon après midi!';

        // Check if user is asking a question (more than just greetings or "go")
        const isQuestion = text !== 'go' && text !== 'go!' && 
                          !text.match(/^(salut|bonjour|bonsoir|hi|hello|bonne soirée|bonne journée)$/i);
        
        let mediaFiles = [];
        
        if (isQuestion) {
            // Try to get intelligent response from semantic search
            const semanticAnswer = await semanticSearch(body);
            
            if (semanticAnswer) {
                finalMessage = `${salutation}\n\n${semanticAnswer}`;
                // No media for natural Q&A responses
            } else {
                // Fallback to default message
                finalMessage = `${salutation}
Je suis Linky Bot de HealthLink (F Link)
Merci pour votre message.
Je peux vous aider à comprendre ce qu'est HealthLink et comment l'utiliser.

HealthLink est votre carnet médical numérique qui vous suit partout via un bracelet ou une carte.
Vos informations médicales (allergies, groupe sanguin, médicaments, etc.) sont accessibles en urgence grâce à un QR code.

Tout commence par la création de votre compte sur https://gethealth.link/register
Vous pouvez commander votre bracelet/carte en écrivant sur https://wa.me/243892615790

Votre sécurité est notre priorité.`;
                // No media for fallback responses either
            }
        } else if (text === 'go' || text === 'go!') {
            finalMessage = `Super!
Je suis Linky Bot de HealthLink (F Link).

C'est quoi HealthLink? Une solution pour vous aider à reprendre contrôle sur votre santé.
Savourez une tranquillité d'esprit hors du commun sachant que même lorsque vous êtes inconscients, votre carte ou votre bracelet peut parler pour vous.

Tout commence par la création de votre compte sur la plateforme https://gethealth.link/register, puis vous complétez vos informations de santé et enfin vous liez votre profil avec votre support HealthLink.

Vous pouvez commander votre bracelet/carte en nous écrivant sur https://wa.me/243892615790

Votre sécurité est notre priorité.`;
            // Send media for "go" command
            const media1 = MessageMedia.fromFilePath('images/product_grid.jpg');
            const media2 = MessageMedia.fromFilePath('images/product-poster-min-fr.jpg');
            mediaFiles = [media2, media1];
        } else if((text.includes('Merci') || text.includes('Merci beaucoup') || text.includes('Merci beaucoup!')) && text.length < 20) { // if the message is less than 20 characters and includes "Merci", it is a thank you message
            finalMessage = `De rien! N'hésitez pas à me contacter si vous avez d'autres questions.`;
        } else {
            // Just greetings
            finalMessage = `${salutation}
Je suis Linky Bot de HealthLink (F Link).

Posez-moi une question sur HealthLink et je vous renseignerai!
Vous pouvez me demander:
- Qu'est-ce que HealthLink? https://wa.me/243831218743?text=${encodeURIComponent('Qu\'est-ce que HealthLink?')}
- Comment commander? https://wa.me/243831218743?text=${encodeURIComponent('Comment commander?')}
- Comment créer un compte? https://wa.me/243831218743?text=${encodeURIComponent('Comment créer un compte?')}
- Fonctionnalités https://wa.me/243831218743?text=${encodeURIComponent('Fonctionnalités')}
- Tarifs https://wa.me/243831218743?text=${encodeURIComponent('Tarifs')}
- Comment créer un compte? https://wa.me/243831218743?text=${encodeURIComponent('Comment créer un compte?')}
- etc.

Tapez "go" pour une présentation complète.`;
            // Send media for greetings
            const media1 = MessageMedia.fromFilePath('images/product_grid.jpg');
            const media2 = MessageMedia.fromFilePath('images/product-poster-min-fr.jpg');
            mediaFiles = [media2, media1];
        }
        // send lead to MAKE webhook
        const headers = {
            'x-make-apikey': process.env.MAKE_API_KEY,
            'Content-Type': 'application/json',
          };
          const make_request_body = JSON.stringify({
            from: from,
            message: text,
            response: finalMessage
          });
          const res = await fetch(process.env.MAKE_WEBHOOK_URL, {
            method: 'POST',
            headers: headers,
            body: make_request_body
          });
          console.log(res.status, res.body);

        await simulateTypingAndSend(client, from, finalMessage, mediaFiles);
        log('info', `Message sent to ${from}: ${body.substring(0, 50)}...`);

    } catch (error) {
        log('error', 'Error processing message:', error.message);
    } finally {
        processing.delete(from); // release the lock
    }
});

// --- Internal Express API ---
app.post('/send', async (req, res) => {
    const { to, message, token } = req.body;

    if (process.env.WHATSAPP_SECRET && token !== process.env.WHATSAPP_SECRET)
        return res.status(403).json({ error: 'Forbidden: Invalid token' });

    try {
        await client.sendMessage(`${to}@c.us`, message);
        log('info', `Message sent via API to ${to}: ${message.substring(0, 50)}...`);
        res.json({ success: true });
    } catch (err) {
        log('error', 'Send failed:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// --- Start Express server ---
const PORT = process.env.WHATSAPP_API_PORT || 1520;
const HOST = process.env.WHATSAPP_API_HOST || '127.0.0.1';
app.listen(PORT, HOST, () => {
    log('info', `Internal WhatsApp API listening on http://${HOST}:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    log('info', 'Received SIGINT, shutting down gracefully...');
    client.destroy().then(() => {
        log('info', 'WhatsApp client destroyed');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    log('info', 'Received SIGTERM, shutting down gracefully...');
    client.destroy().then(() => {
        log('info', 'WhatsApp client destroyed');
        process.exit(0);
    });
});

client.initialize();
