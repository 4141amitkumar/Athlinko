const http = require('http');

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  //res.setHeader('Content-Type', 'text/plain');   // text/plain	Plain text
  res.setHeader('Content-Type','text/html');
  res.write('<html>');
  res.write('<head><title>Hello World</title></head>');
  res.write('<body><h1>Hello from Node.js server</h1></body>');
  res.write('</html>')
  res.end();

  // res.end('Hello from Node.js!');   Can Combine write() and end()
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
