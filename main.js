const express = require('express');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
require('dotenv').config();

const app = express();
app.use(express.json());

// --- WhatsApp Client ---
const client = new Client({
    authStrategy: new LocalAuth()
});

// --- Processing state ---
const processing = new Map(); // { from: true/false }

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
client.on('qr', qr => qrcode.generate(qr, { small: true }));
client.once('ready', () => console.log('✅ WhatsApp Client is ready!'));
client.on('disconnected', reason => console.log('❌ Disconnected:', reason));
client.on('auth_failure', msg => console.error('⚠️ Auth failure:', msg));

// --- Message handling ---
client.on('message', async message => {
    const { body, from } = message;

    if (from.includes('broadcast') || from.includes('status') || from.includes('group') || from.includes('channel') || from.includes('newsletter') || form.length > 12) return;
    if (processing.get(from)) {
        console.log(`⚙️ Ignored message from ${from}: already processing.`);
        return;
    }

    processing.set(from, true); // mark as processing

    try {
        const text = body.toLowerCase();
        let finalMessage = '';
        let salutation = 'Bonjour!';

        if (text.includes('salut')) salutation = 'Salut!';
        if (text.includes('bonsoir')) salutation = 'Bonsoir!';
        if (text.includes('midi')) salutation = 'Bon après midi!';

        if (text !== 'go' && text !== 'go!') {
            finalMessage = `${salutation}
Je suis Linky Bot de HealthLink (F Link)
Merci pour votre message.
A présent je ne peux pas répondre à des messages personnalisés mais je peux vous orienter sur comment utiliser HealthLink.

Tout d'abord, HealthLink c'est votre carnet médical qui vous suit partout.
Nous disposons des bracelets/cartes qui vous permettent de partager vos informations médicales de base, surtout en situation d'urgence, et vous sauver la vie.

Tout commence par la création de votre compte sur la plateforme https://gethealth.link/register, puis vous complétez vos informations de santé et enfin vous liez votre profil avec votre support HealthLink.

Vous pouvez commander votre bracelet/carte en nous écrivant sur https://wa.me/243892615790

Votre sécurité est notre priorité.`;
        } else {
            finalMessage = `Super!
Je suis Linky Bot de HealthLink (F Link).

C'est quoi HealthLink? Une solution pour vous aider à reprendre contrôle sur votre santé.
Savourez une tranquillité d'esprit hors du commun sachant que même lorsque vous êtes inconscients, votre carte ou votre bracelet peut parler pour vous.

Tout commence par la création de votre compte sur la plateforme https://gethealth.link/register, puis vous complétez vos informations de santé et enfin vous liez votre profil avec votre support HealthLink.

Vous pouvez commander votre bracelet/carte en nous écrivant sur https://wa.me/243892615790

Votre sécurité est notre priorité.`;
        }

        const media1 = MessageMedia.fromFilePath('images/product_grid.jpg');
        const media2 = MessageMedia.fromFilePath('images/product-poster-min-fr.jpg');

        await simulateTypingAndSend(client, from, finalMessage, [media2, media1]);
        console.log(`📩 Message sent to ${from}:`, body);

    } catch (error) {
        console.error("❌ Error processing message:", error);
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
        console.log(`📩 Message sent via API to ${to}:`, message);
        res.json({ success: true });
    } catch (err) {
        console.error('❌ Send failed:', err);
        res.status(500).json({ error: err.message });
    }
});

// --- Start Express server ---
const PORT = process.env.WHATSAPP_API_PORT || 15852;
app.listen(PORT, '127.0.0.1', () => {
    console.log(`🚀 Internal WhatsApp API listening on http://127.0.0.1:${PORT}`);
});

client.initialize();
