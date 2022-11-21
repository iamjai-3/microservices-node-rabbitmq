const { Router } = require('express');
const amqp = require('amqplib');
const Product = require('../models/Product');
const Logging = require('../utils/Logging');

const router = new Router();

let order, channel, connection;

// Connect to RabbitMQ
const connectToRabbitMQ = async () => {
  const amqpServer = 'amqp://guest:guest@localhost:5672';
  connection = await amqp.connect(amqpServer);
  channel = await connection.createChannel(); // Channel for sending AMQP commands to broker
  await channel.assertQueue('product-service-queue'); // Queue
};

connectToRabbitMQ()
  .then(() => {
    Logging.info('RabbitMQ Connected Successfully');
  })
  .catch((e) => {
    Logging.error('RabbitMQ Connection failed');
    throw new Error(e);
  });

//Create a new product
router.post('/', async (req, res) => {
  const { name, price, description } = req.body;

  if (!name || !price || !description) {
    Logging.error('Please provide name, price and description');
    return res.status(400).json({
      message: 'Please provide name, price and description',
    });
  }

  //! Need to do error handling
  const product = await new Product({ ...req.body });
  await product.save();
  return res.status(201).json({
    message: 'Product created successfully',
    product,
  });
});

// Buying a product
router.post('/buy', async (req, res) => {
  const { productIds } = req.body;

  const products = await Product.find({ _id: { $in: productIds } });

  // Send order details to order-queue.
  channel.sendToQueue(
    'order-service-queue',
    Buffer.from(JSON.stringify({ products }))
  );

  // Listener: Fetches placed orders sent from order-queue & ACK the transaction.
  channel.consume('product-service-queue', (data) => {
    Logging.info(
      'Received ordered data from product-service-queue (Order-Placed Successfully 👍)'
    );
    order = JSON.parse(data.content);
    channel.ack(data);

    // Returns success message
    if (order)
      return res.status(201).json({
        message: 'Order placed successfully',
        order,
      });
  });
});

module.exports = router;
