const http = require("http");
const PORT = process.env.PORT || 8080;
let c = 0;

const server = http.createServer(function (req, res) {
  if (req.url === "/" && req.method === "GET") {
    c++;
    //console.log(`${req.method} ${req.url} - C: ${c}`);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.write(JSON.stringify({ count: c }));
  } else {
    //console.log(`${req.method} ${req.url} - Invalid request`);
    res.writeHead(400, { "Content-Type": "application/json" });
    res.write(JSON.stringify({ error: "Invalid request" }));
  }
  res.end();
});

server.on("error", function (error, req, res) {
  console.error("Server error:", error);
  if (res) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.write(JSON.stringify({ error: "Internal Server Error" }));
    res.end();
  }
});

server.listen(PORT, function () {
  console.log(`Server listening on port: ${PORT}`);
});

/*

node:events:492 Uncaught Error: write EPIPE
    at afterWriteDispatched (node:internal/stream_base_commons:160:15)
    at writeGeneric (node:internal/stream_base_commons:151:3)
    at Socket._writeGeneric (node:net:931:11)
    at Socket._write (node:net:943:8)
    at writeOrBuffer (node:internal/streams/writable:392:12)
    at _write (node:internal/streams/writable:333:10)
    at Writable.write (node:internal/streams/writable:337:10)
    at console.value (node:internal/console/constructor:305:16)
    at console.log (node:internal/console/constructor:380:26)
    at Server.<anonymous> (/Users/nameUser/Desktop/server_nodejs/index.js:12:13)
Emitted 'error' event on Socket instance at:
    at emitErrorNT (node:internal/streams/destroy:151:8)
    at emitErrorCloseNT (node:internal/streams/destroy:116:3)
    at process.processTicksAndRejections (node:internal/process/task_queues:82:21)

*/