"use client";
import * as React from "react";
import Map from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { CustomPolygon } from "@/components/CustomPolygon";
import { DragEventHandler, useRef } from "react";
import { createPolygonAtAPoint } from "@/tools/createPolygonAtAPoint";
import { MeasureTool } from "./MeasureTool";

export const MapContainer = () => {
  const [polygons, setPolygons] = React.useState<
    GeoJSON.Feature<GeoJSON.Polygon>[]
  >([]);

  const mapRef = useRef(null);
  const handleDrop: DragEventHandler = (e) => {
    if (!mapRef || !mapRef.current) return;
    e.preventDefault();
    const { layerX, layerY } = e.nativeEvent;
    console.log("e", e);
    const map = mapRef.current as maplibregl.Map;

    const point = map.unproject([layerX, layerY]);
    const { lat, lng } = point;

    const polygonFeature = createPolygonAtAPoint({
      lat,
      lng,
      width: 43.3,
      height: 20.3,
    });

    console.log("polygonFeature==>", polygonFeature);
    setPolygons((prev) => [...prev, polygonFeature]);
  };

  const handleDragOver: DragEventHandler = (e) => {
    e.preventDefault();
  };

  console.log(JSON.stringify(polygons));

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
      >
        {polygons.map((polygon, index: number) => (
          <CustomPolygon
            key={index}
            geojson={polygon}
            onDelete={() => {
              setPolygons((prev) => {
                console.log("prev", prev);
                return prev.filter(
                  (poly) => poly.properties.id !== polygon.properties.id
                );
              });
            }}
            label={polygon.properties.id}
          />
        ))}

        <MeasureTool />
      </Map>
    </div>
  );
};
