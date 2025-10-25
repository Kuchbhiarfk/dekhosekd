// app.js - 100% WORKING WITH YOUR EXACT DATA
const express = require('express');
const crypto = require('crypto');
const app = express();
const port = process.env.PORT || 3000;

// KEY & IV (EXACT SAME AS PYTHON)
const KEY = Buffer.from('0123456789abcdef0123456789abcdef', 'hex'); // 16 bytes
const IV = Buffer.from('abcdef9876543210'); // 16 bytes

// URL-SAFE BASE64 FIX
function fixBase64(str) {
  return str
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .replace(/ /g, '+')  // spaces from URL
    .trim();
}

// PAD BASE64 TO MULTIPLE OF 4
function padBase64(str) {
  const missing = (4 - (str.length % 4)) % 4;
  return str + '='.repeat(missing);
}

// DECRYPT WITH FULL ERROR HANDLING
function decrypt(encrypted) {
  try {
    let b64 = fixBase64(encrypted);
    b64 = padBase64(b64);
    
    const cipherBuf = Buffer.from(b64, 'base64');
    console.log(`Ciphertext length: ${cipherBuf.length}`);

    if (cipherBuf.length % 16 !== 0) {
      throw new Error(`Ciphertext length ${cipherBuf.length} is not multiple of 16`);
    }

    const decipher = crypto.createDecipheriv('aes-128-cbc', KEY, IV);
    decipher.setAutoPadding(false);

    let decrypted = decipher.update(cipherBuf);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    // Manual PKCS7 unpad
    const pad = decrypted[decrypted.length - 1];
    if (pad < 1 || pad > 16) throw new Error('Invalid padding');
    decrypted = decrypted.slice(0, -pad);

    return decrypted.toString('utf8');
  } catch (err) {
    throw new Error('Decryption failed: ' + err.message);
  }
}

// ENCRYPT (for /encrypt)
function encrypt(obj) {
  const text = JSON.stringify(obj);
  const cipher = crypto.createCipheriv('aes-128-cbc', KEY, IV);
  let enc = cipher.update(text, 'utf8');
  enc = Buffer.concat([enc, cipher.final()]);

  const p = 16 - (enc.length % 16);
  const pad = Buffer.alloc(p, p);
  enc = Buffer.concat([enc, pad]);

  return enc.toString('base64');
}

