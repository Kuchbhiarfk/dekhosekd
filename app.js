// app.js (Advanced Unique UI: Double-sided 3D flip card with holographic glow, neon dark theme, center scale popup with glow)
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/op', (req, res) => {
  try {
    const {
      class_name,
      teacher_name,
      thumbnail,
      class_url,
      slides_url,
      is_offline,
      live_at_time
    } = req.query;

    // Basic validation: ensure all params are provided
    if (!class_name || !teacher_name || !thumbnail || !class_url || !slides_url || !live_at_time) {
      return res.status(400).send('Missing required query parameters');
    }

    // Server-side date formatting
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

    // New HTML template: Neon dark theme, double-sided 3D flip card (front: thumbnail + basic info; back: buttons + details), holographic glow, center scale popup
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>${class_name}</title>
        <style>
          body {
            font-family: 'Segoe UI', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #121212, #1e1e1e); /* Dark neon theme */
            color: #ffffff;
            perspective: 1200px;
          }
          .card-container {
            position: relative;
            width: 90%;
            max-width: 400px;
            height: 500px; /* Fixed height for flip */
            transform-style: preserve-3d;
            transition: transform 0.8s ease;
            margin: 20px;
          }
          .card-container:hover {
            transform: rotateY(180deg); /* Flip on hover */
          }
          .card-front, .card-back {
            position: absolute;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 25px;
            box-sizing: border-box;
            border-radius: 20px;
            box-shadow: 0 0 15px rgba(0, 255, 255, 0.3); /* Holographic glow */
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
          }
          .card-front {
            transform: rotateY(0deg);
          }
          .card-back {
            transform: rotateY(180deg);
            background: rgba(255, 255, 255, 0.1);
          }
          .card-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(45deg, rgba(0,255,255,0.2), rgba(255,0,255,0.2));
            opacity: 0;
            transition: opacity 0.5s ease;
            z-index: -1;
          }
          .card-container:hover::before {
            opacity: 1; /* Holographic shimmer on hover */
          }
          .thumbnail {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            border: 3px solid #00ffff; /* Neon cyan */
            box-shadow: 0 0 10px #00ffff;
            transform: translateZ(50px);
            animation: glowPulse 2s infinite alternate;
          }
          @keyframes glowPulse {
            0% { box-shadow: 0 0 10px #00ffff; }
            100% { box-shadow: 0 0 20px #00ffff; }
          }
          .label {
            font-size: 1.1em;
            font-weight: bold;
            margin: 10px 0;
            text-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
            transform: translateZ(20px);
          }
          button {
            padding: 12px 25px;
            margin: 10px 0;
            background: linear-gradient(135deg, #ff00ff, #00ffff); /* Neon gradient */
            color: #121212;
            border: none;
            border-radius: 30px;
            cursor: pointer;
            font-size: 1em;
            box-shadow: 0 0 10px #ff00ff;
            transition: all 0.3s ease;
            transform: translateZ(30px);
          }
          button:hover {
            box-shadow: 0 0 20px #ff00ff;
            transform: translateZ(40px) scale(1.05);
          }
          /* Center Scale Popup with Glow */
          .popup {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0);
            background: rgba(18, 18, 18, 0.9);
            color: #ffffff;
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
            font-size: 1em;
            max-width: 80%;
            opacity: 0;
            transition: transform 0.3s ease, opacity 0.3s ease;
            z-index: 10;
          }
          .popup.show {
            animation: scaleGlow 2s ease forwards;
          }
          @keyframes scaleGlow {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 0; box-shadow: 0 0 0 rgba(0, 255, 255, 0); }
            20% { transform: translate(-50%, -50%) scale(1); opacity: 1; box-shadow: 0 0 20px rgba(0, 255, 255, 0.7); }
            80% { transform: translate(-50%, -50%) scale(1); opacity: 1; box-shadow: 0 0 20px rgba(0, 255, 255, 0.7); }
            100% { transform: translate(-50%, -50%) scale(0); opacity: 0; box-shadow: 0 0 0 rgba(0, 255, 255, 0); }
          }
          /* Responsive Design */
          @media (max-width: 600px) {
            .card-container {
              width: 95%;
              height: 450px;
            }
            .thumbnail {
              width: 120px;
              height: 120px;
            }
            .label {
              font-size: 1em;
            }
            button {
              width: 100%;
              margin: 10px 0;
            }
          }
          @media (min-width: 601px) {
            .card-container {
              width: 400px;
              height: 500px;
            }
          }
        </style>
      </head>
      <body>
        <div class="card-container">
          <div class="card-front">
            <img class="thumbnail" src="${thumbnail}" alt="Teacher Thumbnail">
            <div class="label">𝗧𝗲𝗮𝗰𝗵𝗲𝗿 - ${teacher_name}</div>
            <div class="label">𝗖𝗹𝗮𝘀𝘀 𝗡𝗮𝗺𝗲 - ${class_name}</div>
          </div>
          <div class="card-back">
            <div class="label">𝗗𝗮𝘁𝗲 𝗼𝗳 𝗖𝗹𝗮𝘀𝘀 - ${formattedDate}${is_offline === 'true' ? ' (Offline)' : ''}</div>
            <button onclick="handleDownload('${class_url}', 'class')">CLICK TO DOWNLOAD CLASS</button>
            <button onclick="handleDownload('${slides_url}', 'slides')">CLICK TO DOWNLOAD SLIDES</button>
          </div>
        </div>
        <div id="popup" class="popup"></div>
        <script>
          function handleDownload(url, type) {
            if (url === 'Live Soon' || url === 'Class Cancelled') {
              const popup = document.getElementById('popup');
              popup.textContent = url === 'Live Soon' ? 'This class is Live Soon!' : 'This class is Cancelled!';
              popup.classList.add('show');
              setTimeout(() => {
                popup.classList.remove('show');
              }, 2000);
            } else {
              window.location.href = url;
            }
          }
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
  res.send('Welcome! Use /op with query params.');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
