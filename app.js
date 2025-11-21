// app.js - UPDATED WITH POPUP CHANGES
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

// === IMPROVED DECRYPT FUNCTION - HANDLES PADDING BETTER ===
function decrypt(encrypted) {
  try {
    const base64 = fixAndPadBase64(encrypted);
    const buffer = Buffer.from(base64, 'base64');

    console.log(`Ciphertext length: ${buffer.length} bytes`);

    if (buffer.length % 16 !== 0) {
      throw new Error(`Invalid length: ${buffer.length} (must be multiple of 16)`);
    }

    // Try with auto padding first (most common)
    try {
      const decipher = crypto.createDecipheriv('aes-128-cbc', KEY, IV);
      decipher.setAutoPadding(true);
      let decrypted = decipher.update(buffer);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      const result = decrypted.toString('utf8');
      console.log('✅ Decryption successful with auto-padding');
      return result;
    } catch (autoPadErr) {
      console.log('⚠️ Auto-padding failed, trying manual padding...');
    }

    // Fallback to manual padding
    const decipher = crypto.createDecipheriv('aes-128-cbc', KEY, IV);
    decipher.setAutoPadding(false);

    let decrypted = decipher.update(buffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    // PKCS7 unpad - More robust
    const pad = decrypted[decrypted.length - 1];
    if (pad >= 1 && pad <= 16) {
      // Verify all padding bytes are correct
      let validPadding = true;
      for (let i = 0; i < pad; i++) {
        if (decrypted[decrypted.length - 1 - i] !== pad) {
          validPadding = false;
          break;
        }
      }
      
      if (validPadding) {
        decrypted = decrypted.slice(0, -pad);
        console.log('✅ Manual padding successful');
      } else {
        console.log('⚠️ Invalid padding bytes, returning as-is');
      }
    }

    return decrypted.toString('utf8');
  } catch (err) {
    console.error('❌ Decryption error:', err.message);
    throw new Error('Decryption failed: ' + err.message);
  }
}

// === ENCRYPT ===
function encrypt(obj) {
  const text = JSON.stringify(obj);
  const cipher = crypto.createCipheriv('aes-128-cbc', KEY, IV);
  cipher.setAutoPadding(true);
  let enc = cipher.update(text, 'utf8');
  enc = Buffer.concat([enc, cipher.final()]);
  return enc.toString('base64');
}

// === /op ROUTE ===
app.get('/op', (req, res) => {
  const { data } = req.query;
  if (!data) return res.status(400).send('Missing data');

  let decrypted;
  try {
    decrypted = decrypt(data);
    console.log('Decrypted data:', decrypted.substring(0, 100) + '...');
  } catch (err) {
    console.error('Error:', err.message);
    return res.send(`
      <!DOCTYPE html>
      <html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invalid Link</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:Arial,sans-serif;background:#f44336;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
        .error-box{background:#fff;color:#333;padding:30px;border-radius:10px;text-align:center;max-width:500px;width:100%}
        .error-box h2{color:#f44336;margin-bottom:15px}
        .error-box p{margin:10px 0;color:#666;word-break:break-word}
        .btn{margin-top:20px;padding:12px 30px;background:#f44336;color:white;border:none;border-radius:5px;cursor:pointer;font-size:1em;font-weight:600}
        .debug{background:#f5f5f5;padding:10px;border-radius:5px;margin-top:15px;font-size:0.85em;text-align:left;overflow:auto}
      </style>
      </head><body>
        <div class="error-box">
          <h2>❌ Invalid Link</h2>
          <p><strong>Error:</strong> ${err.message}</p>
          <div class="debug">
            <strong>Debug Info:</strong><br>
            Data Length: ${data.length}<br>
            First 50 chars: ${data.substring(0, 50)}...
          </div>
          <button class="btn" onclick="history.back()">Go Back</button>
        </div>
      </body></html>
    `);
  }

  let payload;
  try {
    payload = JSON.parse(decrypted);
    console.log('Parsed payload:', Object.keys(payload));
  } catch (parseErr) {
    console.error('JSON parse error:', parseErr.message);
    return res.send(`
      <!DOCTYPE html>
      <html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invalid Data</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:Arial,sans-serif;background:#ff9800;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
        .error-box{background:#fff;color:#333;padding:30px;border-radius:10px;text-align:center;max-width:600px;width:100%}
        .error-box h2{color:#ff9800;margin-bottom:15px}
        .error-box p{margin:10px 0;color:#666}
        .btn{margin-top:20px;padding:12px 30px;background:#ff9800;color:white;border:none;border-radius:5px;cursor:pointer;font-size:1em;font-weight:600}
        pre{background:#f5f5f5;padding:15px;border-radius:5px;overflow:auto;text-align:left;font-size:0.8em;margin-top:15px}
      </style>
      </head><body>
        <div class="error-box">
          <h2>⚠️ Invalid JSON Data</h2>
          <p>Decryption successful but data is not valid JSON</p>
          <details>
            <summary>View Decrypted Data</summary>
            <pre>${decrypted}</pre>
          </details>
          <button class="btn" onclick="history.back()">Go Back</button>
        </div>
      </body></html>
    `);
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
        body{font-family:Arial,sans-serif;background:#ff9800;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:20px}
        .expired-box{background:#fff;color:#333;padding:40px;border-radius:10px;max-width:500px;width:100%}
        h1{font-size:2.5em;margin-bottom:20px;color:#ff9800}
        p{font-size:1.1em;margin:10px 0;color:#666}
        .btn{margin-top:30px;padding:15px 40px;background:#ff9800;color:#fff;border:none;border-radius:5px;font-weight:bold;cursor:pointer;font-size:1em}
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

  const watchUrl = is_offline
    ? `https://studyuk.fun/sdv.html?url=${encodeURIComponent(class_url)}&title=${encodeURIComponent(class_name)}`
    : `https://studyuk.fun/umplayer.html?playurl=${encodeURIComponent(class_url)}&pdf=${encodeURIComponent(slides_url)}`;

  // === FULL HTML - WITH POPUP LOGIC ===
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${class_name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      color: #333;
    }

    .container {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
    }

    .card {
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 15px;
    }

    .user-card {
      background: #5e35b1;
      color: #fff;
      text-align: center;
      border: none;
    }

    .user-card h3 {
      font-size: 1.3em;
      margin-bottom: 8px;
      font-weight: 600;
    }

    .user-id {
      font-size: 0.9em;
      opacity: 0.9;
      margin-bottom: 15px;
    }

    .countdown {
      background: rgba(255, 255, 255, 0.2);
      padding: 8px 16px;
      border-radius: 5px;
      font-weight: 600;
      display: inline-block;
      font-size: 0.95em;
    }

    .class-card {
      text-align: center;
    }

    .teacher-img {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      border: 3px solid #5e35b1;
      margin: 0 auto 20px;
      display: block;
      object-fit: cover;
    }

    .info-row {
      margin: 15px 0;
      text-align: left;
    }

    .info-row label {
      display: block;
      font-size: 0.85em;
      color: #666;
      margin-bottom: 5px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-row .value {
      font-size: 1.1em;
      color: #333;
      font-weight: 500;
    }

    .btn {
      display: block;
      width: 100%;
      padding: 14px;
      margin: 10px 0;
      background: #5e35b1;
      color: #fff;
      border: none;
      border-radius: 5px;
      font-weight: 600;
      font-size: 1em;
      cursor: pointer;
      text-decoration: none;
      text-align: center;
      transition: background 0.3s ease;
    }

    .btn:hover {
      background: #4527a0;
    }

    .btn-secondary {
      background: #f57c00;
    }

    .btn-secondary:hover {
      background: #e65100;
    }

    .btn-success {
      background: #43a047;
    }

    .btn-success:hover {
      background: #2e7d32;
    }

    .btn-outline {
      background: #fff;
      color: #5e35b1;
      border: 2px solid #5e35b1;
    }

    .btn-outline:hover {
      background: #5e35b1;
      color: #fff;
    }

    /* Popup Modal */
    .popup-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }

    .popup-modal.active {
      display: flex;
    }

    .popup-content {
      background: #fff;
      padding: 40px 30px;
      border-radius: 12px;
      text-align: center;
      max-width: 400px;
      width: 90%;
      animation: popupSlide 0.3s ease;
    }

    @keyframes popupSlide {
      from {
        transform: scale(0.7);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }

    .popup-content .popup-icon {
      font-size: 4em;
      margin-bottom: 20px;
    }

    .popup-content h2 {
      margin-bottom: 15px;
      color: #333;
      font-size: 1.6em;
    }

    .popup-content p {
      margin-bottom: 25px;
      color: #666;
      font-size: 1.1em;
    }

    .popup-close {
      padding: 12px 35px;
      background: #5e35b1;
      color: #fff;
      border: none;
      border-radius: 5px;
      font-weight: 600;
      cursor: pointer;
      font-size: 1em;
      transition: background 0.3s ease;
    }

    .popup-close:hover {
      background: #4527a0;
    }

    .popup-content.cancelled .popup-icon {
      color: #f44336;
    }

    .popup-content.live-soon .popup-icon {
      color: #4caf50;
    }

    .footer {
      margin-top: 30px;
      text-align: center;
      color: #999;
      font-size: 0.9em;
    }

    @media (max-width: 768px) {
      body {
        padding: 15px;
      }

      .card {
        padding: 18px;
      }

      .user-card h3 {
        font-size: 1.2em;
      }

      .teacher-img {
        width: 80px;
        height: 80px;
      }

      .info-row label {
        font-size: 0.8em;
      }

      .info-row .value {
        font-size: 1em;
      }

      .btn {
        padding: 13px;
        font-size: 0.95em;
      }

      .popup-content {
        padding: 30px 25px;
      }

      .popup-content h2 {
        font-size: 1.4em;
      }

      .popup-content p {
        font-size: 1em;
      }

      .popup-content .popup-icon {
        font-size: 3.5em;
      }
    }

    @media (min-width: 1200px) {
      .container {
        max-width: 700px;
      }

      .card {
        padding: 30px;
      }

      .teacher-img {
        width: 110px;
        height: 110px;
      }

      .btn {
        padding: 16px;
        font-size: 1.05em;
      }
    }
  </style>
</head>
<body>

  <!-- Popup Modal -->
  <div class="popup-modal" id="popupModal">
    <div class="popup-content" id="popupContent">
      <div class="popup-icon" id="popupIcon"></div>
      <h2 id="popupTitle"></h2>
      <p id="popupMessage"></p>
      <button class="popup-close" onclick="closePopup()">Close</button>
    </div>
  </div>

  <div class="container">
    <div class="card user-card">
      <h3>Hello, ${user_first_name}!</h3>
      <div class="user-id">ID: ${user_id}</div>
      <div class="countdown" id="timer">Expires in: ${timeLeft}</div>
    </div>

    <div class="card class-card">
      <img src="${thumbnail}" alt="${teacher_name}" class="teacher-img" onerror="this.src='https://via.placeholder.com/100'">
      
      <div class="info-row">
        <label>Teacher</label>
        <div class="value">${teacher_name}</div>
      </div>

      <div class="info-row">
        <label>Class Name</label>
        <div class="value">${class_name}</div>
      </div>

      <div class="info-row">
        <label>Date</label>
        <div class="value">${dateStr}</div>
      </div>

      <button class="btn" onclick="handleClick('download', '${class_url.replace(/'/g, "\\'")}')">📥 Download Class Video</button>
      <button class="btn btn-secondary" onclick="handleClick('slides', '${slides_url.replace(/'/g, "\\'")}')">📄 Download Slides (PDF)</button>
      <button class="btn btn-success" onclick="handleClick('watch', '${watchUrl.replace(/'/g, "\\'")}', '${class_url.replace(/'/g, "\\'")}', '${slides_url.replace(/'/g, "\\'")}')">▶️ Watch Lecture Now</button>
      <a href="https://studyuk.fun" class="btn btn-outline" target="_blank">🌐 Visit Website</a>
    </div>
  </div>

  <div class="footer">
    Made with ❤️ by HACKHET | Powered by StudyUK
  </div>

  <script>
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
      
      document.getElementById('timer').textContent = 'Expires in: ' + h + 'h ' + m + 'm ' + s + 's';
    }
    
    setInterval(updateTimer, 1000);

    function handleClick(type, url, classUrl, slidesUrl) {
      // Check if Class Cancelled or Live Soon
      if (type === 'download' || type === 'slides' || type === 'watch') {
        const checkUrl = type === 'download' ? url : (type === 'slides' ? url : classUrl);
        const checkSlides = type === 'watch' ? slidesUrl : null;
        
        if (checkUrl === 'Class Cancelled' || checkSlides === 'Class Cancelled') {
          showPopup('❌', 'Class Cancelled', 'This class has been cancelled.', 'cancelled');
          return;
        }
        
        if (checkUrl === 'Live Soon' || checkSlides === 'Live Soon') {
          showPopup('⏰', 'Live Soon', 'This class will be live soon!', 'live-soon');
          return;
        }
      }
      
      // Open URL
      window.open(url, '_blank');
    }

    function showPopup(icon, title, message, cssClass) {
      document.getElementById('popupIcon').textContent = icon;
      document.getElementById('popupTitle').textContent = title;
      document.getElementById('popupMessage').textContent = message;
      document.getElementById('popupContent').className = 'popup-content ' + cssClass;
      document.getElementById('popupModal').classList.add('active');
    }

    function closePopup() {
      document.getElementById('popupModal').classList.remove('active');
    }

    // Close on outside click
    document.getElementById('popupModal').addEventListener('click', function(e) {
      if (e.target === this) {
        closePopup();
      }
    });
  </script>

</body>
</html>
  `);
});

// === TELEGRAM POPUP PAGE ===
function telegramPopupPage() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Join Our Telegram</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .popup-box {
      background: #fff;
      padding: 50px 40px;
      border-radius: 15px;
      text-align: center;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.4s ease;
    }

    @keyframes slideUp {
      from {
        transform: translateY(50px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .telegram-icon {
      font-size: 5em;
      margin-bottom: 20px;
      animation: bounce 2s infinite;
    }

    @keyframes bounce {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-10px);
      }
    }

    h1 {
      font-size: 2em;
      margin-bottom: 15px;
      color: #333;
    }

    p {
      font-size: 1.2em;
      color: #666;
      margin-bottom: 30px;
      line-height: 1.6;
    }

    .telegram-btn {
      display: inline-block;
      padding: 15px 40px;
      background: linear-gradient(135deg, #0088cc, #00aced);
      color: #fff;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 600;
      font-size: 1.1em;
      transition: all 0.3s ease;
      box-shadow: 0 5px 15px rgba(0, 136, 204, 0.4);
    }

    .telegram-btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba(0, 136, 204, 0.6);
    }

    .telegram-btn:active {
      transform: translateY(0);
    }

    .footer-text {
      margin-top: 30px;
      font-size: 0.9em;
      color: #999;
    }

    @media (max-width: 768px) {
      .popup-box {
        padding: 40px 30px;
      }

      h1 {
        font-size: 1.7em;
      }

      p {
        font-size: 1.1em;
      }

      .telegram-icon {
        font-size: 4em;
      }

      .telegram-btn {
        padding: 14px 35px;
        font-size: 1em;
      }
    }
  </style>
</head>
<body>
  <div class="popup-box">
    <div class="telegram-icon">📱</div>
    <h1>Join Our Telegram Channel 🙂</h1>
    <p>Stay updated with the latest classes, notes, and announcements!</p>
    <a href="https://t.me/YourChannelHere" class="telegram-btn" target="_blank">
      Join Now
    </a>
    <div class="footer-text">
      Made with ❤️ by HACKHET
    </div>
  </div>
</body>
</html>
  `;
}

// === / ROUTE - TELEGRAM POPUP ===
app.get('/', (req, res) => {
  res.send(telegramPopupPage());
});

// === /encrypt ROUTE - TELEGRAM POPUP ===
app.get('/encrypt', (req, res) => {
  res.send(telegramPopupPage());
});

app.listen(port, () => {
  console.log('🚀 LIVE: https://dekhosekd.onrender.com');
  console.log('📱 Port:', port);
});
