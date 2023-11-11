const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8080;
let c = 0;
const filePath = path.join(__dirname, "exit_message.txt");

const server = http.createServer(function (req, res) {
  if (req.url === "/" && req.method === "GET") {
    c++;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.write(JSON.stringify({ count: c }));
  } else {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.write(JSON.stringify({ error: "Invalid request" }));
  }
  res.end();
});

server.on("error", function (error, res) {
  if (res) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.write(JSON.stringify({ error: "Internal Server Error" }));
    res.end();
  }
});

server.on("close", function () {
  fs.writeFile(filePath, "Server closed", function (err) {
    if (err) {
      console.error("Error writing exit message to file:", err);
    } else {
      console.log("Exit message written to file:", filePath);
    }
  });
});

process.on("unhandledRejection", function (reason, promise) {
  console.error("Unhandled promise rejection:", reason);
  promise.catch(() => {});
  fs.writeFile(filePath, "Server closed: " + reason, function (err) {
    if (err) {
      console.error("Error writing exit message to file:", err);
    } else {
      console.log("Exit message written to file:", filePath);
    }
  });
});

server.listen(PORT, function () {
  console.log(`Server listening on port: ${PORT}`);
});