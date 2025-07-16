const http = require('http');

const server = http.createServer((req, res) => {
  res.statusCode = 200; // success
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Powered-By', 'Node.js');

  const responseData = {
    message: 'Hello from Node!',
    method: req.method,
    url: req.url
  };

  res.write(JSON.stringify(responseData));
  res.end();
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
