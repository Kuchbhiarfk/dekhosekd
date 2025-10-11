// app.js (Redesigned UI: Clean modern card with soft pastel colors, improved responsiveness, fixed zoom issues by optimizing sizes and viewport)
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

    // New HTML template: Modern card design with pastel colors, subtle shadows, no forced zoom (optimized for fit), new animations (fade-slide for elements)
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"> <!-- Prevent user zoom, ensure fit -->
        <title>${class_name}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh; /* Ensure full height without zoom out */
            margin: 0;
            background: linear-gradient(135deg, #e0f7fa, #b2ebf2); /* Soft pastel blue gradient */
            color: #424242;
            perspective: 800px;
            overflow-y: auto; /* Allow scroll if needed, no overflow hidden */
          }
          .container {
            background: #ffffff;
            padding: 25px;
            border-radius: 16px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transform-style: preserve-3d;
            transform: rotateX(2deg) rotateY(2deg);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            width: 90%;
            max-width: 450px;
            margin: 20px; /* Add margin for better centering without zoom */
            animation: fadeSlideIn 1s ease forwards; /* New fade-slide animation */
          }
          .container:hover {
            transform: rotateX(0deg) rotateY(0deg);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          }
          @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateY(50px) rotateX(2deg) rotateY(2deg); }
            to { opacity: 1; transform: translateY(0) rotateX(2deg) rotateY(2deg); }
          }
          .thumbnail {
            width: 140px;
            height: 140px;
            border-radius: 50%;
            border: 4px solid #81d4fa; /* Pastel blue border */
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            transform: translateZ(40px);
            transition: transform 0.3s ease;
            animation: gentleFloat 3s infinite ease-in-out; /* New gentle float animation */
          }
          .thumbnail:hover {
            transform: translateZ(60px) scale(1.05);
          }
          @keyframes gentleFloat {
            0%, 100% { transform: translateZ(40px) translateY(0); }
            50% { transform: translateZ(40px) translateY(-5px); }
          }
          .label {
            font-size: 1.2em;
            font-weight: 600;
            margin: 12px 0;
            color: #0277bd; /* Deeper blue for text */
            transform: translateZ(10px);
            animation: textFadeIn 0.8s ease forwards 0.3s; /* Delayed fade-in */
            opacity: 0;
          }
          button {
            padding: 12px 24px;
            margin: 8px 4px;
            background: linear-gradient(135deg, #4fc3f7, #0288d1); /* Pastel to deep blue */
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1em;
            font-weight: 500;
            box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            transform: translateZ(20px);
          }
          button:hover {
            background: linear-gradient(135deg, #0288d1, #4fc3f7);
            box-shadow: 0 5px 10px rgba(0, 0, 0, 0.15);
            transform: translateZ(30px) scale(1.02);
          }
          button:active {
            transform: translateZ(15px) scale(0.98);
          }
          @keyframes textFadeIn {
            from { opacity: 0; transform: translateZ(10px) translateX(-20px); }
            to { opacity: 1; transform: translateZ(10px) translateX(0); }
          }
          /* Custom Popup: Slide from bottom with fade */
          .popup {
            position: fixed;
            bottom: -100px;
            left: 50%;
            transform: translateX(-50%) translateZ(50px) perspective(300px) rotateX(10deg);
            background: rgba(255, 255, 255, 0.95);
            color: #424242;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
            font-size: 1em;
            max-width: 80%;
            opacity: 0;
            transition: opacity 0.3s ease;
            border: 1px solid #81d4fa;
          }
          .popup.show {
            animation: bottomSlideInOut 2s ease forwards;
          }
          @keyframes bottomSlideInOut {
            0% { bottom: -100px; opacity: 0; transform: translateX(-50%) translateZ(50px) rotateX(10deg); }
            20% { bottom: 20px; opacity: 1; transform: translateX(-50%) translateZ(50px) rotateX(0deg); }
            80% { bottom: 20px; opacity: 1; transform: translateX(-50%) translateZ(50px) rotateX(0deg); }
            100% { bottom: -100px; opacity: 0; transform: translateX(-50%) translateZ(50px) rotateX(10deg); }
          }
          /* Responsive Design: Adjust for mobile/desktop */
          @media (max-width: 600px) {
            body {
              align-items: flex-start; /* Align to top on mobile to avoid zoom out */
              padding-top: 20px;
            }
            .container {
              padding: 20px;
              width: 85%;
              margin: 10px auto;
            }
            .thumbnail {
              width: 120px;
              height: 120px;
            }
            .label {
              font-size: 1.1em;
            }
            button {
              width: 100%;
              margin: 8px 0;
              padding: 10px;
              font-size: 0.95em;
            }
            .popup {
              max-width: 90%;
              padding: 12px 20px;
              font-size: 0.95em;
            }
          }
          @media (min-width: 601px) {
            .container {
              padding: 30px;
              width: 400px;
            }
            button {
              width: auto;
              padding: 12px 24px;
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
          <button onclick="handleDownload('${class_url}', 'class')">CLICK TO DOWNLOAD CLASS</button>
          <button onclick="handleDownload('${slides_url}', 'slides')">CLICK TO DOWNLOAD SLIDES</button>
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
