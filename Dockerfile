FROM node:18-alpine as builder

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Build the application
RUN npm run build

FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy build output from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Copy scripts
COPY scripts ./scripts

# Create log directory
RUN mkdir -p logs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port
EXPOSE 3000

# Run the app
CMD ["node", "dist/index.js"]
