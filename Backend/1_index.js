const fs = require('fs');

fs.writeFile('info.txt', 'Athlinko is amazing!', (err) => {
  if (err) {
    console.error('Error writing file:', err);
  } else {
    console.log('File written successfully!');
  }
});
