"use client";

import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { FarmProvider } from "./context/FarmContext";
import AppShell from "./components/AppShell";
import Dashboard from "./pages/Dashboard";
import SoilAnalysis from "./pages/SoilAnalysis";
import CropRecommendation from "./pages/CropRecommendation";
import IrrigationControl from "./pages/IrrigationControl";
import Sensors from "./pages/Sensors";
import Alerts from "./pages/Alerts";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import FarmMap from "./pages/FarmMap";

export default function App() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="app-boot"><span>AgriSmart</span><i /></div>;

  return (
    <ThemeProvider>
      <LanguageProvider>
        <FarmProvider>
          <BrowserRouter>
            <AppShell>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/soil-analysis" element={<SoilAnalysis />} />
                <Route path="/crop-recommendation" element={<CropRecommendation />} />
                <Route path="/irrigation" element={<IrrigationControl />} />
                <Route path="/sensors" element={<Sensors />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/farm-map" element={<FarmMap />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </AppShell>
          </BrowserRouter>
        </FarmProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
