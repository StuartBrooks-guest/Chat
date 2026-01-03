const WebSocket = require("ws");
const http = require("http");

// Render requires an HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("WebRTC signaling server running");
});

const wss = new WebSocket.Server({ server });

let clients = [];

wss.on("connection", ws => {
  // Allow only 2 peers
  if (clients.length >= 2) {
    ws.close();
    return;
  }

  clients.push(ws);

  const isInitiator = clients.length === 1;

  // Send role to this client only
  ws.send(JSON.stringify({
    type: "role",
    initiator: isInitiator
  }));

  // Notify peer count
  broadcast({
    type: "peers",
    count: clients.length
  });

  ws.on("message", msg => {
    // Relay signaling messages to the other peer
    clients.forEach(c => {
      if (c !== ws && c.readyState === WebSocket.OPEN) {
        c.send(msg);
      }
    });
  });

  ws.on("close", () => {
    clients = clients.filter(c => c !== ws);

    broadcast({
      type: "peers",
      count: clients.length
    });
  });
});

function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach(c => {
    if (c.readyState === WebSocket.OPEN) {
      c.send(message);
    }
  });
}

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log("Signaling server running on port", PORT);
});
