"use client";
import * as React from "react";
import Map, { Layer, Marker, Source } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { MeasureTool } from "./MeasureTool";
import { CustomPolygon } from "@/components/CustomPolygon";
import { useRef } from "react";

export const MapContainer = () => {
  const mapRef = useRef(null);

  return (
    <Map
      ref={mapRef}
      initialViewState={{
        longitude: -0.12249096587602795,
        latitude: 51.51417051192398,
        zoom: 19,
      }}
      mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
    >
      <CustomPolygon />
      <MeasureTool />
    </Map>
  );
};
