const mongoose = require('mongoose');
const express = require('express');
const productRouter = require('./routes/product');
const Logging = require('./utils/Logging');

const app = express();

const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/products', productRouter);

mongoose
  .connect('mongodb://localhost:27017/product-service', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => Logging.info('Product-service Connected to MongoDB'))
  .catch((e) =>
    Logging.error(`Failed Connecting Product-service to MongoDB--> ${e}`)
  );

app.listen(PORT, () => {
  Logging.info(`Product-Service listening on port --> : ${PORT}`);
});
