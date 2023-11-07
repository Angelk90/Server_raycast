const http = require("http");

let c = 0;

http
  .createServer(function (req, res) {
    c++;
    console.log("C:", c);
    res.write(`C: ${c}`);
    res.end();
  })
  .listen(8080);