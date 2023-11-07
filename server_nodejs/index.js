const http = require("http");

const PORT = process.env.PORT || 8080;
let c = 0;

const server = http.createServer(function (req, res) {
  const url = req.url;
  const method = req.method;

  if (url === "/" && method === "GET") {
    c++;
    //console.log(`${method} ${req.url} - C: ${c}`);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.write(JSON.stringify({ count: c }));
    res.end();
  } else {
    //console.log(`${method} ${req.url} - Invalid request`);
    res.writeHead(400, { "Content-Type": "application/json" });
    res.write(JSON.stringify({ error: "Invalid request" }));
    res.end();
  }
});

server.on("error", function (error) {
  console.error("Server error:", error);
  res.writeHead(500, { "Content-Type": "text/plain" });
  res.write("Internal Server Error");
  res.end();
});

server.listen(PORT, function () {
  console.log(`Server listening on port ${PORT}`);
});