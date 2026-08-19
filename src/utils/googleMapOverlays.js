export function createDeviceMarkerClass(maps) {
  return class DeviceMarker extends maps.OverlayView {
    constructor(device, selected, onClick) {
      super();
      this.device = device;
      this.selected = selected;
      this.onClick = onClick;
      this.element = null;
    }

    onAdd() {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `google-device-marker ${this.selected ? "selected" : ""}`;
      button.style.setProperty("--device-color", this.device.color);
      button.setAttribute("aria-label", `${this.device.name}, ${this.device.id}`);
      const marker = document.createElement("strong");
      const markerLabel = document.createElement("span");
      markerLabel.textContent = this.device.marker;
      marker.appendChild(markerLabel);
      const caption = document.createElement("small");
      caption.textContent = this.device.id;
      button.append(marker, caption);
      button.addEventListener("click", this.onClick);
      this.element = button;
      this.getPanes().overlayMouseTarget.appendChild(button);
    }

    draw() {
      if (!this.element) return;
      const pixel = this.getProjection().fromLatLngToDivPixel(this.device.coordinates);
      this.element.style.left = `${pixel.x}px`;
      this.element.style.top = `${pixel.y}px`;
    }

    onRemove() {
      if (!this.element) return;
      this.element.removeEventListener("click", this.onClick);
      this.element.remove();
      this.element = null;
    }
  };
}
