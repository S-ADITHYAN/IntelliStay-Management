# Use Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all backend files
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port 3001
EXPOSE 3001

# Start the server
CMD ["npm", "start"] 