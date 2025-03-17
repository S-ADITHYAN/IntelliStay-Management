# Use Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all staff files
COPY . .

# Build the app
RUN npm run build

# Expose port 5175
EXPOSE 5175

# Start the app
CMD ["npm", "run", "dev", "--", "--host", "--port", "5175"] 