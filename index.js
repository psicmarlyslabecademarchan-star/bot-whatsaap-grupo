const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

// --- SERVIDOR WEB MÍNIMO PARA RENDER ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('¡El bot moderador está activo y funcionando en la nube!');
});

app.listen(PORT, () => {
    console.log(`Servidor web escuchando en el puerto ${PORT}`);
});

// --- CONFIGURACIÓN DEL BOT DE WHATSAPP ---
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

// Generar código QR en la consola de Render
client.on('qr', (qr) => {
    console.log('--- ESCANEA ESTE CÓDIGO QR DESDE WHATSAPP ---');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('¡Conexión exitosa! El bot moderador está activo.');
});

// 1. Mensaje de Bienvenida a nuevos integrantes
client.on('group_join', async (notification) => {
    try {
        const chat = await notification.getChat();
        chat.sendMessage('¡Bienvenido/a al grupo! Por favor revisa las normas fijadas en la descripción.');
    } catch (error) {
        console.error('Error al enviar bienvenida:', error);
    }
});

// 2. Moderación de mensajes: Spam y Enlaces
client.on('message', async (msg) => {
    try {
        const chat = await msg.getChat();

        if (chat.isGroup) {
            const texto = msg.body.toLowerCase();

            // Detectar enlaces o palabras de ventas
            const contieneEnlace = texto.includes('http://') || texto.includes('https://') || texto.includes('wa.me');
            const contieneSpamVentas = texto.includes('vendo') || texto.includes('promoción') || texto.includes('oferta') || texto.includes('catálogo');

            if (contieneEnlace || contieneSpamVentas) {
                // Borrar el mensaje para todos (Requiere que el bot sea ADMIN)
                await msg.delete(true);
                chat.sendMessage('Mensaje eliminado. No se permiten enlaces ni publicaciones de ventas en este grupo.');
            }

            // Responder al comando de reglas
            if (texto === '!reglas') {
                msg.reply('Normas del grupo:\n1. Respeto mutuo.\n2. Prohibido enlaces y spam de ventas.\n3. Mantener el tema del grupo.');
            }
        }
    } catch (error) {
        console.error('Error procesando mensaje (Verifica que el bot sea Admin):', error);
    }
});

client.initialize();
