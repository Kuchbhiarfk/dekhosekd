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
      live_at_time,
      user_first_name,
      user_id
    } = req.query;

    // Basic validation: ensure all params are provided
    if (!class_name || !teacher_name || !thumbnail || !class_url || !slides_url || !live_at_time || !user_first_name || !user_id) {
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

    // HTML template with user details box, refined UI, and responsive design
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
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(45deg, #1a237e, #303f9f, #3f51b5);
            color: #ffffff;
            perspective: 1200px;
          }
          .container {
            text-align: center;
            background: rgba(255, 255, 255, 0.2);
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(8px);
            transform-style: preserve-3d;
            transform: rotateX(5deg) rotateY(5deg);
            max-width: 300px;
            width: 90%;
            border: 3px solid rgba(255, 255, 255, 0.5);
            box-sizing: border-box;
            animation: waveContainer 3s infinite ease-in-out;
          }
          .container:hover {
            transform: rotateX(0deg) rotateY(0deg);
          }
          .user-box {
            background: linear-gradient(45deg, #4a148c, #7b1fa2); /* Different background */
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
            margin-bottom: 20px;
            transform: translateZ(30px);
            animation: fadeIn 1.5s ease forwards;
          }
          @keyframes waveContainer {
            0%, 100% { transform: rotateX(5deg) rotateY(5deg) translateY(0); }
            50% { transform: rotateX(5deg) rotateY(5deg) translateY(-6px); }
          }
          .thumbnail {
            width: 80px;
            height: 80px;
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
            font-size: 0.95em;
            font-weight: bold;
            margin: 8px 0;
            text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
            transform: translateZ(20px);
            animation: fadeIn 1.5s ease forwards;
          }
          button {
            padding: 8px 15px;
            margin: 5px;
            background: linear-gradient(45deg, #ff4081, #f50057);
            color: white;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            font-size: 0.8em;
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3), inset 0 -3px 6px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
            transform: translateZ(30px) perspective(150px) rotateX(0deg);
          }
          button:hover {
            background: linear-gradient(45deg, #f50057, #ff4081);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4), inset 0 -6px 12px rgba(0, 0, 0, 0.3);
            transform: translateZ(50px) perspective(150px) rotateX(8deg);
          }
          button:active {
            transform: translateZ(20px) perspective(150px) rotateX(4deg);
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
            font-size: 0.85em;
            max-width: 180px;
            opacity: 0;
            transition: opacity 0.3s ease;
            animation: none;
          }
          .popup.live-soon {
            background: rgba(0, 128, 0, 0.9); /* Green for Live Soon */
          }
          .popup.cancelled {
            background: rgba(255, 0, 0, 0.9); /* Red for Class Cancelled */
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
          /* Responsive adjustments */
          @media (max-width: 600px) {
            .container {
              padding: 15px;
              max-width: 260px;
            }
            .user-box {
              padding: 10px;
              margin-bottom: 15px;
            }
            .thumbnail {
              width: 70px;
              height: 70px;
            }
            .label {
              font-size: 0.85em;
            }
            button {
              padding: 7px 12px;
              font-size: 0.75em;
            }
            .popup {
              max-width: 160px;
              padding: 10px;
              font-size: 0.8em;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="user-box">
            <div class="label">Name - ${user_first_name}</div>
            <div class="label">User Id - ${user_id}</div>
          </div>
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
              popup.className = 'popup ' + (url === 'Live Soon' ? 'live-soon' : 'cancelled');
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
