const express = require('express');
const crypto = require('crypto');
const app = express();
const port = process.env.PORT || 3000;

// Encryption settings
const ENCRYPTION_KEY = Buffer.from('b7e2f4a9c8d3e6b1f0a2c5d7e9b4f1a3c6d8e0f2a4b5c7d9e1f0a3b6c8d4e2ff', 'hex'); // 32 bytes
const IV = Buffer.from('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', 'hex'); // 16 bytes

// Encryption function
function encrypt(text) {
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

// Decryption function
function decrypt(encrypted) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

app.get('/op', (req, res) => {
  try {
    // Expect encrypted data parameter
    const { data } = req.query;
    if (!data) {
      return res.status(400).send('Missing encrypted data parameter');
    }

    // Decrypt and parse query parameters
    let params;
    try {
      const decrypted = decrypt(data);
      params = JSON.parse(decrypted);
    } catch (error) {
      console.error('Error decrypting data:', error);
      return res.status(400).send('Invalid encrypted data');
    }

    const {
      class_name,
      teacher_name,
      thumbnail,
      class_url,
      slides_url,
      is_offline,
      live_at_time,
      user_first_name,
      user_id,
      made_at
    } = params;

    // Basic validation: ensure all params are provided
    if (!class_name || !teacher_name || !thumbnail || !class_url || !slides_url || !live_at_time || !user_first_name || !user_id || !made_at) {
      return res.status(400).send('Missing required query parameters');
    }

    // Server-side date formatting for live_at_time
    let formattedDate;
    try {
      const normalizedDateStr = live_at_time.replace(/\+00:00$/, 'Z');
      const date = new Date(normalizedDateStr);
      if (isNaN(date)) {
        console.error(`Invalid date format: ${live_at_time}`);
        formattedDate = live_at_time; // Fallback to raw string
      } else {
        const day = date.getDate();
        const month = date.toLocaleString('en-US', { month: 'long' });
        const year = date.getFullYear();
        formattedDate = `${day}-${month}-${year}`;
      }
    } catch (error) {
      console.error(`Error parsing date: ${live_at_time}`, error);
      formattedDate = live_at_time; // Fallback to raw string
    }

    // Check link expiration (24 hours from made_at)
    let isExpired = false;
    let timeLeft = '';
    try {
      const madeAtDate = new Date(made_at.replace(/\+00:00$/, 'Z'));
      const currentDate = new Date(); // Use actual server time
      const expiryDate = new Date(madeAtDate.getTime() + 24 * 60 * 60 * 1000); // 24 hours later
      if (isNaN(madeAtDate)) {
        console.error(`Invalid made_at format: ${made_at}`);
        isExpired = true;
      } else if (currentDate > expiryDate) {
        isExpired = true;
      } else {
        const timeDiff = expiryDate - currentDate;
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        timeLeft = `${hours}h ${minutes}m ${seconds}s`;
      }
    } catch (error) {
      console.error(`Error parsing made_at: ${made_at}`, error);
      isExpired = true;
    }

    // Expired link HTML
    if (isExpired) {
      const expiredHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <title>Link Expired</title>
          <style>
            body {
              font-family: 'Helvetica', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(45deg, #b71c1c, #d32f2f, #f44336);
              color: #ffffff;
              perspective: 1200px;
              overflow: hidden;
            }
            .expired-box {
              text-align: center;
              background: rgba(255, 255, 255, 0.2);
              padding: 30px;
              border-radius: 20px;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
              backdrop-filter: blur(10px);
              transform-style: preserve-3d;
              transform: rotateX(10deg) rotateY(10deg);
              max-width: 400px;
              width: 95%;
              border: 3px solid rgba(255, 255, 255, 0.5);
              animation: waveExpired 3s infinite ease-in-out;
            }
            .expired-box:hover {
              transform: rotateX(0deg) rotateY(0deg);
            }
            @keyframes waveExpired {
              0%, 100% { transform: rotateX(10deg) rotateY(10deg) translateY(0); }
              50% { transform: rotateX(10deg) rotateY(10deg) translateY(-8px); }
            }
            .label {
              font-size: 1.2em;
              font-weight: bold;
              margin: 15px 0;
              text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
              transform: translateZ(30px);
              animation: fadeIn 1.5s ease forwards;
            }
            button {
              padding: 12px 25px;
              margin: 10px;
              background: linear-gradient(135deg, #ffca28, #ffb300);
              color: #1a237e;
              border: none;
              border-radius: 30px;
              cursor: pointer;
              font-size: 0.95em;
              font-weight: bold;
              box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4), inset 0 -4px 8px rgba(0, 0, 0, 0.2);
              transition: all 0.3s ease;
              transform: translateZ(35px) perspective(200px) rotateX(0deg);
              position: relative;
              overflow: hidden;
            }
            button::after {
              content: '';
              position: absolute;
              top: 50%;
              left: 50%;
              width: 0;
              height: 0;
              background: rgba(255, 255, 255, 0.3);
              border-radius: 50%;
              transform: translate(-50%, -50%);
              transition: width 0.5s ease, height 0.5s ease;
            }
            button:hover::after {
              width: 200px;
              height: 200px;
            }
            button:hover {
              background: linear-gradient(135deg, #ffb300, #ffca28);
              box-shadow: 0 12px 24px rgba(0, 0, 0, 0.5);
              transform: translateZ(55px) perspective(200px) rotateX(10deg);
            }
            button:active {
              transform: translateZ(25px) perspective(200px) rotateX(5deg);
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: translateZ(30px) translateY(10px); }
              to { opacity: 1; transform: translateZ(30px) translateY(0); }
            }
            @media (max-width: 600px) {
              .expired-box {
                padding: 20px;
                max-width: 340px;
                border-radius: 15px;
              }
              .label {
                font-size: 1em;
              }
              button {
                padding: 10px 18px;
                font-size: 0.9em;
              }
            }
          </style>
        </head>
        <body>
          <div class="expired-box">
            <div class="label">Your Link Has Expired!</div>
            <div class="label">Please generate a new link from our website.</div>
            <button onclick="window.location.href='https://studyuk.fun'">Go to Website</button>
          </div>
        </body>
        </html>
      `;
      return res.send(expiredHtml);
    }

    // Determine lecture URL based on is_offline
    const lectureUrl = is_offline === 'true'
      ? `https://studyuk.fun/sdv.html?url=${encodeURIComponent(class_url)}&title=${encodeURIComponent(class_name)}`
      : `http://studyuk.fun/umplayer.html?playurl=${encodeURIComponent(class_url)}&pdf=${encodeURIComponent(slides_url)}`;

    // Main HTML with countdown timer
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>${class_name}</title>
        <style>
          body {
            font-family: 'Helvetica', sans-serif;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(45deg, #1a237e, #303f9f, #3f51b5);
            color: #ffffff;
            perspective: 1200px;
            overflow: hidden;
          }
          .user-box {
            background: linear-gradient(45deg, #4a148c, #7b1fa2);
            padding: 25px;
            border-radius: 25px;
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
            max-width: 400px;
            width: 95%;
            margin-bottom: 30px;
            transform: translateZ(40px);
            animation: fadeIn 1.5s ease forwards;
            border: 3px solid transparent;
            border-image: linear-gradient(45deg, #ffeb3b, transparent) 1;
            text-align: center;
          }
          .container {
            text-align: center;
            background: rgba(255, 255, 255, 0.2);
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(8px);
            transform-style: preserve-3d;
            transform: rotateX(5deg) rotateY(5deg);
            max-width: 400px;
            width: 95%;
            border: 3px solid rgba(255, 255, 255, 0.5);
            box-sizing: border-box;
            animation: waveContainer 3s infinite ease-in-out;
          }
          .container:hover {
            transform: rotateX(0deg) rotateY(0deg);
          }
          @keyframes waveContainer {
            0%, 100% { transform: rotateX(5deg) rotateY(5deg) translateY(0); }
            50% { transform: rotateX(5deg) rotateY(5deg) translateY(-6px); }
          }
          .thumbnail {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            border: 4px solid #ffffff;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
            transform: translateZ(60px);
            animation: bounceThumbnail 2s infinite ease-in-out;
          }
          .thumbnail:hover {
            transform: translateZ(80px);
          }
          @keyframes bounceThumbnail {
            0%, 100% { transform: translateZ(60px) translateY(0); }
            50% { transform: translateZ(60px) translateY(-5px); }
          }
          .label {
            font-size: 1.1em;
            font-weight: bold;
            margin: 10px 0;
            text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
            transform: translateZ(20px);
            animation: fadeIn 1.5s ease forwards;
          }
          .countdown {
            font-size: 1em;
            font-weight: bold;
            margin: 10px 0;
            text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
            transform: translateZ(30px);
            background: linear-gradient(45deg, #ffca28, #ffb300);
            color: #1a237e;
            padding: 8px 15px;
            border-radius: 15px;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
            animation: pulseCountdown 2s infinite ease-in-out;
          }
          @keyframes pulseCountdown {
            0%, 100% { transform: translateZ(30px) scale(1); }
            50% { transform: translateZ(30px) scale(1.05); }
          }
          button {
            padding: 12px 25px;
            margin: 6px;
            background: linear-gradient(135deg, #ff4081, #f50057, #d81b60);
            color: white;
            border: none;
            border-radius: 30px;
            cursor: pointer;
            font-size: 0.95em;
            font-weight: bold;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4), inset 0 -4px 8px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
            transform: translateZ(35px) perspective(200px) rotateX(0deg);
            position: relative;
            overflow: hidden;
          }
          button::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            transition: width 0.5s ease, height 0.5s ease;
          }
          button:hover::after {
            width: 200px;
            height: 200px;
          }
          button:hover {
            background: linear-gradient(135deg, #f50057, #ff4081, #d81b60);
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.5), inset 0 -6px 12px rgba(0, 0, 0, 0.3);
            transform: translateZ(55px) perspective(200px) rotateX(10deg);
          }
          button:active {
            transform: translateZ(25px) perspective(200px) rotateX(5deg);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -4px 8px rgba(0, 0, 0, 0.2);
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateZ(20px) translateY(10px); }
            to { opacity: 1; transform: translateZ(20px) translateY(0); }
          }
          .popup {
            position: fixed;
            top: 50%;
            right: -300px;
            transform: translateY(-50%) translateZ(100px) perspective(500px) rotateY(-20deg);
            color: white;
            padding: 12px;
            border-radius: 10px;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
            font-size: 0.9em;
            max-width: 200px;
            opacity: 0;
            transition: opacity 0.3s ease;
            animation: none;
          }
          .popup.live-soon {
            background: rgba(0, 128, 0, 0.9);
          }
          .popup.cancelled {
            background: rgba(255, 0, 0, 0.9);
          }
          .popup.show {
            animation: slideInOut 2s ease forwards;
          }
          @keyframes slideInOut {
            0% { right: -300px; opacity: 0; transform: translateY(-50%) translateZ(100px) rotateY(-20deg); }
            20% { right: 10px; opacity: 1; transform: translateY(-50%) translateZ(100px) rotateY(0deg); }
            80% { right: 10px; opacity: 1; transform: translateY(-50%) translateZ(100px) rotateY(0deg); }
            100% { right: -300px; opacity: 0; transform: translateY(-50%) translateZ(100px) rotateY(-20deg); }
          }
          @media (max-width: 600px) {
            .user-box {
              padding: 20px;
              max-width: 340px;
              margin-bottom: 20px;
              border-radius: 20px;
            }
            .container {
              padding: 20px;
              max-width: 340px;
            }
            .thumbnail {
              width: 90px;
              height: 90px;
            }
            .label {
              font-size: 1em;
            }
            .countdown {
              font-size: 0.9em;
              padding: 6px 12px;
            }
            button {
              padding: 10px 18px;
              font-size: 0.9em;
            }
            .popup {
              max-width: 180px;
              padding: 10px;
              font-size: 0.85em;
            }
          }
        </style>
      </head>
      <body>
        <div class="user-box">
          <div class="label">Name - ${user_first_name}</div>
          <div class="label">User Id - ${user_id}</div>
          <div class="countdown" id="countdown">Link Expires in - ${timeLeft}</div>
        </div>
        <div class="container">
          <img class="thumbnail" src="${thumbnail}" alt="Teacher Thumbnail">
          <div class="label">𝗧𝗲𝗮𝗰𝗵𝗲𝗿 - ${teacher_name}</div>
          <div class="label">𝗖𝗹𝗮𝘀𝘀 𝗡𝗮𝗺𝗲 - ${class_name}</div>
          <div class="label">𝗗𝗮𝘁𝗲 𝗼𝗳 𝗖𝗹𝗮𝘀𝘀 - ${formattedDate}${is_offline === 'true' ? ' (Offline)' : ''}</div>
          <button onclick="handleDownload('${class_url}', 'class')">CLICK TO DOWNLOAD CLASS</button>
          <button onclick="handleDownload('${slides_url}', 'slides')">CLICK TO DOWNLOAD SLIDES</button>
          <button onclick="handleWatchLecture('${lectureUrl}')">CLICK TO WATCH LECTURE</button>
        </div>
        <div id="popup" class="popup"></div>
        <script>
          function handleDownload(url, type) {
            if (url === 'Live Soon' || url === 'Class Cancelled') {
              const popup = document.getElementById('popup');
              popup.textContent = url === 'Live Soon' ? 'This class is Live Soon!' : 'This class is Cancelled!';
              popup.className = 'popup ' + (url === 'Live Soon' ? 'live-soon' : 'cancelled');
              popup.classList.add('show');
              setTimeout(() => {
                popup.classList.remove('show');
              }, 2000);
            } else {
              window.location.href = url;
            }
          }
          function handleWatchLecture(url) {
            window.location.href = url;
          }
          // Client-side countdown timer
          const madeAt = new Date('${made_at.replace(/\+00:00$/, 'Z')}');
          const expiryDate = new Date(madeAt.getTime() + 24 * 60 * 60 * 1000);
          function updateCountdown() {
            const now = new Date();
            const timeDiff = expiryDate - now;
            if (timeDiff <= 0) {
              window.location.reload(); // Reload to show expired page
              return;
            }
            const hours = Math.floor(timeDiff / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
            document.getElementById('countdown').textContent = 'Link Expires in - ' + hours + 'h ' + minutes + 'm ' + seconds + 's';
          }
          setInterval(updateCountdown, 1000);
        </script>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).send('Internal Server Error: ' + error.message);
  }
});

// Fallback route
app.get('/', (req, res) => {
  res.send('Welcome! Use /op with encrypted data param.');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
