"use client";
import * as React from "react";
import Map from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  CustomPolygon,
  FeaturePolygonWithProps,
} from "@/components/CustomPolygon";
import { DragEventHandler, useRef } from "react";
import { createPolygonAtAPoint } from "@/tools/createPolygonAtAPoint";
import { MeasureTool } from "./MeasureTool";
import { flats } from "@/types/blocktypes";

type PolygonObj = {
  feature: FeaturePolygonWithProps;
  image: string;
};

export const MapContainer = () => {
  const [polygons, setPolygons] = React.useState<PolygonObj[]>([]);

  const mapRef = useRef(null);
  const handleDrop: DragEventHandler = (e) => {
    if (!mapRef || !mapRef.current) return;
    e.preventDefault();

    const map = mapRef.current as maplibregl.Map;

    const imageFile = e.dataTransfer.files[0];
    const imageName = imageFile.name.replace(/\.[^/.]+$/, "");
    const dimensions = flats[imageName];
    console.log("dimensions", dimensions);

    const reader = new FileReader();
    reader.onload = (event) => {
      const svg = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = dimensions.imageWidth;
        canvas.height = dimensions.imageHeight;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const pngBase64 = canvas.toDataURL("image/png");

          const { layerX, layerY } = e.nativeEvent;

          const point = map.unproject([layerX, layerY]);
          const { lat, lng } = point;

          const polygonFeature = createPolygonAtAPoint({
            lat,
            lng,
            width: dimensions.imageWidth / 100,
            height: dimensions.imageHeight / 100,
          });

          console.log("polygonFeature==>", polygonFeature);
          setPolygons((prev) => [
            ...prev,
            {
              feature: polygonFeature,
              image: pngBase64,
            },
          ]);
        }
      };
      img.src = svg;
    };
    reader.readAsDataURL(imageFile);
  };

  const handleDragOver: DragEventHandler = (e) => {
    e.preventDefault();
  };

  const handleMapClick = (e: maplibregl.MapMouseEvent) => {
    if (!mapRef.current) return;
    const map = mapRef.current as maplibregl.Map;
    const features = map.queryRenderedFeatures(e.point);
    console.log("features", features);
  };

  return (
    <div
      className="w-full h-full"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: -0.12249096587602795,
          latitude: 51.51417051192398,
          zoom: 19,
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
        onClick={handleMapClick}
      >
        {polygons.map((polygon) => (
          <CustomPolygon
            image={polygon.image}
            id={polygon.feature.properties.id}
            label={"1 storey" + polygon.feature.properties.id}
            key={polygon.feature.properties.id} // Use the unique id as the key
            geojson={polygon.feature}
            onDelete={() => {
              setPolygons((prev) => {
                const newPolygons = prev.filter(
                  (p) =>
                    p.feature.properties.id !== polygon.feature.properties.id
                );
                return newPolygons;
              });
            }}
          />
        ))}
        <MeasureTool />
      </Map>
    </div>
  );
};
