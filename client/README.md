# Lucknowi Nazakat: client frontend

## Run
```bash
cd client
npm install
npm run dev        # http://localhost:5173
```
Backend must run on http://localhost:3001 and allow CORS from http://localhost:5173.
API URL lives in `.env` (`VITE_API_URL`). Restart `npm run dev` after editing it.

## Hero photo
Put `hero.avif`, `hero.jpg`, `hero.jpeg`, `hero.png`, or `hero.webp` in `src/assets/`. It is picked up automatically as the homepage background and feature photo.

## If something does not match your backend
Everything backend-specific is in `src/services/api.js`:
- `buildOrderPayload()`: body sent to POST /orders
- `cartApi.add()`: body sent to POST /cart/items (sends productId, product and quantity)
- `normalizeOrder()`: how order fields (total, items) are read
- `authApi`: login / register / refresh bodies
