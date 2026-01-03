const WebSocket = require("ws");
const http = require("http");

// Use Render-provided PORT
const PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("WebRTC signaling server running");
});

const wss = new WebSocket.Server({ server });

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

server.listen(PORT, () => {
  console.log("Signaling server running on port", PORT);
});
