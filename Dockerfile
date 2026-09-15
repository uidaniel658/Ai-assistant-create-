FROM node:24-alpine
WORKDIR /app
COPY package.json ./
COPY public ./public
COPY server ./server
RUN mkdir -p /data && chown -R node:node /app /data
USER node
ENV PORT=3000 HOST=0.0.0.0 ALTREX_DATA_DIR=/data
EXPOSE 3000
CMD ["node", "server/index.js"]
