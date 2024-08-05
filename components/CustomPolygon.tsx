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
  transformTranslate,
} from "@turf/turf";

const initialData = {
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
  const [data, setData] = useState(initialData);
  const polygonCenter = useMemo(
    () => getCoord(centroid(data.features[0])),
    [data]
  );

  const rotatedData = useMemo(() => {
    return {
      ...data,
      features: [
        transformRotate(data.features[0], rotation, { pivot: polygonCenter }),
      ],
    } as GeoJSON.FeatureCollection;
  }, [rotation, data, polygonCenter]);

  const markerPosition = useMemo(() => {
    return destination(point(polygonCenter), 20, rotation, {
      units: "meters",
    }).geometry.coordinates;
  }, [polygonCenter, rotation]);

  const lineData = useMemo(() => {
    return {
      type: "FeatureCollection",
      features: [lineString([polygonCenter, markerPosition])],
    } as GeoJSON.FeatureCollection;
  }, [polygonCenter, markerPosition]);

  const handleMarkerDrag = useCallback(
    (event: any) => {
      const { lngLat } = event;
      const newPosition = [lngLat.lng, lngLat.lat];
      const newRotation = bearing(polygonCenter, newPosition);
      setRotation(newRotation);
    },
    [polygonCenter]
  );

  const handlePolygonDrag = useCallback(
    (event: any) => {
      const { lngLat } = event;
      const newCenter = [lngLat.lng, lngLat.lat];
      const translation = [
        newCenter[0] - polygonCenter[0],
        newCenter[1] - polygonCenter[1],
      ];

      const newData = {
        ...data,
        features: [
          transformTranslate(
            data.features[0],
            Math.sqrt(
              Math.pow(translation[0], 2) + Math.pow(translation[1], 2)
            ),
            bearing(polygonCenter, newCenter)
          ),
        ],
      } as GeoJSON.FeatureCollection;

      setData(newData);
    },
    [data, polygonCenter]
  );

  const coordinates = (
    rotatedData.features[0].geometry as GeoJSON.Polygon
  ).coordinates[0].slice(0, 4);

  return (
    <>
      <Source id="polygon-source" type="geojson" data={rotatedData}>
        <Layer
          id="polygon-layer"
          type="fill"
          paint={{
            "fill-color": "gray",
            "fill-opacity": 0.2,
          }}
        />
      </Source>

      <Source type="image" url="/svg.png" coordinates={coordinates}>
        <Layer
          type="raster"
          paint={{
            "raster-fade-duration": 0,
            "raster-opacity": 1,
          }}
        />
      </Source>

      <Source id="line-source" type="geojson" data={lineData}>
        <Layer
          id="line-layer"
          type="line"
          paint={{
            "line-color": "gray",
            "line-width": 2,
            "line-dasharray": [2, 2],
          }}
        />
      </Source>

      <Marker
        longitude={polygonCenter[0]}
        latitude={polygonCenter[1]}
        draggable
        onDrag={handlePolygonDrag}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            backgroundColor: "white",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "white",
            fontWeight: "bold",
            opacity: 1,
            border: "2px solid gray",
          }}
        >
          <img
            src="/move-alt-svgrepo-com.png"
            alt="Move"
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </Marker>

      <Marker longitude={markerPosition[0]} latitude={markerPosition[1]}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            backgroundColor: "white",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "white",
            fontWeight: "bold",
            opacity: 1,
            border: "2px solid gray",
          }}
        >
          <img
            src="/rotate-svgrepo-com.png"
            alt="Rotate"
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </Marker>

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
            display: "flex",
            opacity: 0,
          }}
        ></div>
      </Marker>
    </>
  );
};
