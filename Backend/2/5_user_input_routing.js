const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
  const { url, method } = req;

  if (url === '/' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write('<html>');
    res.write('<head><title>Welcome to My Website</title></head>');
    res.write('<body><h1>Enter your Details</h1>');
    res.write('<form action="/submit-details" method="POST">')
    res.write('<input type="text" name="username" placeholder="Enter your name"><br><br>');
    res.write('<label for="male">Male</label>');
    res.write('<input type="radio" id="male" name="gender" value="male"/>');
    res.write('<label for="female">Female</label>');
    res.write('<input type="radio" id="female" name="gender" value="female"/><br><br>');
    res.write('<input type="submit" value="Submit">');
    res.write('</form>');
    res.write('</body>');
    res.write('</html>');
    return res.end();
  } else if (req.url.toLowerCase()==="/submit-details" && req.method === "POST"){
    fs.writeFileSync('5_user.txt', 'Amit Kumar');  //just to check
    res.statusCode = 302;   //redirection code
    res.setHeader('Location','/submitted');
    return res.end();
  }
  else if (url === '/submitted') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Data Submitted Successfully');
  }
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
