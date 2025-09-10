const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello from Jenkins CI: Build → Test → Push Docker Image✅\n');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`App running on port ${PORT}`));

module.exports = server; // exported so tests can import/close it
