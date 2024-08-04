import React, { useRef, useState, useMemo, useCallback } from "react";
import { Layer, Marker, Source } from "react-map-gl";
import {
  transformRotate,
  centroid,
  getCoord,
  distance,
  bearing,
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
  const [markerPosition, setMarkerPosition] = useState(null);
  const polygonCenter = useMemo(() => getCoord(centroid(data.features[0])), []);

  const rotatedData = useMemo(() => {
    return {
      ...data,
      features: [
        transformRotate(data.features[0], rotation, { pivot: polygonCenter }),
      ],
    };
  }, [rotation]);

  const handleMarkerDragStart = useCallback((event) => {
    const { lngLat } = event;
    setMarkerPosition([lngLat.lng, lngLat.lat]);
  }, []);

  const handleMarkerDrag = useCallback(
    (event) => {
      const { lngLat } = event;
      const newPosition = [lngLat.lng, lngLat.lat];

      // Calculate distance from polygon center
      const dist = distance(polygonCenter, newPosition, {
        units: "kilometers",
      });
      const maxRadius = 0.05; // 50 meters radius

      if (dist <= maxRadius) {
        setMarkerPosition(newPosition);
        const newRotation = bearing(polygonCenter, newPosition);
        setRotation(newRotation);
      }
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

      {markerPosition ? (
        <Marker
          longitude={markerPosition[0]}
          latitude={markerPosition[1]}
          draggable
          onDragStart={handleMarkerDragStart}
          onDrag={handleMarkerDrag}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              backgroundColor: "red",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "white",
              fontWeight: "bold",
            }}
          >
            R
          </div>
        </Marker>
      ) : (
        <Marker
          longitude={polygonCenter[0]}
          latitude={polygonCenter[1]}
          draggable
          onDragStart={handleMarkerDragStart}
          onDrag={handleMarkerDrag}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              backgroundColor: "red",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "white",
              fontWeight: "bold",
            }}
          >
            R
          </div>
        </Marker>
      )}
    </>
  );
};
