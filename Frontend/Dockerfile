# Use Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all frontend files
COPY . .

# Build the app
RUN npm run build

# Expose port 5173 (or your Vite port)
EXPOSE 5173

# Start the app
CMD ["npm", "run", "dev"] 