# AgriSmart

AgriSmart is a responsive smart-irrigation and precision-farming dashboard built with React, Vite, Tailwind CSS, React Router, Firebase, Lucide icons, and Recharts.

## Run locally

```bash
npm install
npm run dev
```

The application uses realistic demo values when Firebase is not configured. To connect an ESP32 data source, copy `.env.example` to `.env.local`, fill in the Firebase Realtime Database values, and use the documented device structure under `sensorReadings/FIELD-001` and `irrigation/FIELD-001`.

## Deploy to Vercel

Push this folder to a Git repository and import the repository in Vercel. The included `vercel.json` uses `npm run build`, publishes `dist`, and sends direct application routes such as `/crop-recommendation` to the React application.

You can also deploy from this folder with the Vercel CLI:

```bash
npx vercel
npx vercel --prod
```

Add the `VITE_FIREBASE_*` values from `.env.example` in the Vercel project's Environment Variables when Firebase is required.

## Available experiences

- Real-time field dashboard and irrigation controls
- Soil health and NPK analysis
- Rule-based crop recommendation ready for an ML API
- Device fleet, alert filtering, and reporting
- English and Hindi UI
- Light and dark themes saved on the device

## Verification

```bash
npm run build
npm test
```
