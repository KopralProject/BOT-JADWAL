const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const axios = require('axios');
const moment = require('moment-timezone');

// Inisialisasi client dengan LocalAuth agar sesi tersimpan
const client = new Client({
    authStrategy: new LocalAuth()
});

// Tampilkan QR code di terminal saat login
client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
    console.log('Scan QR code di atas dengan WhatsApp kamu');
});

client.on('ready', () => {
    console.log('WhatsApp Bot siap!');
});

// Fungsi ambil jadwal sholat dari API
async function getPrayerTimes(city) {
    try {
        // API jadwal sholat dari https://api.pray.zone
        const response = await axios.get(`https://api.pray.zone/v2/times/today.json?city=${city}`);
        if(response.data.code === 200) {
            const times = response.data.results.datetime[0].times;
            return times;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error ambil jadwal:', error);
        return null;
    }
}

// Event ketika menerima pesan
client.on('message', async msg => {
    const chat = await msg.getChat();

    // Jika pesan dimulai dengan "!shalat" diikuti nama kota
    if(msg.body.toLowerCase().startsWith('!shalat')) {
        const parts = msg.body.split(' ');
        if(parts.length < 2) {
            msg.reply('Kirim perintah dengan format:\n!shalat nama_kota\nContoh: !shalat jakarta');
            return;
        }
        const city = parts.slice(1).join(' ');
        msg.reply(`Mohon tunggu, sedang mencari jadwal sholat untuk kota *${city}*...`);

        const times = await getPrayerTimes(city);
        if(times) {
            // Format jadwal sholat
            let reply = `Jadwal Sholat untuk kota *${city}* hari ini:\n`;
            reply += `Imsak: ${times.Imsak}\n`;
            reply += `Subuh: ${times.Fajr}\n`;
            reply += `Terbit: ${times.Sunrise}\n`;
            reply += `Dzuhur: ${times.Dhuhr}\n`;
            reply += `Ashar: ${times.Asr}\n`;
            reply += `Maghrib: ${times.Maghrib}\n`;
            reply += `Isya: ${times.Isha}\n`;
            msg.reply(reply);
        } else {
            msg.reply('Maaf, jadwal sholat tidak ditemukan untuk kota tersebut.');
        }
    }
});

client.initialize();
