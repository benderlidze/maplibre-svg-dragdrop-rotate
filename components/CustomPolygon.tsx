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
  distance,
} from "@turf/turf";

type CustomPolygonProps = {
  geojson: GeoJSON.Feature;
};

export const CustomPolygon = ({ geojson }: CustomPolygonProps) => {
  const initialData = {
    type: "FeatureCollection",
    features: [geojson],
  } as GeoJSON.FeatureCollection;

  const [rotation, setRotation] = useState(0);
  const [data, setData] = useState(initialData);
  const [imageCoordinates, setImageCoordinates] = useState(
    (initialData.features[0].geometry as GeoJSON.Polygon).coordinates[0].slice(
      0,
      4
    )
  );

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
      const newData = {
        ...data,
        features: [
          transformTranslate(
            data.features[0],
            distance(point(polygonCenter), point(newCenter)),
            bearing(polygonCenter, newCenter)
          ),
        ],
      } as GeoJSON.FeatureCollection;

      setData(newData);
    },
    [data, polygonCenter]
  );

  const updateImageLayer = () => {
    setImageCoordinates(
      (
        rotatedData.features[0].geometry as GeoJSON.Polygon
      ).coordinates[0].slice(0, 4)
    );
  };

  return (
    <div>
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

      <Source type="image" url="/svg.png" coordinates={imageCoordinates}>
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
        onDragEnd={updateImageLayer}
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
        onDragEnd={updateImageLayer}
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
    </div>
  );
};
