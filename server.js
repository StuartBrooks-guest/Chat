const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });
let clients = [];

wss.on("connection", ws => {
  clients.push(ws);

  ws.on("message", msg => {
    for (const c of clients) {
      if (c !== ws && c.readyState === WebSocket.OPEN) {
        c.send(msg);
      }
    }
  });

  ws.on("close", () => {
    clients = clients.filter(c => c !== ws);
  });
});