// /op ROUTE
app.get('/op', (req, res) => {
  const { data } = req.query;
  if (!data) return res.status(400).send('Missing data');

  let decrypted;
  try {
    decrypted = decrypt(data);
  } catch (err) {
    console.error('Decrypt failed:', err.message);
    return res.send(`
      <div style="text-align:center;padding:50px;font-family:Arial;background:#ffebee;color:#c62828;">
        <h2>Invalid Link</h2>
        <p>${err.message}</p>
        <button onclick="history.back()" style="padding:10px 20px;background:#ff4081;color:white;border:none;border-radius:30px;cursor:pointer;">
          Go Back
        </button>
      </div>
    `);
  }

  let payload;
  try {
    payload = JSON.parse(decrypted);
  } catch {
    return res.send('Invalid JSON');
  }

  const {
    class_name = 'Class',
    teacher_name = 'Teacher',
    thumbnail = 'https://via.placeholder.com/100',
    class_url = '',
    slides_url = '',
    is_offline = false,
    live_at_time = '',
    user_first_name = 'User',
    user_id = 'N/A',
    made_at = new Date().toISOString()
  } = payload;

  // Date
  let dateStr = 'N/A';
  try {
    const d = new Date(live_at_time);
    if (!isNaN(d)) {
      dateStr = `${d.getDate()}-${d.toLocaleString('en', { month: 'long' })}-${d.getFullYear()}`;
    }
  } catch {}

  // Expiry
  let expired = true;
  let timeLeft = 'Expired';
  try {
    const made = new Date(made_at);
    const expiry = new Date(made.getTime() + 24 * 3600 * 1000);
    const now = new Date();
    if (now < expiry) {
      expired = false;
      const diff = expiry - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      timeLeft = `${h}h ${m}m ${s}s`;
    }
  } catch {}

  if (expired) {
    return res.send(`
      <!DOCTYPE html><html><head><meta charset="UTF-8"><title>Expired</title>
      <style>body{font-family:Arial;background:#b71c1c;color:white;text-align:center;padding:50px;}
      h1{font-size:2em;} button{padding:15px 30px;background:#ffca28;color:#1a237e;border:none;border-radius:30px;font-weight:bold;cursor:pointer;}</style>
      </head><body><h1>Link Expired!</h1><p>Please generate a new link.</p>
      <button onclick="location.href='https://studyuk.fun'">Go to Website</button></body></html>
    `);
  }

  const watchUrl = is_offline
    ? `https://studyuk.fun/sdv.html?url=${encodeURIComponent(class_url)}&title=${encodeURIComponent(class_name)}`
    : `https://studyuk.fun/umplayer.html?playurl=${encodeURIComponent(class_url)}&pdf=${encodeURIComponent(slides_url)}`;

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${class_name}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Segoe UI',sans-serif;background:linear-gradient(135deg,#1e3c72,#2a5298);color:#fff;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:20px}
    .card{background:rgba(255,255,255,0.15);backdrop-filter:blur(12px);border-radius:20px;padding:20px;width:90%;max-width:420px;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,0.3);margin:15px 0;border:1px solid rgba(255,255,255,0.2)}
    .user-card{background:rgba(74,20,140,0.6)}
    img{width:90px;height:90px;border-radius:50%;border:4px solid #fff;margin-bottom:15px;box-shadow:0 5px 15px rgba(0,0,0,0.3)}
    .label{margin:8px 0;font-size:1.1em;font-weight:600}
    .countdown{background:#ffb300;color:#1a237e;padding:8px 16px;border-radius:20px;font-weight:bold;display:inline-block;margin:10px 0;font-size:1em}
    .btn{display:block;width:85%;margin:12px auto;padding:14px;background:linear-gradient(135deg,#ff4081,#f50057);color:white;border:none;border-radius:30px;font-weight:bold;font-size:1em;cursor:pointer;text-decoration:none;transition:0.3s;box-shadow:0 5px 15px rgba(0,0,0,0.3)}
    .btn:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(0,0,0,0.4);background:linear-gradient(135deg,#f50057,#ff4081)}
    .offline{color:#ffca28;font-weight:bold}
    @media(max-width:480px){.card{padding:15px}.btn{font-size:0.95em}}
  </style>
</head>
<body>
  <div class="card user-card">
    <div class="label">Name: ${user_first_name}</div>
    <div class="label">ID: ${user_id}</div>
    <div class="countdown" id="timer">Expires in: ${timeLeft}</div>
  </div>
  <div class="card">
    <img src="${thumbnail}" alt="Teacher" onerror="this.src='https://via.placeholder.com/100'">
    <div class="label">Teacher: ${teacher_name}</div>
    <div class="label">Class: ${class_name}</div>
    <div class="label">Date: ${dateStr} ${is_offline ? '<span class="offline">(Offline)</span>' : ''}</div>
    <a href="${class_url}" class="btn" target="_blank">Download Class Video</a>
    <a href="${slides_url}" class="btn" target="_blank">Download Slides (PDF)</a>
    <a href="${watchUrl}" class="btn" target="_blank">Watch Lecture Now</a>
  </div>
  <script>
    const expiry = new Date('${made_at}').getTime() + 24*60*60*1000;
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

// /encrypt
app.get('/encrypt', (req, res) => {
  const data = {
    "class_name": "Magnetic Forces & Moving Charges",
    "teacher_name": "Aditya Kumar Jha",
    "live_at": "2025-08-23T15:30:00Z",
    "thumbnail": "https://edge.uacdn.net/static/thumbnail/user/5704fa4cd18943cbbe9290533f9d55f4.jpg?q=100&w=512",
    "class_url": "https://uamedia.uacdn.net/lesson-raw/763ASPDMEFJXRE2KPYZN/output.webm",
    "slides_url": "https://player.uacdn.net/slides_pdf/763ASPDMEFJXRE2KPYZN/Magnetic_Forces__Moving_Charges_with_anno.pdf",
    "is_offline": false,
    "live_at_time": "2025-08-23T15:30:00+00:00",
    "user_first_name": "HACKHET",
    "user_id": 5748674252,
    "made_at": new Date().toISOString()
  };

  const encrypted = encrypt(data);
  const url = `https://dekhosekdop.onrender.com/op?data=${encrypted}`;

  res.send(`
    <h2>Link Generated!</h2>
    <p><a href="${url}" target="_blank">${url}</a></p>
    <pre>${encrypted}</pre>
  `);
});

app.get('/', (req, res) => {
  res.send('<h2>Dekho Sekd Opener</h2><p><a href="/encrypt">Generate Link</a></p>');
});

app.listen(port, () => {
  console.log('LIVE: https://dekhosekdop.onrender.com');
});
