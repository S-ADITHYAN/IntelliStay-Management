const redis = require('redis');
const { promisify } = require('util');

// Create a Redis client
const redisClient = redis.createClient();

// Connect the Redis client
(async () => {
  await redisClient.connect();
  console.log('Connected to Redis');
})();

// Promisify Redis methods for better async handling
const setAsync = promisify(redisClient.set).bind(redisClient);
const getAsync = promisify(redisClient.get).bind(redisClient);
const delAsync = promisify(redisClient.del).bind(redisClient);

module.exports = { redisClient, setAsync, getAsync, delAsync };
