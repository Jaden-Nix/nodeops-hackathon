# --- STAGE 1: Build Stage ---
# Use the official Node.js 20 "alpine" (lightweight) image
FROM node:20-alpine AS build

# Set the working directory inside the container
WORKDIR /app

# Copy the package lists
COPY package*.json ./

# Install *only* the production dependencies
RUN npm install --omit=dev

# --- STAGE 2: Production Stage ---
# Start from a fresh, clean Node.js image
FROM node:20-alpine AS production

WORKDIR /app

# Copy the 'node_modules' folder from the 'build' stage
COPY --from=build /app/node_modules ./node_modules

# Copy the rest of your app's code (index.js, views folder, etc.)
COPY . .

# Tell the container to "open" port 3000
EXPOSE 3000

# Set the environment to "production"
ENV NODE_ENV=production

# The command to run when the container starts
CMD ["node", "index.js"]


