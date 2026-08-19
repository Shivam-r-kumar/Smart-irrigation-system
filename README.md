# AgriSmart

AgriSmart is a responsive smart-irrigation and precision-farming dashboard built with React, Vite, Tailwind CSS, React Router, Firebase, Lucide icons, and Recharts.

## Run locally

```bash
npm install
npm run dev
```

The application is connected by default to the AgriSmart Firebase Realtime Database. An environment-specific database can override it by copying `.env.example` to `.env.local` and filling in the Firebase Web App values. ESP32 readings use `sensorReadings/FIELD-001`, while dashboard pump commands use `irrigation/FIELD-001`.

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
