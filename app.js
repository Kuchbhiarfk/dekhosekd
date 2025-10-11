// app.js (Updated with enhanced 3D animations, 3D buttons, adjusted sizes, and labeled text)
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

    // HTML template with advanced UI: more 3D effects, animations, 3D buttons, labeled text
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${class_name}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
            color: white;
            perspective: 1500px; /* Enhanced 3D space */
            overflow: hidden; /* Prevent scroll issues */
          }
          .container {
            text-align: center;
            background: rgba(255, 255, 255, 0.15);
            padding: 50px;
            border-radius: 30px;
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(15px);
            transform-style: preserve-3d;
            transform: rotateY(0deg) rotateX(0deg);
            transition: transform 0.6s ease-in-out;
            max-width: 450px;
            animation: glowPulse 2s infinite alternate ease-in-out;
          }
          .container:hover {
            transform: rotateY(15deg) rotateX(10deg) scale(1.05); /* Enhanced 3D tilt and scale on hover */
          }
          @keyframes glowPulse {
            0% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.2); }
            100% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.6); }
          }
          .thumbnail {
            width: 180px;
            height: 180px;
            border-radius: 50%;
            border: 8px solid rgba(255, 255, 255, 0.9);
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
            transform: translateZ(80px) rotate(0deg); /* Deeper 3D pop-out */
            transition: transform 0.4s ease;
            animation: rotateThumbnail 10s infinite linear; /* Rotating animation */
          }
          .thumbnail:hover {
            transform: translateZ(120px) scale(1.2) rotate(360deg); /* Enhanced zoom and full rotate on hover */
          }
          @keyframes rotateThumbnail {
            0% { transform: translateZ(80px) rotate(0deg); }
            100% { transform: translateZ(80px) rotate(360deg); }
          }
          .label {
            font-size: 1.4em;
            font-weight: bold;
            margin: 15px 0 5px;
            text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.6);
            transform: translateZ(40px); /* 3D depth for labels */
            animation: fadeInSlide 1s ease forwards;
          }
          .teacher-name {
            font-size: 1.6em; /* Slightly smaller than before */
          }
          .class-name, .class-date {
            font-size: 1.8em;
          }
          button {
            padding: 18px 35px;
            margin: 15px 10px;
            background: linear-gradient(135deg, #89ff00, #00bcd4);
            color: white;
            border: none;
            border-radius: 50px;
            cursor: pointer;
            font-size: 1.1em;
            font-weight: bold;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4), inset 0 -5px 10px rgba(0, 0, 0, 0.2); /* 3D button shadow */
            transition: all 0.4s ease;
            transform: translateZ(60px) perspective(200px) rotateX(0deg); /* 3D button effect */
          }
          button:hover {
            background: linear-gradient(135deg, #00bcd4, #89ff00);
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.5), inset 0 -10px 20px rgba(0, 0, 0, 0.3);
            transform: translateZ(90px) perspective(200px) rotateX(10deg) scale(1.1); /* Enhanced 3D lift and tilt */
          }
          button:active {
            transform: translateZ(50px) perspective(200px) rotateX(5deg) scale(0.95); /* Press effect */
          }
          @keyframes fadeInSlide {
            from { opacity: 0; transform: translateY(30px) translateZ(40px); }
            to { opacity: 1; transform: translateY(0) translateZ(40px); }
          }
          .container > * {
            animation: fadeInSlide 0.6s ease forwards;
          }
          /* Add particle background for extra flair */
          .particles {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            overflow: hidden;
          }
          .particle {
            position: absolute;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            animation: floatParticles linear infinite;
          }
          @keyframes floatParticles {
            0% { transform: translateY(0) translateZ(0); opacity: 1; }
            100% { transform: translateY(-100vh) translateZ(0); opacity: 0; }
          }
        </style>
      </head>
      <body>
        <div class="particles">
          <!-- Generate 20 particles for background animation -->
          <div class="particle" style="left: 10%; width: 5px; height: 5px; animation-duration: 10s; animation-delay: 0s;"></div>
          <div class="particle" style="left: 20%; width: 8px; height: 8px; animation-duration: 15s; animation-delay: 2s;"></div>
          <div class="particle" style="left: 30%; width: 6px; height: 6px; animation-duration: 12s; animation-delay: 1s;"></div>
          <div class="particle" style="left: 40%; width: 7px; height: 7px; animation-duration: 18s; animation-delay: 3s;"></div>
          <div class="particle" style="left: 50%; width: 5px; height: 5px; animation-duration: 14s; animation-delay: 0.5s;"></div>
          <div class="particle" style="left: 60%; width: 9px; height: 9px; animation-duration: 16s; animation-delay: 4s;"></div>
          <div class="particle" style="left: 70%; width: 4px; height: 4px; animation-duration: 11s; animation-delay: 2.5s;"></div>
          <div class="particle" style="left: 80%; width: 10px; height: 10px; animation-duration: 20s; animation-delay: 5s;"></div>
          <div class="particle" style="left: 90%; width: 6px; height: 6px; animation-duration: 13s; animation-delay: 1.5s;"></div>
          <div class="particle" style="left: 15%; width: 7px; height: 7px; animation-duration: 17s; animation-delay: 3.5s;"></div>
          <div class="particle" style="left: 25%; width: 5px; height: 5px; animation-duration: 10s; animation-delay: 0s;"></div>
          <div class="particle" style="left: 35%; width: 8px; height: 8px; animation-duration: 15s; animation-delay: 2s;"></div>
          <div class="particle" style="left: 45%; width: 6px; height: 6px; animation-duration: 12s; animation-delay: 1s;"></div>
          <div class="particle" style="left: 55%; width: 7px; height: 7px; animation-duration: 18s; animation-delay: 3s;"></div>
          <div class="particle" style="left: 65%; width: 5px; height: 5px; animation-duration: 14s; animation-delay: 0.5s;"></div>
          <div class="particle" style="left: 75%; width: 9px; height: 9px; animation-duration: 16s; animation-delay: 4s;"></div>
          <div class="particle" style="left: 85%; width: 4px; height: 4px; animation-duration: 11s; animation-delay: 2.5s;"></div>
          <div class="particle" style="left: 95%; width: 10px; height: 10px; animation-duration: 20s; animation-delay: 5s;"></div>
          <div class="particle" style="left: 5%; width: 6px; height: 6px; animation-duration: 13s; animation-delay: 1.5s;"></div>
          <div class="particle" style="left: 100%; width: 7px; height: 7px; animation-duration: 17s; animation-delay: 3.5s;"></div>
        </div>
        <div class="container">
          <img class="thumbnail" src="${thumbnail}" alt="Teacher Thumbnail">
          <div class="label teacher-name">𝗧𝗲𝗮𝗰𝗵𝗲𝗿 - ${teacher_name}</div>
          <div class="label class-name">𝗖𝗹𝗮𝘀𝘀 𝗡𝗮𝗺𝗲 - ${class_name}</div>
          <div class="label class-date">𝗗𝗮𝘁𝗲 𝗼𝗳 𝗖𝗹𝗮𝘀𝘀 - ${formattedDate}${is_offline === 'true' ? ' (Offline)' : ''}</div>
          <button onclick="handleDownload('${class_url}', 'class')">CLICK TO DOWNLOAD CLASS</button>
          <button onclick="handleDownload('${slides_url}', 'slides')">CLICK TO DOWNLOAD SLIDES</button>
        </div>
        <script>
          function handleDownload(url, type) {
            if (url === 'Live Soon' || url === 'Class Cancelled') {
              alert(url === 'Live Soon' ? 'This class is Live Soon!' : 'This class is Cancelled!');
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
