// app.js - FINAL WORKING VERSION
const express = require('express');
const crypto = require('crypto');
const app = express();
const port = process.env.PORT || 3000;

// EXACT KEY & IV FROM YOUR PYTHON CODE
const ENCRYPTION_KEY = Buffer.from('0123456789abcdef0123456789abcdef', 'hex'); // 16 bytes
const IV = Buffer.from('abcdef9876543210'); // 16 bytes

// DECRYPT FUNCTION - HANDLES PADDING CORRECTLY
function decrypt(encryptedBase64) {
  try {
    const cipherText = Buffer.from(encryptedBase64, 'base64');

    // Check if length is multiple of 16
    if (cipherText.length % 16 !== 0) {
      throw new Error('Invalid ciphertext length');
    }

    const decipher = crypto.createDecipheriv('aes-128-cbc', ENCRYPTION_KEY, IV);
    
    // Disable auto padding removal temporarily
    decipher.setAutoPadding(false);

    let decrypted = decipher.update(cipherText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    // Manual PKCS7 unpadding
    const padLen = decrypted[decrypted.length - 1];
    if (padLen < 1 || padLen > 16) {
      throw new Error('Invalid padding');
    }
    decrypted = decrypted.slice(0, -padLen);

    return decrypted.toString('utf8');
  } catch (err) {
    throw new Error('Decryption failed: ' + err.message);
  }
}

// ENCRYPT FUNCTION (for generating new links)
function encrypt(jsonObj) {
  const text = JSON.stringify(jsonObj);
  const cipher = crypto.createCipheriv('aes-128-cbc', ENCRYPTION_KEY, IV);
  let encrypted = cipher.update(text, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  // Add PKCS7 padding manually
  const padLen = 16 - (encrypted.length % 16);
  const padding = Buffer.alloc(padLen, padLen);
  encrypted = Buffer.concat([encrypted, padding]);

  return encrypted.toString('base64');
}

// /op ROUTE - MAIN DECRYPTION
app.get('/op', (req, res) => {
  const { data } = req.query;
  if (!data) return res.status(400).send('Missing data parameter');

  let decrypted;
  try {
    decrypted = decrypt(data);
  } catch (err) {
    console.error('Decrypt error:', err.message);
    return res.status(400).send(`<h3>Invalid or corrupted link</h3><p>${err.message}</p>`);
  }

  let payload;
  try {
    payload = JSON.parse(decrypted);
  } catch {
    return res.status(400).send('Decrypted data is not valid JSON');
  }

  // EXTRACT FIELDS
  const {
    class_name = 'Unknown',
    teacher_name = 'Unknown',
    thumbnail = 'https://via.placeholder.com/100',
    class_url = '',
    slides_url = '',
    is_offline = false,
    live_at_time = '',
    user_first_name = 'Guest',
    user_id = 'N/A',
    made_at = new Date().toISOString()
  } = payload;

  // FORMAT DATE
  let formattedDate = 'N/A';
  try {
    const d = new Date(live_at_time.replace(/\+00:00$/, 'Z'));
    if (!isNaN(d)) {
      formattedDate = `${d.getDate()}-${d.toLocaleString('en', { month: 'long' })}-${d.getFullYear()}`;
    }
  } catch {}

  // EXPIRY LOGIC
  let isExpired = true;
  let timeLeft = 'Expired';
  try {
    const made = new Date(made_at.replace(/\+00:00$/, 'Z'));
    const expiry = new Date(made.getTime() + 24 * 3600 * 1000);
    const now = new Date();
    if (now < expiry) {
      isExpired = false;
      const diff = expiry - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      timeLeft = `${h}h ${m}m ${s}s`;
    }
  } catch {}

  if (isExpired) {
    return res.send(`
      <div style="font-family:Arial;text-align:center;padding:50px;background:#ffebee;color:#c62828;">
        <h1>Link Expired</h1>
        <p>Please generate a new link from the app.</p>
        <button onclick="location.href='https://studyuk.fun'" style="padding:12px 24px;background:#ff4081;color:white;border:none;border-radius:30px;cursor:pointer;">
          Go to Website
        </button>
      </div>
    `);
  }

  const lectureUrl = is_offline
    ? `https://studyuk.fun/sdv.html?url=${encodeURIComponent(class_url)}&title=${encodeURIComponent(class_name)}`
    : `https://studyuk.fun/umplayer.html?playurl=${encodeURIComponent(class_url)}&pdf=${encodeURIComponent(slides_url)}`;

  // FINAL HTML
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${class_name}</title>
  <style>
    body {font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin:0; padding:20px; color:white; min-height:100vh; display:flex; flex-direction:column; align-items:center;}
    .card {background:rgba(255,255,255,0.1); backdrop-filter:blur(10px); border-radius:20px; padding:20px; width:90%; max-width:400px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.3); margin:10px 0;}
    img {width:90px; height:90px; border-radius:50%; border:4px solid white; margin-bottom:15px;}
    .btn {display:block; margin:10px auto; padding:12px 20px; background:#ff4081; color:white; border:none; border-radius:30px; font-weight:bold; cursor:pointer; width:80%; text-decoration:none;}
    .btn:hover {background:#f50057; transform:scale(1.05); transition:0.3s;}
    .countdown {background:#ffca28; color:#1a237e; padding:8px 16px; border-radius:20px; font-weight:bold; display:inline-block; margin:10px 0;}
    .label {margin:8px 0; font-size:1.1em;}
  </style>
</head>
<body>
  <div class="card">
    <div class="label">Name: ${user_first_name}</div>
    <div class="label">ID: ${user_id}</div>
    <div class="countdown" id="timer">Expires in: ${timeLeft}</div>
  </div>
  <div class="card">
    <img src="${thumbnail}" alt="Teacher">
    <div class="label">Teacher: ${teacher_name}</div>
    <div class="label">Class: ${class_name}</div>
    <div class="label">Date: ${formattedDate} ${is_offline ? '(Offline)' : ''}</div>
    <a href="${class_url}" class="btn">Download Class</a>
    <a href="${slides_url}" class="btn">Download Slides</a>
    <a href="${lectureUrl}" class="btn">Watch Lecture</a>
  </div>
  <script>
    const expiry = new Date('${made_at.replace(/\+00:00$/, 'Z')}').getTime() + 24*60*60*1000;
    setInterval(() => {
      const diff = expiry - Date.now();
      if (diff <= 0) return location.reload();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      document.getElementById('timer').textContent = 'Expires in: ' + h + 'h ' + m + 'm ' + s + 's';
    }, 1000);
  </script>
</body>
</html>
  `);
});

// /encrypt - GENERATE NEW LINK
app.get('/encrypt', (req, res) => {
  const sample = {
    "class_name": "Magnetic Forces & Moving Charges",
    "teacher_name": "Aditya Kumar Jha",
    "live_at": "2025-08-23T15:30:00Z",
    "thumbnail": "https://edge.uacdn.net/static/thumbnail/user/5704fa4cd18943cbbe9290533f9d55f4.jpg?q=100&w=512",
    "class_url": "https://uamedia.uacdn.net/lesson-raw/763ASPDMEFJXRE2KPYZN/output.webm",
    "slides_url": "https://player.uacdn.net/slides_pdf/763ASPDMEFJXRE2KPYZN/Magnetic_Forces__Moving_Charges_with_anno.pdf",
    "is_offline": false,
    "live_at_time": "2025-08-23T15:30:00+00:00",
    "user_first_name": "HACKHET 😈",
    "user_id": 5748674252,
    "made_at": new Date().toISOString()
  };

  const encrypted = encrypt(sample);
  const url = `https://dekhosekdop.onrender.com/op?data=${encrypted}`;
  
  res.send(`
    <h2>Encrypted Link Ready!</h2>
    <p><a href="${url}" target="_blank">${url}</a></p>
    <details><summary>View Encrypted Data</summary><pre>${encrypted}</pre></details>
  `);
});

app.get('/', (req, res) => {
  res.send(`
    <h2>Dekho Sekd Link Opener</h2>
    <p><a href="/encrypt">Generate New Link</a></p>
    <p>Paste your <code>?data=...</code> URL in browser</p>
  `);
});

app.listen(port, () => {
  console.log(`Server LIVE: https://dekhosekdop.onrender.com`);
});
