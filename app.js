// app.js
const express = require('express');
const crypto = require('crypto');
const app = express();
const port = process.env.PORT || 3000;

// === CORRECT KEY & IV (same as Python) ===
const ENCRYPTION_KEY = Buffer.from('0123456789abcdef0123456789abcdef', 'hex'); // 16 bytes → AES-128
const FIXED_IV = Buffer.from('abcdef9876543210'); // 16 bytes, fixed IV

// === ENCRYPT FUNCTION (for testing) ===
function encrypt(text) {
  const cipher = crypto.createCipheriv('aes-128-cbc', ENCRYPTION_KEY, FIXED_IV);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted; // Only base64 ciphertext (no IV)
}

// === DECRYPT FUNCTION (main logic) ===
function decrypt(encryptedBase64) {
  const decipher = crypto.createDecipheriv('aes-128-cbc', ENCRYPTION_KEY, FIXED_IV);
  let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// === /encrypt route (for generating new links) ===
app.get('/encrypt', (req, res) => {
  const sampleData = {
    "class_name": "Magnetic Forces & Moving Charges",
    "teacher_name": "Aditya Kumar Jha",
    "live_at": "2025-08-23T15:30:00Z",
    "thumbnail": "https://edge.uacdn.net/static/thumbnail/user/5704fa4cd18943cbbe9290533f9d55f4.jpg?q=100&w=512",
    "class_url": "https://uamedia.uacdn.net/lesson-raw/763ASPDMEFJXRE2KPYZN/output.webm",
    "slides_url": "https://player.uacdn.net/slides_pdf/763ASPDMEFJXRE2KPYZN/Magnetic_Forces__Moving_Charges_with_anno.pdf",
    "is_offline": false,
    "live_at_time": "2025-08-23T15:30:00+00:00",
    "user_first_name": "\ud835\udddb\ud835\uddd4\ud835\uddd6\ud835\uddde\ud835\uddd8\ud835\udddc\ud835\udde6\ud835\udde7 \ud83d\ude08",
    "user_id": 5748674252,
    "made_at": "2025-10-25T05:20:25+00:00"
  };

  const jsonString = JSON.stringify(sampleData);
  const encrypted = encrypt(jsonString);
  const demoUrl = `https://dekhosekd.onrender.com/op?data=${encodeURIComponent(encrypted)}`;
  
  res.send(`
    <h2>Encrypted URL Ready!</h2>
    <p><a href="${demoUrl}" target="_blank">${demoUrl}</a></p>
    <pre>Encrypted Data: ${encrypted}</pre>
  `);
});

// === MAIN /op ROUTE (decrypt & show page) ===
app.get('/op', (req, res) => {
  try {
    const { data } = req.query;
    if (!data) return res.status(400).send('Missing encrypted data');

    // Decrypt
    let decryptedJson;
    try {
      decryptedJson = decrypt(data);
    } catch (err) {
      console.error("Decryption failed:", err);
      return res.status(400).send('Invalid or corrupted encrypted data');
    }

    let parsed;
    try {
      parsed = JSON.parse(decryptedJson);
    } catch (err) {
      return res.status(400).send('Decrypted data is not valid JSON');
    }

    const {
      class_name = 'Unknown Class',
      teacher_name = 'Unknown Teacher',
      thumbnail = '',
      class_url = '',
      slides_url = '',
      is_offline = false,
      live_at_time = '',
      user_first_name = 'Guest',
      user_id = 'N/A',
      made_at = ''
    } = parsed;

    // === Date Formatting ===
    let formattedDate = live_at_time;
    try {
      const date = new Date(live_at_time.replace(/\+00:00$/, 'Z'));
      if (!isNaN(date)) {
        const day = date.getDate();
        const month = date.toLocaleString('en-US', { month: 'long' });
        const year = date.getFullYear();
        formattedDate = `${day}-${month}-${year}`;
      }
    } catch { /* ignore */ }

    // === Expiry Check ===
    let isExpired = true;
    let timeLeft = '';
    try {
      const madeAtDate = new Date(made_at.replace(/\+00:00$/, 'Z'));
      const currentDate = new Date();
      const expiryDate = new Date(madeAtDate.getTime() + 24 * 60 * 60 * 1000);

      if (!isNaN(madeAtDate) && currentDate <= expiryDate) {
        isExpired = false;
        const diff = expiryDate - currentDate;
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        timeLeft = `${h}h ${m}m ${s}s`;
      }
    } catch { /* ignore */ }

    // === If Expired ===
    if (isExpired) {
      return res.send(`
        <!DOCTYPE html>
        <html><head><meta charset="UTF-8"><title>Expired</title>
        <style>body{font-family:Arial;background:#b71c1c;color:white;text-align:center;padding:50px;}
        h1{font-size:2em;} button{padding:15px 30px;margin:20px;background:#ffca28;color:#1a237e;border:none;border-radius:30px;font-weight:bold;cursor:pointer;}
        </style></head>
        <body><h1>Link Expired!</h1><p>Please generate a new link.</p>
        <button onclick="location.href='https://studyuk.fun'">Go to Website</button>
        </body></html>
      `);
    }

    // === Lecture URL ===
    const lectureUrl = is_offline
      ? `https://studyuk.fun/sdv.html?url=${encodeURIComponent(class_url)}&title=${encodeURIComponent(class_name)}`
      : `http://studyuk.fun/umplayer.html?playurl=${encodeURIComponent(class_url)}&pdf=${encodeURIComponent(slides_url)}`;

    // === Final HTML ===
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>${class_name}</title>
        <style>
          body {font-family: 'Helvetica', sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(45deg, #1a237e, #303f9f); color: #fff; overflow: hidden;}
          .box {background: rgba(255,255,255,0.2); padding: 25px; border-radius: 20px; box-shadow: 0 15px 30px rgba(0,0,0,0.4); max-width: 380px; width: 95%; text-align: center; backdrop-filter: blur(8px); border: 2px solid rgba(255,255,255,0.5);}
          img {width: 100px; height: 100px; border-radius: 50%; border: 4px solid white; margin-bottom: 15px;}
          .label {font-weight: bold; margin: 8px 0; font-size: 1.1em;}
          .countdown {background: #ffca28; color: #1a237e; padding: 8px 15px; border-radius: 15px; font-weight: bold; display: inline-block; margin: 10px 0;}
          button {padding: 12px 20px; margin: 6px; background: #ff4081; color: white; border: none; border-radius: 30px; cursor: pointer; font-weight: bold;}
          button:hover {background: #f50057; transform: scale(1.05);}
        </style>
      </head>
      <body>
        <div class="box" style="margin-bottom: 20px;">
          <div class="label">Name: ${user_first_name}</div>
          <div class="label">ID: ${user_id}</div>
          <div class="countdown" id="countdown">Expires in: ${timeLeft}</div>
        </div>
        <div class="box">
          <img src="${thumbnail}" alt="Teacher">
          <div class="label">Teacher: ${teacher_name}</div>
          <div class="label">Class: ${class_name}</div>
          <div class="label">Date: ${formattedDate} ${is_offline ? '(Offline)' : ''}</div>
          <button onclick="window.location.href='${class_url}'">Download Class</button>
          <button onclick="window.location.href='${slides_url}'">Download Slides</button>
          <button onclick="window.location.href='${lectureUrl}'">Watch Lecture</button>
        </div>
        <script>
          const expiry = new Date('${made_at.replace(/\+00:00$/, 'Z')}').getTime() + 24*60*60*1000;
          setInterval(() => {
            const diff = expiry - Date.now();
            if (diff <= 0) return location.reload();
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            document.getElementById('countdown').textContent = 'Expires in: ' + h + 'h ' + m + 'm ' + s + 's';
          }, 1000);
        </script>
      </body>
      </html>
    `;

    res.send(html);

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).send('Server Error: ' + error.message);
  }
});

// Home
app.get('/', (req, res) => {
  res.send('Use /encrypt to generate link | /op?data=... to open');
});

app.listen(port, () => {
  console.log(`Server running on https://dekhosekd.onrender.com`);
  console.log(`Generate link: https://dekhosekd.onrender.com/encrypt`);
});
