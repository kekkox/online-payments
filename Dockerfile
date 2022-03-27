# Compile
FROM node:lts-alpine as ts-compiler
WORKDIR /app/online-payments
COPY package*.json ./
COPY tsconfig.json ./
RUN npm install
COPY . ./
RUN npm run build

# Create the image with only the dist folder
FROM node:lts-alpine
WORKDIR /app/online-payments
COPY --from=ts-compiler /app/online-payments/package*.json ./
COPY --from=ts-compiler /app/online-payments/dist ./
RUN npm install --only=production
ENV PORT 3000
EXPOSE $PORT
CMD [ "node", "index.js" ]
