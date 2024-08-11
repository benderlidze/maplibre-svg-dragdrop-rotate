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

export type FeaturePolygonWithProps = GeoJSON.Feature & {
  geometry: GeoJSON.Polygon;
  properties: {
    id: number;
    imageLink: string;
    type: string;
  };
};

type CustomPolygonProps = {
  id: number;
  image: string;
  geojson: GeoJSON.Feature;
  label: string;
  active: boolean;
  onDelete: () => void;
};

export const CustomPolygon = ({
  id,
  image,
  geojson,
  label,
  active,
  onDelete,
}: CustomPolygonProps) => {
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

  console.log("active", active);

  return (
    <div className="border border-blue-800">
      <Source type="geojson" data={rotatedData}>
        <Layer
          type="fill"
          paint={{
            "fill-color": "gray",
            "fill-opacity": 0.2,
          }}
        />
      </Source>

      <Source type="image" url={image} coordinates={imageCoordinates}>
        <Layer
          type="raster"
          paint={{
            "raster-fade-duration": 0,
            "raster-opacity": 1,
          }}
        />
      </Source>

      {active && (
        <>
          <Source type="geojson" data={lineData}>
            <Layer
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
            offset={[0, 200]}
            longitude={polygonCenter[0]}
            latitude={polygonCenter[1]}
          >
            <div
              style={{
                borderRadius: "20px",
                backgroundColor: "gray",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                opacity: 1,
                border: "2px solid gray",
                padding: "5px 10px",
                gap: 10,
                color: "white",
              }}
            >
              ID {label}
              <img
                src="/delete-2-svgrepo-com.svg"
                alt="Rotate"
                style={{
                  width: "20px",
                  cursor: "pointer",
                  filter: "brightness(0) invert(1)",
                }}
                onClick={onDelete}
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
              }}
            ></div>
          </Marker>
        </>
      )}
    </div>
  );
};
