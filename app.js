// app.js (Updated with new date format and enhanced UI)
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

    // HTML template with enhanced UI (advanced CSS for 3D effects, animations, gradients)
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
            perspective: 1000px; /* Enable 3D space */
          }
          .container {
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
            transform-style: preserve-3d;
            transform: rotateY(0deg);
            transition: transform 0.5s ease;
            max-width: 400px;
          }
          .container:hover {
            transform: rotateY(10deg) rotateX(5deg); /* 3D tilt on hover */
          }
          .thumbnail {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            border: 5px solid rgba(255, 255, 255, 0.8);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
            transform: translateZ(50px); /* 3D pop-out effect */
            transition: transform 0.3s ease;
          }
          .thumbnail:hover {
            transform: translateZ(80px) scale(1.1); /* Zoom on hover */
          }
          h1 {
            font-size: 2em;
            margin: 15px 0 5px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
            transform: translateZ(30px); /* 3D depth */
          }
          h2 {
            font-size: 1.5em;
            margin: 10px 0;
            text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.4);
            transform: translateZ(20px);
          }
          p {
            font-size: 1.2em;
            margin: 10px 0 20px;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
            transform: translateZ(10px);
          }
          button {
            padding: 15px 30px;
            margin: 10px 5px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            border-radius: 50px;
            cursor: pointer;
            font-size: 1em;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
            transform: translateZ(40px); /* 3D button pop */
          }
          button:hover {
            background: linear-gradient(135deg, #764ba2, #667eea);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4);
            transform: translateZ(60px) scale(1.05);
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .container > * {
            animation: fadeIn 0.5s ease forwards;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <img class="thumbnail" src="${thumbnail}" alt="Teacher Thumbnail">
          <h1>${teacher_name}</h1>
          <h2>${class_name}</h2>
          <p>${formatDate(live_at_time)}${is_offline === 'true' ? ' (Offline)' : ''}</p>
          <button onclick="handleDownload('${class_url}', 'class')">CLICK TO DOWNLOAD CLASS</button>
          <button onclick="handleDownload('${slides_url}', 'slides')">CLICK TO DOWNLOAD SLIDES</button>
        </div>
        <script>
          function formatDate(dateStr) {
            try {
              // Replace +00:00 with Z for consistent parsing
              const normalizedDateStr = dateStr.replace(/\\+00:00$/, 'Z');
              const date = new Date(normalizedDateStr);
              if (isNaN(date)) {
                console.error('Invalid date format: ' + dateStr);
                return dateStr; // Fallback if invalid date
              }
              const day = date.getDate();
              const month = date.toLocaleString('en-US', { month: 'long' });
              const year = date.getFullYear();
              return \`\${day}-\${month}-\${year}\`;
            } catch (error) {
              console.error('Error parsing date: ' + dateStr, error);
              return dateStr; // Fallback to raw string
            }
          }

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
