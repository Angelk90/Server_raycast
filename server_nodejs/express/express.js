const express = require('express');
const PORT = process.env.PORT || 8080;
const app = express();
let c = 0;

app.get('/', (req, res) => {
  c++;
  res.json({ count: c });
});

app.use((req, res, next) => {
  res.status(400).json({ error: 'Invalid request' });
});

app.listen(PORT, () => {
  //console.log(`Server listening on port: ${PORT}`);
});
