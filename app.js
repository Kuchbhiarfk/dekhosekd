// app.js - FULL CODE WITH AWESOME UI & POPUPS
const express = require('express');
const crypto = require('crypto');
const app = express();
const port = process.env.PORT || 3000;

// === EXACT KEY & IV (SAME AS PYTHON) ===
const KEY = Buffer.from('0123456789abcdef0123456789abcdef', 'hex');
const IV = Buffer.from('abcdef9876543210');

// === URL-SAFE BASE64 FIX + PAD TO 4 ===
function fixAndPadBase64(str) {
  let cleaned = str
    .replace(/ /g, '+')
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .trim();

  const padding = cleaned.length % 4;
  if (padding) {
    cleaned += '='.repeat(4 - padding);
  }
  return cleaned;
}

// === DECRYPT FUNCTION ===
function decrypt(encrypted) {
  try {
    const base64 = fixAndPadBase64(encrypted);
    const buffer = Buffer.from(base64, 'base64');

    console.log(`Ciphertext length: ${buffer.length} bytes`);

    if (buffer.length % 16 !== 0) {
      throw new Error(`Invalid length: ${buffer.length} (must be multiple of 16)`);
    }

    const decipher = crypto.createDecipheriv('aes-128-cbc', KEY, IV);
    decipher.setAutoPadding(false);

    let decrypted = decipher.update(buffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    const pad = decrypted[decrypted.length - 1];
    if (pad < 1 || pad > 16) throw new Error('Invalid padding');
    decrypted = decrypted.slice(0, -pad);

    return decrypted.toString('utf8');
  } catch (err) {
    throw new Error('Decryption failed: ' + err.message);
  }
}

// === ENCRYPT ===
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

// === /op ROUTE ===
app.get('/op', (req, res) => {
  const { data } = req.query;
  if (!data) return res.status(400).send('Missing data');

  let decrypted;
  try {
    decrypted = decrypt(data);
  } catch (err) {
    console.error('Error:', err.message);
    return res.send(`
      <!DOCTYPE html>
      <html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invalid Link</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Poppins',sans-serif;background:#1a1a2e;color:#eee;min-height:100vh;display:flex;align-items:center;justify-content:center}
        .error-box{background:#fff;color:#333;padding:40px;border-radius:15px;text-align:center;max-width:500px;box-shadow:0 10px 40px rgba(0,0,0,0.3)}
        .error-box h2{color:#e74c3c;margin-bottom:15px}
        .error-box p{margin:10px 0;color:#555}
        .btn{margin-top:20px;padding:12px 30px;background:#e74c3c;color:white;border:none;border-radius:8px;cursor:pointer;font-size:1em;font-weight:600;transition:0.3s}
        .btn:hover{background:#c0392b;transform:translateY(-2px)}
      </style>
      </head><body>
        <div class="error-box">
          <h2>❌ Invalid Link</h2>
          <p><strong>Error:</strong> ${err.message}</p>
          <button class="btn" onclick="history.back()">Go Back</button>
        </div>
      </body></html>
    `);
  }

  let payload;
  try {
    payload = JSON.parse(decrypted);
  } catch {
    return res.send('Invalid JSON after decryption');
  }

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

  // Format date
  let dateStr = 'N/A';
  try {
    const d = new Date(live_at_time.replace(/\+00:00$/, 'Z'));
    if (!isNaN(d)) {
      dateStr = `${d.getDate()}-${d.toLocaleString('en', { month: 'long' })}-${d.getFullYear()}`;
    }
  } catch {}

  // Expiry Check
  let expired = true;
  let timeLeft = 'Expired';
  try {
    const made = new Date(made_at.replace(/\+00:00$/, 'Z'));
    const expiry = new Date(made.getTime() + 24 * 60 * 60 * 1000);
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
      <!DOCTYPE html>
      <html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Link Expired</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Poppins',sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:20px}
        .expired-box{background:rgba(255,255,255,0.1);backdrop-filter:blur(10px);padding:50px;border-radius:20px;border:2px solid rgba(255,255,255,0.2)}
        h1{font-size:3em;margin-bottom:20px}
        p{font-size:1.2em;margin:15px 0}
        .btn{margin-top:30px;padding:15px 40px;background:#fff;color:#667eea;border:none;border-radius:50px;font-weight:bold;cursor:pointer;font-size:1.1em;transition:0.3s}
        .btn:hover{transform:scale(1.05);box-shadow:0 5px 20px rgba(255,255,255,0.3)}
      </style></head>
      <body>
        <div class="expired-box">
          <h1>⏰ Link Expired!</h1>
          <p>This link is no longer valid.</p>
          <p>Please generate a new link.</p>
          <button class="btn" onclick="location.href='https://studyuk.fun'">Go to Website</button>
        </div>
      </body></html>
    `);
  }

  // Check for Class Cancelled or Live Soon
  const isCancelled = class_url === 'Class Cancelled' || slides_url === 'Class Cancelled';
  const isLiveSoon = class_url === 'Live Soon' || slides_url === 'Live Soon';

  const watchUrl = is_offline
    ? `https://studyuk.fun/sdv.html?url=${encodeURIComponent(class_url)}&title=${encodeURIComponent(class_name)}`
    : `https://studyuk.fun/umplayer.html?playurl=${encodeURIComponent(class_url)}&pdf=${encodeURIComponent(slides_url)}`;

  // === FULL HTML WITH AWESOME UI ===
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${class_name}</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Poppins', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      color: #333;
    }

    .container {
      width: 100%;
      max-width: 450px;
      margin: 10px 0;
    }

    .card {
      background: #fff;
      border-radius: 15px;
      padding: 25px;
      margin: 15px 0;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      transition: transform 0.3s ease;
    }

    .card:hover {
      transform: translateY(-5px);
    }

    /* User Card */
    .user-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
    }

    .user-card h3 {
      font-size: 1.5em;
      margin-bottom: 10px;
    }

    .user-id {
      font-size: 0.9em;
      opacity: 0.9;
      margin-bottom: 15px;
    }

    .countdown {
      background: rgba(255, 255, 255, 0.2);
      padding: 10px 20px;
      border-radius: 25px;
      font-weight: 600;
      display: inline-block;
      border: 2px solid rgba(255, 255, 255, 0.3);
    }

    /* Class Card */
    .class-card {
      text-align: center;
    }

    .teacher-img {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      border: 4px solid #667eea;
      margin: 0 auto 15px;
      display: block;
      object-fit: cover;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }

    .class-info {
      margin: 12px 0;
    }

    .class-info label {
      font-weight: 600;
      color: #667eea;
      display: block;
      font-size: 0.85em;
      text-transform: uppercase;
      margin-bottom: 5px;
    }

    .class-info span {
      font-size: 1.1em;
      color: #333;
      font-weight: 500;
    }

    .offline-badge {
      display: inline-block;
      background: #f39c12;
      color: white;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 0.8em;
      margin-left: 8px;
      font-weight: 600;
    }

    /* Buttons */
    .btn {
      display: block;
      width: 100%;
      padding: 14px;
      margin: 12px 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      font-size: 1em;
      cursor: pointer;
      text-decoration: none;
      text-align: center;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }

    .btn:active {
      transform: translateY(0);
    }

    .btn-secondary {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);
    }

    .btn-secondary:hover {
      box-shadow: 0 6px 20px rgba(245, 87, 108, 0.6);
    }

    .btn-success {
      background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
      box-shadow: 0 4px 15px rgba(67, 233, 123, 0.4);
    }

    .btn-success:hover {
      box-shadow: 0 6px 20px rgba(67, 233, 123, 0.6);
    }

    /* Popup Notification */
    .popup {
      position: fixed;
      top: 20px;
      right: -400px;
      background: #e74c3c;
      color: white;
      padding: 20px 30px;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      z-index: 9999;
      font-weight: 600;
      font-size: 1.1em;
      display: flex;
      align-items: center;
      gap: 15px;
      animation: slideIn 0.5s forwards, slideOut 0.5s 4.5s forwards;
    }

    .popup.success {
      background: linear-gradient(135deg, #56ab2f 0%, #a8e063 100%);
    }

    .popup-icon {
      font-size: 1.8em;
    }

    @keyframes slideIn {
      to {
        right: 20px;
      }
    }

    @keyframes slideOut {
      to {
        right: -400px;
      }
    }

    /* Footer */
    .footer {
      margin-top: 30px;
      text-align: center;
      color: white;
      font-size: 0.9em;
      opacity: 0.8;
    }

    /* Responsive */
    @media (max-width: 500px) {
      .card {
        padding: 20px;
      }

      .teacher-img {
        width: 80px;
        height: 80px;
      }

      .popup {
        right: -350px;
        font-size: 1em;
        padding: 15px 20px;
      }

      @keyframes slideIn {
        to {
          right: 10px;
        }
      }

      @keyframes slideOut {
        to {
          right: -350px;
        }
      }
    }
  </style>
</head>
<body>

  ${isCancelled ? `
    <div class="popup" id="popup">
      <span class="popup-icon">❌</span>
      <span>Class has been Cancelled</span>
    </div>
  ` : ''}

  ${isLiveSoon ? `
    <div class="popup success" id="popup">
      <span class="popup-icon">⏰</span>
      <span>Class Will Be Live Soon</span>
    </div>
  ` : ''}

  <div class="container">
    <!-- User Info Card -->
    <div class="card user-card">
      <h3>👋 Hello, ${user_first_name}!</h3>
      <div class="user-id">ID: ${user_id}</div>
      <div class="countdown" id="timer">⏳ Expires in: ${timeLeft}</div>
    </div>

    <!-- Class Info Card -->
    <div class="card class-card">
      <img src="${thumbnail}" alt="${teacher_name}" class="teacher-img" onerror="this.src='https://via.placeholder.com/100'">
      
      <div class="class-info">
        <label>👨‍🏫 Teacher</label>
        <span>${teacher_name}</span>
      </div>

      <div class="class-info">
        <label>📚 Class Name</label>
        <span>${class_name}</span>
      </div>

      <div class="class-info">
        <label>📅 Date</label>
        <span>${dateStr}${is_offline ? '<span class="offline-badge">Offline</span>' : ''}</span>
      </div>

      <a href="${class_url}" class="btn" target="_blank">📥 Download Class Video</a>
      <a href="${slides_url}" class="btn btn-secondary" target="_blank">📄 Download Slides (PDF)</a>
      <a href="${watchUrl}" class="btn btn-success" target="_blank">▶️ Watch Lecture Now</a>
    </div>
  </div>

  <div class="footer">
    Made with ❤️ by HACKHET<br>
    Powered by StudyUK
  </div>

  <script>
    // Countdown Timer
    const expiry = new Date('${made_at.replace(/\+00:00$/, 'Z')}').getTime() + 24*60*60*1000;
    
    function updateTimer() {
      const diff = expiry - Date.now();
      if (diff <= 0) {
        location.reload();
        return;
      }
      
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      
      document.getElementById('timer').textContent = '⏳ Expires in: ' + h + 'h ' + m + 'm ' + s + 's';
    }
    
    setInterval(updateTimer, 1000);

    // Auto-hide popup after 5 seconds
    const popup = document.getElementById('popup');
    if (popup) {
      setTimeout(() => {
        popup.style.display = 'none';
      }, 5000);
    }
  </script>

</body>
</html>
  `);
});

// === /encrypt (Generate New Link) ===
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
    "user_first_name": "HACKHET",
    "user_id": 5748674252,
    "made_at": new Date().toISOString()
  };

  const encrypted = encrypt(sample);
  const url = `https://dekhosekd.onrender.com/op?data=${encrypted}`;

  res.send(`
    <!DOCTYPE html>
    <html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Link</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Poppins',sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
      .container{background:rgba(255,255,255,0.1);backdrop-filter:blur(10px);padding:40px;border-radius:20px;max-width:700px;border:2px solid rgba(255,255,255,0.2)}
      h2{margin-bottom:20px;font-size:2em}
      .link-box{background:#fff;color:#333;padding:15px;border-radius:10px;margin:20px 0;word-break:break-all;font-size:0.9em}
      .link-box a{color:#667eea;font-weight:600;text-decoration:none}
      .btn{padding:12px 30px;background:#fff;color:#667eea;border:none;border-radius:8px;cursor:pointer;font-weight:600;margin:10px 5px;transition:0.3s}
      .btn:hover{transform:scale(1.05)}
      details{margin-top:20px;background:rgba(0,0,0,0.2);padding:15px;border-radius:10px}
      summary{cursor:pointer;font-weight:600;margin-bottom:10px}
      pre{background:#000;color:#0f0;padding:15px;border-radius:8px;overflow:auto;font-size:0.8em}
    </style>
    </head><body>
    <div class="container">
      <h2>🔐 Link Generated Successfully!</h2>
      <div class="link-box">
        <a href="${url}" target="_blank">${url}</a>
      </div>
      <button class="btn" onclick="navigator.clipboard.writeText('${url}');alert('Link Copied!')">📋 Copy Link</button>
      <button class="btn" onclick="location.href='${url}'">🔗 Open Link</button>
      <details>
        <summary>View Encrypted Data</summary>
        <pre>${encrypted}</pre>
      </details>
    </div>
    </body></html>
  `);
});

// === Home Route ===
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dekho Sekd Opener</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap" rel="stylesheet">
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Poppins',sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:20px}
      .box{background:rgba(255,255,255,0.1);backdrop-filter:blur(10px);padding:60px 40px;border-radius:25px;border:2px solid rgba(255,255,255,0.2)}
      h1{font-size:2.5em;margin-bottom:15px}
      p{font-size:1.2em;margin-bottom:30px;opacity:0.9}
      .btn{padding:15px 40px;background:#fff;color:#667eea;border:none;border-radius:50px;font-weight:bold;font-size:1.1em;cursor:pointer;text-decoration:none;display:inline-block;transition:0.3s}
      .btn:hover{transform:scale(1.1);box-shadow:0 10px 30px rgba(255,255,255,0.3)}
    </style></head>
    <body>
      <div class="box">
        <h1>🎓 Dekho Sekd Opener</h1>
        <p>Generate & Share Class Links Securely</p>
        <a href="/encrypt" class="btn">Generate New Link</a>
      </div>
    </body></html>
  `);
});

app.listen(port, () => {
  console.log('🚀 LIVE: https://dekhosekd.onrender.com');
  console.log('📱 Port:', port);
});
