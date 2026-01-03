const WebSocket = require("ws");
const http = require("http");

// Render requires an HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("WebSocket signaling server running");
});

const wss = new WebSocket.Server({ server });

let clients = [];

wss.on("connection", ws => {
  clients.push(ws);

  // First client becomes initiator
  const isInitiator = clients.length === 1;

  // 🔹 Send role to THIS client only
  ws.send(JSON.stringify({
    type: "role",
    initiator: isInitiator
  }));

  // 🔹 Notify all clients of peer count
  clients.forEach(c => {
    if (c.readyState === WebSocket.OPEN) {
      c.send(JSON.stringify({
        type: "peers",
        count: clients.length
      }));
    }
  });

  // 🔹 Relay signaling messages
  ws.on("message", msg => {
    clients.forEach(c => {
      if (c !== ws && c.readyState === WebSocket.OPEN) {
        c.send(msg);
      }
    });
  });

  ws.on("close", () => {
    clients = clients.filter(c => c !== ws);

    // Update peer count on disconnect
    clients.forEach(c => {
      if (c.readyState === WebSocket.OPEN) {
        c.send(JSON.stringify({
          type: "peers",
          count: clients.length
        }));
      }
    });
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () =>
  console.log("Signaling server running on port", PORT)
);
