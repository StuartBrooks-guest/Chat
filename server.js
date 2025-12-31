const WebSocket = require('ws');
const http = require('http');

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

// Use Railway-assigned port
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
