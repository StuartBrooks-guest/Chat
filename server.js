const WebSocket = require("ws");
const http = require("http");

// Use Render-provided PORT
const PORT = process.env.PORT || 10000;

// Create HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("WebRTC signaling server running");
});

// Create WebSocket server
const wss = new WebSocket.Server({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  console.log("Upgrade request received:", req.url);

  wss.handleUpgrade(req, socket, head, ws => {
    wss.emit("connection", ws, req);
  });
});

let clients = [];

wss.on("connection", ws => {
  console.log("New WebSocket connection!");

  if (clients.length >= 2) {
    ws.close();
    return;
  }

  clients.push(ws);

  const isInitiator = clients.length === 1;

  ws.send(JSON.stringify({
    type: "role",
    initiator: isInitiator
  }));

  broadcast({
    type: "peers",
    count: clients.length
  });

  ws.on("message", msg => {
    clients.forEach(c => {
      if (c !== ws && c.readyState === WebSocket.OPEN) {
        c.send(msg);
      }
    });
  });

  ws.on("close", () => {
    console.log("WebSocket closed for a client.");
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

// Listen on all network interfaces (0.0.0.0) for Render
server.listen(PORT, "0.0.0.0", () => {
  console.log("Signaling server running on port", PORT);
});
