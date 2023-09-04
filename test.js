const express = require('express');

const app = express();


app.get('/', (req, res) => {
  console.log(req.header('Authorization').split(' ')[1])
});

app.listen(5000, () => {
  console.log(`Server running on port 5000`)
});
