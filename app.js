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

    // New HTML template: Sleek card with space-blue/orange-gold palette, orbit thumbnail, ripple buttons, center glow popup
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>${class_name}</title>
        <style>
          body {
            font-family: 'Montserrat', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #0a0a23, #1b1b4f); /* Deep space blue */
            color: #ffffff;
            perspective: 1000px;
            overflow-y: auto;
          }
          .container {
            background: rgba(255, 255, 255, 0.1);
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 147, 41, 0.2); /* Orange glow */
            backdrop-filter: blur(10px);
            transform-style: preserve-3d;
            transform: translateZ(20px);
            transition: transform 0.4s ease, box-shadow 0.4s ease;
            width: 90%;
            max-width: 400px;
            margin: 15px;
            animation: cardEntry 1s ease forwards;
          }
          .container:hover {
            transform: translateZ(30px);
            box-shadow: 0 12px 36px rgba(0, 0, 0, 0.4), 0 0 30px rgba(255, 147, 41, 0.3);
          }
          @keyframes cardEntry {
            from { opacity: 0; transform: translateY(50px) translateZ(20px); }
            to { opacity: 1; transform: translateY(0) translateZ(20px); }
          }
          .thumbnail {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            border: 3px solid #ff9329; /* Vibrant orange */
            box-shadow: 0 0 15px #ff9329;
            transform: translateZ(40px);
            transition: transform 0.5s ease;
            animation: orbitThumbnail 6s infinite linear; /* Orbital spin */
          }
          .thumbnail:hover {
            transform: translateZ(50px) scale(1.05);
          }
          @keyframes orbitThumbnail {
            0% { transform: translateZ(40px) rotate(0deg); }
            100% { transform: translateZ(40px) rotate(360deg); }
          }
          .label {
            font-size: 1.1em;
            font-weight: 600;
            margin: 10px 0;
            color: #ffd700; /* Gold text */
            text-shadow: 0 0 6px rgba(255, 215, 0, 0.5);
            transform: translateZ(15px);
            animation: textSlideIn 0.8s ease forwards;
            opacity: 0;
          }
          .label:nth-child(2) { animation-delay: 0.1s; }
          .label:nth-child(3) { animation-delay: 0.2s; }
          .label:nth-child(4) { animation-delay: 0.3s; }
          @keyframes textSlideIn {
            from { opacity: 0; transform: translateZ(15px) translateX(-20px); }
            to { opacity: 1; transform: translateZ(15px) translateX(0); }
          }
          button {
            position: relative;
            padding: 14px 28px;
            margin: 8px 5px;
            background: linear-gradient(135deg, #ff6d00, #ffab40); /* Orange to gold */
            color: #ffffff;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            font-size: 1em;
            font-weight: 600;
            box-shadow: 0 0 10px #ff6d00;
            transition: all 0.3s ease;
            transform: translateZ(20px);
            overflow: hidden;
            width: 100%;
            max-width: 280px;
            text-transform: uppercase;
          }
          button:hover {
            box-shadow: 0 0 20px #ff6d00;
            transform: translateZ(30px) scale(1.03);
          }
          button::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            transition: width 0.6s ease, height 0.6s ease;
            z-index: 0;
          }
          button:hover::before {
            width: 300px;
            height: 300px; /* Ripple effect on hover */
          }
          button span {
            position: relative;
            z-index: 1;
          }
          @keyframes ripple {
            to { width: 300px; height: 300px; opacity: 0; }
          }
          /* Center Glow Popup */
          .popup {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0);
            background: rgba(10, 10, 35, 0.9); /* Dark space blue */
            color: #ffd700;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 0 20px rgba(255, 147, 41, 0.6);
            font-size: 1.1em;
            max-width: 80%;
            opacity: 0;
            transition: transform 0.3s ease, opacity 0.3s ease;
            z-index: 1000;
            border: 2px solid #ff6d00;
          }
          .popup.show {
            animation: scaleGlow 2s ease forwards;
          }
          @keyframes scaleGlow {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 0; box-shadow: 0 0 0 rgba(255, 147, 41, 0); }
            20% { transform: translate(-50%, -50%) scale(1); opacity: 1; box-shadow: 0 0 30px rgba(255, 147, 41, 0.8); }
            80% { transform: translate(-50%, -50%) scale(1); opacity: 1; box-shadow: 0 0 30px rgba(255, 147, 41, 0.8); }
            100% { transform: translate(-50%, -50%) scale(0); opacity: 0; box-shadow: 0 0 0 rgba(255, 147, 41, 0); }
          }
          /* Responsive Design */
          @media (max-width: 600px) {
            .container {
              padding: 20px;
              width: 95%;
              margin: 10px;
            }
            .thumbnail {
              width: 100px;
              height: 100px;
            }
            .label {
              font-size: 1em;
            }
            button {
              padding: 12px 20px;
              font-size: 0.95em;
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
              padding: 25px;
              max-width: 400px;
            }
            button {
              width: auto;
              margin: 8px 5px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <img class="thumbnail" src="${thumbnail}" alt="Teacher Thumbnail">
          <div class="label">𝗧𝗲𝗮𝗰𝗵𝗲𝗿 - ${teacher_name}</div>
          <div class="label">𝗖𝗹𝗮𝘀𝘀 𝗡𝗮𝗺𝗲 - ${class_name}</div>
          <div class="label">𝗗𝗮𝘁𝗲 𝗼𝗳 �𝗖𝗹𝗮𝘀𝘀 - ${formattedDate}${is_offline === 'true' ? ' (Offline)' : ''}</div>
          <button><span>Click to Download Class</span></button>
          <button><span>Click to Download Slides</span></button>
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
          // Attach click handlers to buttons
          document.querySelectorAll('button').forEach((btn, index) => {
            btn.addEventListener('click', () => {
              const url = index === 0 ? '${class_url}' : '${slides_url}';
              handleDownload(url, index === 0 ? 'class' : 'slides');
            });
          });
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
