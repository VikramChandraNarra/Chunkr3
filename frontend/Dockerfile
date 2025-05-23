# Use Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install

# Copy the frontend code
COPY frontend .

# Build Next.js
RUN npm run build

# Expose the frontend port
EXPOSE 3000

# Start the frontend
CMD ["npm", "start"]
