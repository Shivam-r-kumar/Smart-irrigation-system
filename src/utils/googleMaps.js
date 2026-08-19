let googleMapsPromise;

export function loadGoogleMaps(apiKey) {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const callbackName = "__agriSmartGoogleMapsReady";
    const existingScript = document.querySelector("script[data-agrismart-google-maps]");

    window[callbackName] = () => {
      delete window[callbackName];
      if (window.google?.maps) resolve(window.google.maps);
      else reject(new Error("Google Maps loaded without the Maps API."));
    };

    if (existingScript) {
      existingScript.addEventListener("error", () => reject(new Error("Google Maps failed to load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.dataset.agrismartGoogleMaps = "true";
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&loading=async&callback=${callbackName}`;
    script.onerror = () => reject(new Error("Google Maps failed to load."));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}
