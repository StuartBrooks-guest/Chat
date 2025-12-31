const WebSocket = require('ws');
const http = require('http');

// Minimal HTTP server (Render needs HTTP to assign a URL)
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('WebSocket signaling server running');
});

const wss = new WebSocket.Server({ server });

let clients = [];
wss.on('connection', ws => {
  clients.push(ws);

  ws.on('message', msg => {
    clients.forEach(c => {
      if (c !== ws && c.readyState === WebSocket.OPEN) {
        c.send(msg);
      }
    });
  });

  ws.on('close', () => {
    clients = clients.filter(c => c !== ws);
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
