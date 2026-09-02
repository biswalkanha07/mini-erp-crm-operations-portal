# Use official Node.js LTS image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the backend code
COPY . .

# Expose the backend port (change if your backend uses a different port)
EXPOSE 5050

# Set environment variables (override in docker-compose or at runtime)
ENV NODE_ENV=production

# Start the backend
CMD ["npm", "start"]
