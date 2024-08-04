import { useControl } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

class MeasureToolControl implements maplibregl.IControl {
  private map: maplibregl.Map | null = null;
  private container: HTMLElement | null = null;
  private measureButton: HTMLButtonElement | null = null;
  private measuring: boolean = false;
  private measurePoints: maplibregl.LngLat[] = [];
  private measureLine: GeoJSON.Geometry | null = null;

  onAdd(map: maplibregl.Map): HTMLElement {
    this.map = map;
    this.container = document.createElement("div");
    this.container.className = "maplibregl-ctrl maplibregl-ctrl-group";

    this.measureButton = document.createElement("button");
    this.measureButton.className =
      "maplibregl-ctrl-icon maplibregl-ctrl-measure";
    this.measureButton.type = "button";
    this.measureButton.innerHTML = "📏";
    this.measureButton.addEventListener("click", this.toggleMeasure);

    this.container.appendChild(this.measureButton);
    return this.container;
  }

  onRemove(): void {
    this.container?.parentNode?.removeChild(this.container);
    this.map = null;
  }

  toggleMeasure = (): void => {
    if (!this.map) return;

    this.measuring = !this.measuring;

    if (this.measuring) {
      this.map.getCanvas().style.cursor = "crosshair";
      this.map.on("click", this.addPoint);
    } else {
      this.map.getCanvas().style.cursor = "";
      this.map.off("click", this.addPoint);
      this.clearMeasurement();
    }
  };

  addPoint = (e: maplibregl.MapMouseEvent): void => {
    if (!this.map) return;

    this.measurePoints.push(e.lngLat);

    if (this.measurePoints.length > 1) {
      const lineString: GeoJSON.LineString = {
        type: "LineString",
        coordinates: this.measurePoints.map((point) => [point.lng, point.lat]),
      };

      console.log("lineString", lineString);

      if (this.measureLine) {
        this.map.removeLayer("measure-line");
        this.map.removeLayer("measure-points");
        this.map.removeSource("measure-line");
      }

      this.map.addSource("measure-line", {
        type: "geojson",
        data: lineString,
      });

      this.map.addLayer({
        id: "measure-line",
        type: "line",
        source: "measure-line",
        paint: {
          "line-color": "#f00",
          "line-width": 2,
        },
      });

      this.map.addLayer({
        id: "measure-points",
        type: "circle",
        source: "measure-line",
        paint: {
          "circle-radius": 5,
          "circle-color": "#f00",
        },
      });

      this.measureLine = lineString;

      const distance = this.calculateDistance();
      this.displayDistance(distance);
    }
  };

  calculateDistance(): number {
    let distance = 0;
    for (let i = 1; i < this.measurePoints.length; i++) {
      distance += this.measurePoints[i - 1].distanceTo(this.measurePoints[i]);
    }
    return distance;
  }

  displayDistance(distance: number): void {
    const popup = new maplibregl.Popup()
      .setLngLat(this.measurePoints[this.measurePoints.length - 1])
      .setHTML(`Distance: ${distance.toFixed(2)} meters`)
      .addTo(this.map!);
  }

  clearMeasurement(): void {
    if (!this.map) return;

    if (this.measureLine) {
      this.map.removeLayer("measure-line");
      this.map.removeLayer("measure-points");
      this.map.removeSource("measure-line");
      this.measureLine = null;
    }

    this.measurePoints = [];
    this.map.getCanvas().style.cursor = "";
  }
}

interface MeasureToolProps {
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

export const MeasureTool: React.FC<MeasureToolProps> = ({
  position = "top-right",
}) => {
  useControl(() => new MeasureToolControl(), { position });

  return null;
};
