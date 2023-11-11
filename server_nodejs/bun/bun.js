const PORT = process.env.PORT || 8080;
let c = 0;

const server = Bun.serve({
  port: PORT,
  fetch: (req) => {
    const url = new URL(req.url);
    if (url.pathname === "/"){
      c++;
      console.log(`${req.method} ${req.url} - C: ${c}`);
      return new Response(JSON.stringify({ count: c }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response("Not Found", {
      status: 404
    });
  },
});

console.log(`Server listening on port: ${PORT}`);