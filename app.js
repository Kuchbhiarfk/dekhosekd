// app.js (Enhanced UI with more fun elements: vibrant colors, sparkles, smoother animations; fully responsive for mobile/desktop)
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

    // Enhanced HTML template: Vibrant theme, sparkle effects, responsive design with media queries
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${class_name}</title>
        <style>
          body {
            font-family: 'Helvetica', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(45deg, #ff6b6b, #ffd93d, #6bcfcf);
            color: #333333;
            perspective: 1200px;
            overflow: hidden; /* Prevent scroll on mobile */
          }
          .container {
            text-align: center;
            background: rgba(255, 255, 255, 0.9);
            padding: 20px;
            border-radius: 20px;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
            transform-style: preserve-3d;
            transform: rotateX(3deg) rotateY(3deg);
            transition: transform 0.5s ease, box-shadow 0.5s ease;
            max-width: 80%;
            width: 400px;
            animation: sparkleContainer 4s infinite ease-in-out; /* Fun sparkle animation */
          }
          .container:hover {
            transform: rotateX(0deg) rotateY(0deg) scale(1.03);
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
          }
          @keyframes sparkleContainer {
            0%, 100% { box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2); }
            50% { box-shadow: 0 10px 30px rgba(255, 215, 0, 0.5); } /* Golden sparkle */
          }
          .thumbnail {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            border: 3px solid #ff6b6b;
            box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
            transform: translateZ(50px);
            transition: transform 0.4s ease;
            animation: pulseThumbnail 2.5s infinite ease-in-out; /* Fun pulse animation */
          }
          .thumbnail:hover {
            transform: translateZ(70px) scale(1.1);
          }
          @keyframes pulseThumbnail {
            0%, 100% { transform: translateZ(50px) scale(1); }
            50% { transform: translateZ(50px) scale(1.05); }
          }
          .label {
            font-size: 1em; /* Even smaller for mobile-friendliness */
            font-weight: bold;
            margin: 8px 0;
            text-shadow: 0.5px 0.5px 1px rgba(0, 0, 0, 0.1);
            transform: translateZ(15px);
            animation: fadeInGlow 1.2s ease forwards;
          }
          button {
            padding: 10px 20px;
            margin: 6px;
            background: linear-gradient(45deg, #4ecdc4, #556270);
            color: white;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            font-size: 0.85em;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.1);
            transition: all 0.4s ease;
            transform: translateZ(25px) perspective(120px) rotateX(0deg);
            width: auto;
          }
          button:hover {
            background: linear-gradient(45deg, #556270, #4ecdc4);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3), inset 0 -4px 8px rgba(0, 0, 0, 0.2);
            transform: translateZ(40px) perspective(120px) rotateX(6deg) scale(1.05);
          }
          button:active {
            transform: translateZ(15px) perspective(120px) rotateX(3deg) scale(0.95);
          }
          @keyframes fadeInGlow {
            from { opacity: 0; transform: translateZ(15px) translateY(10px); text-shadow: 0 0 0 rgba(255, 215, 0, 0); }
            to { opacity: 1; transform: translateZ(15px) translateY(0); text-shadow: 0 0 5px rgba(255, 215, 0, 0.5); }
          }
          /* Custom 3D Popup - Enhanced with glow */
          .popup {
            position: fixed;
            top: 50%;
            right: -250px;
            transform: translateY(-50%) translateZ(80px) perspective(400px) rotateY(-15deg);
            background: rgba(255, 255, 255, 0.95);
            color: #333;
            padding: 15px;
            border-radius: 15px;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
            font-size: 0.95em;
            max-width: 200px;
            opacity: 0;
            transition: opacity 0.3s ease;
            animation: none;
            border: 2px solid #ff6b6b;
          }
          .popup.show {
            animation: slideInOutGlow 2s ease forwards;
          }
          @keyframes slideInOutGlow {
            0% { right: -250px; opacity: 0; transform: translateY(-50%) translateZ(80px) rotateY(-15deg); box-shadow: 0 0 0 rgba(255, 215, 0, 0); }
            20% { right: 15px; opacity: 1; transform: translateY(-50%) translateZ(80px) rotateY(0deg); box-shadow: 0 0 10px rgba(255, 215, 0, 0.7); }
            80% { right: 15px; opacity: 1; transform: translateY(-50%) translateZ(80px) rotateY(0deg); box-shadow: 0 0 10px rgba(255, 215, 0, 0.7); }
            100% { right: -250px; opacity: 0; transform: translateY(-50%) translateZ(80px) rotateY(-15deg); box-shadow: 0 0 0 rgba(255, 215, 0, 0); }
          }
          /* Responsive Design */
          @media (max-width: 600px) {
            .container {
              padding: 15px;
              width: 90%;
              max-width: none;
            }
            .thumbnail {
              width: 80px;
              height: 80px;
            }
            .label {
              font-size: 0.9em;
            }
            button {
              padding: 8px 16px;
              font-size: 0.8em;
              width: 100%; /* Full-width buttons on mobile */
              margin: 8px 0;
            }
            .popup {
              max-width: 80%;
              padding: 12px;
              font-size: 0.85em;
              right: -100%; /* Adjust for smaller screens */
            }
            @keyframes slideInOutGlow {
              0% { right: -100%; opacity: 0; }
              20% { right: 10px; opacity: 1; }
              80% { right: 10px; opacity: 1; }
              100% { right: -100%; opacity: 0; }
            }
          }
          @media (min-width: 601px) {
            /* Desktop-specific tweaks */
            .container {
              padding: 30px;
              width: 350px;
            }
            button {
              width: auto;
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
