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

    // Enhanced HTML template: Single neon-glow card, vibrant colors, obvious buttons, user-friendly layout
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>${class_name}</title>
        <style>
          body {
            font-family: 'Roboto', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #1a0033, #330066); /* Deep neon purple */
            color: #ffffff;
            perspective: 1000px;
            overflow-y: auto;
          }
          .container {
            background: rgba(255, 255, 255, 0.08);
            padding: 30px;
            border-radius: 20px;
            box-shadow: 0 0 20px rgba(255, 0, 255, 0.3), 0 0 40px rgba(0, 255, 255, 0.2);
            backdrop-filter: blur(12px);
            transform-style: preserve-3d;
            transform: translateZ(20px);
            transition: transform 0.4s ease, box-shadow 0.4s ease;
            width: 90%;
            max-width: 450px;
            margin: 20px;
            animation: neonGlow 2s infinite alternate ease-in-out;
          }
          .container:hover {
            transform: translateZ(30px);
            box-shadow: 0 0 30px rgba(255, 0, 255, 0.5), 0 0 60px rgba(0, 255, 255, 0.4);
          }
          @keyframes neonGlow {
            0% { box-shadow: 0 0 20px rgba(255, 0, 255, 0.3), 0 0 40px rgba(0, 255, 255, 0.2); }
            100% { box-shadow: 0 0 30px rgba(255, 0, 255, 0.5), 0 0 60px rgba(0, 255, 255, 0.4); }
          }
          .thumbnail {
            width: 130px;
            height: 130px;
            border-radius: 50%;
            border: 3px solid #ff00ff; /* Neon pink */
            box-shadow: 0 0 15px #ff00ff;
            transform: translateZ(40px);
            transition: transform 0.3s ease;
            animation: bounceGlow 2s infinite ease-in-out;
          }
          .thumbnail:hover {
            transform: translateZ(50px) scale(1.05);
          }
          @keyframes bounceGlow {
            0%, 100% { transform: translateZ(40px) translateY(0); box-shadow: 0 0 15px #ff00ff; }
            50% { transform: translateZ(40px) translateY(-5px); box-shadow: 0 0 25px #ff00ff; }
          }
          .label {
            font-size: 1.2em;
            font-weight: 700;
            margin: 10px 0;
            color: #00ffff; /* Neon cyan */
            text-shadow: 0 0 5px #00ffff;
            transform: translateZ(15px);
            animation: slideInText 1s ease forwards;
          }
          button {
            padding: 15px 30px;
            margin: 10px 5px;
            background: linear-gradient(135deg, #ff00ff, #00f0ff); /* Neon pink to cyan */
            color: #ffffff;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-size: 1.1em;
            font-weight: 600;
            box-shadow: 0 0 15px #ff00ff, inset 0 -3px 6px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
            transform: translateZ(25px);
            width: 100%;
            max-width: 300px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          button:hover {
            background: linear-gradient(135deg, #00f0ff, #ff00ff);
            box-shadow: 0 0 25px #00f0ff;
            transform: translateZ(35px) scale(1.03);
          }
          button:active {
            transform: translateZ(20px) scale(0.98);
          }
          @keyframes slideInText {
            from { opacity: 0; transform: translateZ(15px) translateX(-30px); }
            to { opacity: 1; transform: translateZ(15px) translateX(0); }
          }
          /* Center Scale Popup with Enhanced Neon Glow */
          .popup {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0);
            background: rgba(0, 0, 0, 0.85);
            color: #00ffff;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.6), 0 0 40px rgba(255, 0, 255, 0.4);
            font-size: 1.1em;
            max-width: 80%;
            opacity: 0;
            transition: transform 0.3s ease, opacity 0.3s ease;
            z-index: 1000;
            border: 2px solid #ff00ff;
          }
          .popup.show {
            animation: scaleNeonGlow 2s ease forwards;
          }
          @keyframes scaleNeonGlow {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 0; box-shadow: 0 0 0 rgba(0, 255, 255, 0); }
            20% { transform: translate(-50%, -50%) scale(1); opacity: 1; box-shadow: 0 0 30px rgba(0, 255, 255, 0.8); }
            80% { transform: translate(-50%, -50%) scale(1); opacity: 1; box-shadow: 0 0 30px rgba(0, 255, 255, 0.8); }
            100% { transform: translate(-50%, -50%) scale(0); opacity: 0; box-shadow: 0 0 0 rgba(0, 255, 255, 0); }
          }
          /* Responsive Design */
          @media (max-width: 600px) {
            .container {
              padding: 20px;
              width: 95%;
              margin: 10px;
            }
            .thumbnail {
              width: 110px;
              height: 110px;
            }
            .label {
              font-size: 1.1em;
            }
            button {
              padding: 12px 20px;
              font-size: 1em;
              margin: 8px 0;
            }
            .popup {
              max-width: 90%;
              padding: 15px;
              font-size: 1em;
            }
          }
          @media (min-width: 601px) {
            .container {
              padding: 30px;
              max-width: 450px;
            }
            button {
              width: auto;
              margin: 10px 5px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <img class="thumbnail" src="${thumbnail}" alt="Teacher Thumbnail">
          <div class="label">𝗧𝗲𝗮𝗰𝗵𝗲𝗿 - ${teacher_name}</div>
          <div class="label">𝗖𝗹𝗮𝘀𝘀 𝗡𝗮𝗺𝗲 - ${class_name}</div>
          <div class="label">𝗗𝗮𝘁𝗲 𝗼𝗳 𝗖𝗹𝗮𝘀𝘀 - ${formattedDate}${is_offline === 'true' ? ' (Offline)' : ''}</div>
          <button onclick="handleDownload('${class_url}', 'class')">Click to Download Class</button>
          <button onclick="handleDownload('${slides_url}', 'slides')">Click to Download Slides</button>
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
