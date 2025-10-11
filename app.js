// app.js
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

    // HTML template with embedded JS for popup logic
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${class_name}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f0f0f0;
          }
          .container {
            text-align: center;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          img {
            max-width: 200px;
            border-radius: 50%;
          }
          h1, h2, p {
            margin: 10px 0;
          }
          button {
            padding: 10px 20px;
            margin: 10px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          button:hover {
            background-color: #0056b3;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <img src="${thumbnail}" alt="Teacher Thumbnail">
          <h1>${teacher_name}</h1>
          <h2>${class_name}</h2>
          <p>${formatDate(live_at_time)}${is_offline === 'true' ? ' (Offline)' : ''}</p>
          <button onclick="handleDownload('${class_url}', 'class')">CLICK TO DOWNLOAD CLASS</button>
          <button onclick="handleDownload('${slides_url}', 'slides')">CLICK TO DOWNLOAD SLIDES</button>
        </div>
        <script>
          function formatDate(dateStr) {
            const date = new Date(dateStr);
            if (isNaN(date)) return dateStr; // Fallback if invalid date
            return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
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

function formatDate(dateStr) {
  try {
    const date = new Date(dateStr);
    if (isNaN(date)) {
      console.error(`Invalid date format: ${dateStr}`);
      return dateStr; // Fallback to raw string
    }
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  } catch (error) {
    console.error(`Error parsing date: ${dateStr}`, error);
    return dateStr; // Fallback to raw string
  }
}
