import React, { useState, useMemo, useCallback } from "react";
import { Layer, Marker, Source } from "react-map-gl";
import {
  transformRotate,
  centroid,
  getCoord,
  bearing,
  destination,
  point,
  lineString,
} from "@turf/turf";

const data = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {},
      geometry: {
        coordinates: [
          [
            [-0.12189493188387246, 51.514494221063586],
            [-0.12250390323998772, 51.514494221063586],
            [-0.12250390323998772, 51.51440989210448],
            [-0.12189493188387246, 51.51440989210448],
            [-0.12189493188387246, 51.514494221063586],
          ],
        ],
        type: "Polygon",
      },
    },
  ],
} as GeoJSON.FeatureCollection;

export const CustomPolygon = () => {
  const [rotation, setRotation] = useState(0);
  const polygonCenter = useMemo(() => getCoord(centroid(data.features[0])), []);

  const rotatedData = useMemo(() => {
    return {
      ...data,
      features: [
        transformRotate(data.features[0], rotation, { pivot: polygonCenter }),
      ],
    };
  }, [rotation]);

  const markerPosition = useMemo(() => {
    return destination(point(polygonCenter), 20, rotation, {
      units: "meters",
    }).geometry.coordinates;
  }, [polygonCenter, rotation]);

  const lineData = useMemo(() => {
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: lineString([polygonCenter, markerPosition]),
        },
      ],
    };
  }, [polygonCenter, markerPosition]);

  const handleMarkerDrag = useCallback(
    (event) => {
      const { lngLat } = event;
      const newPosition = [lngLat.lng, lngLat.lat];
      const newRotation = bearing(polygonCenter, newPosition);
      setRotation(newRotation);
    },
    [polygonCenter]
  );

  return (
    <>
      <Source id="polygon-source" type="geojson" data={rotatedData}>
        <Layer
          id="polygon-layer"
          type="fill"
          paint={{
            "fill-color": "#088",
            "fill-opacity": 0.8,
          }}
        />
      </Source>

      <Source id="line-source" type="geojson" data={lineData}>
        <Layer
          id="line-layer"
          type="line"
          paint={{
            "line-color": "#f00",
            "line-width": 2,
          }}
        />
      </Source>

      <Marker
        longitude={markerPosition[0]}
        latitude={markerPosition[1]}
        draggable
        onDrag={handleMarkerDrag}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            backgroundColor: "red",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "white",
            fontWeight: "bold",
          }}
        >
          <img
            src="/rotate-svgrepo-com.png"
            alt="Rotate"
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </Marker>
    </>
  );
};
