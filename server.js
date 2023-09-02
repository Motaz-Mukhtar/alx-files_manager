import express from 'express';

const app = express();
const port = process.env.PORT || 5000;

app.route('/st', (req, res) => {
  res.send('lksjdfj')
});

app.listen(port);
