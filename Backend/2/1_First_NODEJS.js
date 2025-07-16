const http = require('http');   // Loads the built-in core module called http. This module gives us methods to create a web server, handle requests, and send responses

function requestListener(req,res){     // This is a callback function that runs whenever the server receives a request from the client (like browser, Postman, etc.) 
  //console.log(req);         // req is incoming HTTP request object   // commented this otherwise terminal will print a lot of things
  console.log('New request received:');
  console.log('URL:', req.url);
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  res.end('Hello from server');   //res is response object
  // res.end() must be called — otherwise browser waits forever for the server to respond.


  process.exit(); // Immediately exits the Node.js process
}
const server = http.createServer(requestListener);

// or directly
// http.createServer((req,res){
//  console.log(req);})

const PORT = 3000;
server.listen(PORT,()=>{
  console.log(`Server started on PORT: ${PORT}`)
});  //Starts the server and tells it to listen on port 3000

