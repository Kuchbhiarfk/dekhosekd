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

    // HTML template with refined UI: better box, responsive, no zoom
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
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(180deg, #1b263b, #2c3e50);
            color: #ffffff;
            perspective: 1000px;
          }
          .container {
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 12px;
            border: 2px solid linear-gradient(45deg, #00e5ff, #b388ff); /* Subtle gradient border */
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(6px);
            transform-style: preserve-3d;
            transform: rotateX(3deg) rotateY(3deg);
            transition: transform 0.3s ease;
            width: 90%;
            max-width: 360px; /* Smaller for mobile */
            animation: gentleWave 4s infinite ease-in-out;
          }
          .container:hover {
            transform: rotateX(0deg) rotateY(0deg); /* No scale, just flatten */
          }
          @keyframes gentleWave {
            0%, 100% { transform: rotateX(3deg) rotateY(3deg) translateY(0); }
            50% { transform: rotateX(3deg) rotateY(3deg) translateY(-5px); }
          }
          .thumbnail {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            border: 3px solid #00e5ff;
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
            transform: translateZ(40px);
            transition: transform 0.3s ease;
            animation: softBounce 3s infinite ease-in-out;
          }
          .thumbnail:hover {
            transform: translateZ(50px); /* Lift only, no scale */
          }
          @keyframes softBounce {
            0%, 100% { transform: translateZ(40px) translateY(0); }
            50% { transform: translateZ(40px) translateY(-4px); }
          }
          .label {
            font-size: 0.95em; /* Smaller text for elegance */
            font-weight: bold;
            margin: 8px 0;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.4);
            transform: translateZ(15px);
            animation: fadeIn 1.2s ease forwards;
          }
          button {
            padding: 10px 20px;
            margin: 6px;
            background: linear-gradient(45deg, #00e5ff, #b388ff);
            color: white;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            font-size: 0.85em;
            font-weight: bold;
            box-shadow: 0 5px 10px rgba(0, 0, 0, 0.3), inset 0 -2px 5px rgba(0, 0, 0, 0.15);
            transition: all 0.3s ease;
            transform: translateZ(25px) perspective(100px) rotateX(0deg);
          }
          button:hover {
            box-shadow: 0 8px 15px rgba(0, 0, 0, 0.4), inset 0 -4px 8px rgba(0, 0, 0, 0.2);
            transform: translateZ(35px) perspective(100px) rotateX(5deg); /* 3D lift and tilt */
          }
          button:active {
            transform: translateZ(15px) perspective(100px) rotateX(2deg);
          }
          .popup {
            position: fixed;
            top: 50%;
            right: -250px;
            transform: translateY(-50%) translateZ(80px) perspective(400px) rotateY(-15deg);
            background: rgba(0, 0, 0, 0.85);
            color: #00e5ff;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
            font-size: 0.9em;
            max-width: 200px;
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          .popup.show {
            animation: slideInOut 2s ease forwards;
          }
          @keyframes slideInOut {
            0% { right: -250px; opacity: 0; transform: translateY(-50%) translateZ(80px) rotateY(-15deg); }
            20% { right: 10px; opacity: 1; transform: translateY(-50%) translateZ(80px) rotateY(0deg); }
            80% { right: 10px; opacity: 1; transform: translateY(-50%) translateZ(80px) rotateY(0deg); }
            100% { right: -250px; opacity: 0; transform: translateY(-50%) translateZ(80px) rotateY(-15deg); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateZ(15px) translateY(10px); }
            to { opacity: 1; transform: translateZ(15px) translateY(0); }
          }
          /* Responsive adjustments */
          @media (min-width: 768px) {
            .container {
              padding: 30px;
              max-width: 400px; /* Slightly larger for desktop */
            }
            .thumbnail {
              width: 120px;
              height: 120px;
            }
            .label {
              font-size: 1.1em;
            }
            button {
              padding: 12px 25px;
              font-size: 0.95em;
            }
            .popup {
              max-width: 250px;
              padding: 20px;
              font-size: 1em;
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
