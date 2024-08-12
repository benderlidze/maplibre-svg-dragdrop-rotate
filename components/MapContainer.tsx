"use client";
import * as React from "react";
import Map from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  CustomPolygon,
  FeaturePolygonWithProps,
} from "@/components/CustomPolygon";
import { DragEventHandler, useEffect, useRef } from "react";
import { createPolygonAtAPoint } from "@/tools/createPolygonAtAPoint";
import { MeasureTool } from "./MeasureTool";
import { flats } from "@/types/blocktypes";

type PolygonObj = {
  feature: FeaturePolygonWithProps;
  image: string;
  active: boolean;
};

export const MapContainer = () => {
  const [polygons, setPolygons] = React.useState<PolygonObj[]>([]);

  const mapRef = useRef(null);

  //listen for delete button click
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Delete") {
        const activePolygon = polygons.find((p) => p.active);
        if (activePolygon) {
          setPolygons((prev) =>
            prev.filter(
              (p) =>
                p.feature.properties.id !== activePolygon.feature.properties.id
            )
          );
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [polygons]);

  const handleDrop: DragEventHandler = (e) => {
    if (!mapRef || !mapRef.current) return;
    e.preventDefault();

    const map = mapRef.current as maplibregl.Map;
    const imageUrl = e.dataTransfer.getData("text/uri-list");

    if (!imageUrl) {
      console.error("No image URL found in the dropped data");
      return;
    }

    // Extract the image name from the URL
    const imageName =
      imageUrl
        .split("/")
        .pop()
        ?.replace(/\.[^/.]+$/, "") || "";
    const dimensions = flats[imageName];

    if (!dimensions) {
      console.error("Image dimensions not found for " + imageName);
      return;
    }

    // Load the image from the URL
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = dimensions.imageWidth;
      canvas.height = dimensions.imageHeight;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, dimensions.imageWidth, dimensions.imageHeight);
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
            active: false,
          },
        ]);
      }
    };
    img.onerror = () => {
      console.error("Error loading image from URL:", imageUrl);
    };
    img.src = imageUrl;
  };

  const handleDragOver: DragEventHandler = (e) => {
    e.preventDefault();
  };

  const handleMapClick = (e: maplibregl.MapMouseEvent) => {
    if (!mapRef.current) return;
    const map = mapRef.current as maplibregl.Map;
    const features = map.queryRenderedFeatures(e.point);
    console.log("features", features);

    if (
      features.length > 0 &&
      features[0].properties?.type === "FeaturePolygonWithProps"
    ) {
      const id = features[0].properties.id;
      const newPolygons = polygons.map((polygon) => {
        if (polygon.feature.properties.id === id) {
          return {
            ...polygon,
            active: true,
          };
        }
        return {
          ...polygon,
          active: false,
        };
      });
      setPolygons(newPolygons);
    } else {
      //deselect all polygons
      setPolygons((prev) =>
        prev.map((polygon) => ({
          ...polygon,
          active: false,
        }))
      );
    }
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
            active={polygon.active}
            image={polygon.image}
            id={polygon.feature.properties.id}
            label={"1 storey" + polygon.feature.properties.id}
            key={polygon.feature.properties.id} // Use the unique id as the key
            geojson={polygon.feature}
            onDelete={() => {
              setPolygons((prev) =>
                prev.filter(
                  (p) =>
                    p.feature.properties.id !== polygon.feature.properties.id
                )
              );
            }}
          />
        ))}
        <MeasureTool />
      </Map>
    </div>
  );
};
