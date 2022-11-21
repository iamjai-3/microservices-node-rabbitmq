const mongoose = require('mongoose');
const express = require('express');
const Order = require('./models/Order');
const amqp = require('amqplib');
const Logging = require('./utils/Logging');

const app = express();

const PORT = process.env.PORT || 3002;

let channel, connection;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect('mongodb://localhost:27017/order-service', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => Logging.info('Order-service Connected to MongoDB'))
  .catch((e) =>
    Logging.info(`Failed Connecting Order-service to MongoDB--> ${e}`)
  );

// RabbitMQ Connection
const connectToRabbitMQ = async () => {
  const amqpServer = 'amqp://guest:guest@localhost:5672';
  connection = await amqp.connect(amqpServer);
  channel = await connection.createChannel();
  await channel.assertQueue('order-service-queue'); // Order Queue
};

// Create an order
const createOrder = async (products) => {
  let total = 0;

  products.forEach((product) => {
    total += product.price;
  });

  const order = new Order({
    products,
    total,
  });
  await order.save();
  return order;
};

connectToRabbitMQ()
  .then(() => {
    Logging.info('RabbitMQ Connected Successfully');
    channel.consume('order-service-queue', async (data) => {
      // order-service listens to this queue
      Logging.info(
        'Received products data from order-service-queue (Creating-Order...)'
      );
      const { products } = JSON.parse(data.content);
      const newOrder = await createOrder(products);
      channel.ack(data);

      // Forwards created order response in product-service-queue
      channel.sendToQueue(
        'product-service-queue',
        Buffer.from(JSON.stringify({ newOrder }))
      );
    });
  })
  .catch((e) => {
    Logging.error('RabbitMQ Connection failed');
    throw new Error(e);
  });

app.listen(PORT, () => {
  Logging.info(`Order-Service listening on port --> : ${PORT}`);
});
