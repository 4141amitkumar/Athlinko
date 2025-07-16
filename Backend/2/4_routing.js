const http = require('http');

const server = http.createServer((req, res) => {
  const { url, method } = req;

  if (url === '/' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('🏠 Welcome to the homepage!');
  } else if (url === '/about' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('📄 About page');
  } else if (url === '/login' && method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('🔐 Login data submitted!');
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('❌ Page not found');
  }
});

server.listen(3000, () => {
  console.log('✅ Server running at http://localhost:3000');
});
