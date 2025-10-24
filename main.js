const express = require('express');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
require('dotenv').config(); // For WHATSAPP_SECRET

const app = express();
app.use(express.json());

// --- WhatsApp Client ---
const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.once('ready', () => {
    console.log('✅ WhatsApp Client is ready!');
});

client.on('disconnected', reason => console.log('❌ Disconnected:', reason));
client.on('auth_failure', msg => console.error('⚠️ Auth failure:', msg));

// --- Message handling ---
client.on('message', async message => {
    try {
        let { body, from } = message;
        body = body.toLowerCase();
        if (!from.includes('broadcast') && !from.includes('status')) {
            let final_message = '';

            // Corrected condition: send default message if not "go" or "go!"
            if (body !== 'go' && body !== 'go!') {
                let salutation = 'Bonjour!';
                if (body.indexOf('salut') !== -1) salutation = 'Salut!';
                if (body.indexOf('bonsoir') !== -1) salutation = 'Bonsoir!';
                if (body.indexOf('midi') !== -1) salutation = 'Bon après midi!';

                final_message = `${salutation}
Je suis HealthLink Bot
Merci pour votre message.
A présent je ne peux pas répondre à des messages personnalisés mais je peux vous orienter sur comment utiliser HealthLink.

Tout d'abord, HealthLink c'est votre carnet médical qui vous suit partout.
Nous disposons des bracelets/cartes qui vous permettent de partager vos informations médicales de base, surtout en situation d'urgence, et vous sauver la vie.

Tout commence par la création de votre compte sur la plateforme https://gethealth.link/register, puis vous complétez vos informations de santé et enfin vous liez votre profil avec votre support HealthLink.

Vous pouvez commander votre bracelet/carte en nous écrivant sur https://wa.me/243892615790

Votre sécurité est notre priorité.`;
            } else {
                final_message = `Super!
Bienvenu sur HealthLink.
C'est quoi HealthLink? Une solution pour vous aider à reprendre contrôle sur votre santé.
Savourez une tranquillité d'esprit hors du commun sachant que même lorsque vous êtes inconscients, votre carte ou votre bracelet peut parler pour vous.

Tout commence par la création de votre compte sur la plateforme https://gethealth.link/register, puis vous complétez vos informations de santé et enfin vous liez votre profil avec votre support HealthLink.

Vous pouvez commander votre bracelet/carte en nous écrivant sur https://wa.me/243892615790

Votre sécurité est notre priorité.`;
            }

            const media1 = MessageMedia.fromFilePath('images/product_grid.jpg');
            const media2 = MessageMedia.fromFilePath('images/product-poster-min-fr.jpg');
            await client.sendMessage(from, media2);
            await client.sendMessage(from, media1);
            await client.sendMessage(from, final_message);
            console.log(`📩 Message sent to ${from}:`, body);
        } else {
            console.log("Message skipped :-) ", from)
        }
    } catch (error) {
        console.log("Sending message has failed :-) ", error)
    }
});

// --- Internal Express API ---
app.post('/send', async (req, res) => {
    try {
        const { to, message, token } = req.body;

        // Optional security token
        if (process.env.WHATSAPP_SECRET && token !== process.env.WHATSAPP_SECRET) {
            return res.status(403).json({ error: 'Forbidden: Invalid token' });
        }

        try {
            await client.sendMessage(`${to}@c.us`, message);
            console.log(`📩 Message sent via API to ${to}:`, message);
            res.json({ success: true });
        } catch (err) {
            console.error('❌ Send failed:', err);
            res.status(500).json({ error: err.message });
        }
    }
    catch (error) {
        console.log("Send request failed to process");
        res.json({ success: false });
    }
});

// --- Start Express server (localhost only) ---
const PORT = process.env.WHATSAPP_API_PORT || 15852;
app.listen(PORT, '127.0.0.1', () => {
    console.log(`🚀 Internal WhatsApp API listening on http://127.0.0.1:${PORT}`);
});

// --- Initialize WhatsApp client ---
client.initialize();
