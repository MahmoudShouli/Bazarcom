# Use Node.js image
FROM node:14

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the source files
COPY . .

# Expose the port the app runs on
EXPOSE 3002

# Start the application
CMD ["node", "server.js"]
