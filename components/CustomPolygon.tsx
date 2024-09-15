import React, { useState, useMemo, useCallback } from "react";
import { Layer, Marker, Source } from "react-map-gl";
import {
  Feature,
  LineString,
  Polygon,
  Point,
} from "geojson";

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
  lineIntersect,
  length,
  midpoint,
} from "@turf/turf";

export type FeaturePolygonWithProps = GeoJSON.Feature & {
  geometry: GeoJSON.Polygon;
  properties: {
    id: number;
    imageLink: string;
    type: string;
  };
};

const testPolygons: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {},
      geometry: {
        coordinates: [
          [
            [-0.12301290385087782, 51.51480780985301],
            [-0.12311315469861484, 51.514695165902594],
            [-0.12290429876520648, 51.514592919614074],
            [-0.1225534207956116, 51.51466743811841],
            [-0.12273999876285302, 51.51487193013108],
            [-0.12301290385087782, 51.51480780985301],
          ],
        ],
        type: "Polygon",
      },
    },
    {
      type: "Feature",
      properties: {},
      geometry: {
        coordinates: [
          [
            [-0.12333314961637143, 51.514357232380036],
            [-0.12340276826125773, 51.51409034977496],
            [-0.12289872927365764, 51.51404529151887],
            [-0.12289037503572331, 51.51414753903623],
            [-0.12322454453067166, 51.51416486910148],
            [-0.1231939123265704, 51.514301776383036],
            [-0.12333314961637143, 51.514357232380036],
          ],
        ],
        type: "Polygon",
      },
    },
    {
      type: "Feature",
      properties: {},
      geometry: {
        coordinates: [
          [
            [-0.12214778782654889, 51.51453584774998],
            [-0.12211994036886153, 51.514367747210315],
            [-0.1218609590103199, 51.514379878197815],
            [-0.12189159121439275, 51.514553177667494],
            [-0.12214778782654889, 51.51453584774998],
          ],
        ],
        type: "Polygon",
      },
    },
    {
      type: "Feature",
      properties: {},
      geometry: {
        coordinates: [
          [
            [-0.12247917257636232, 51.51391716538441],
            [-0.12249588105100884, 51.513456180904],
            [-0.1223482895233019, 51.51344751573757],
            [-0.12235107426968739, 51.51391369935311],
            [-0.12235385901482232, 51.51401248114246],
            [-0.12275486240952205, 51.51401768017803],
            [-0.12275207766313656, 51.51392236443084],
            [-0.1227743556293035, 51.513461380003065],
            [-0.12264068783105131, 51.513461380003065],
            [-0.12261284037333553, 51.51392063141546],
            [-0.12247917257636232, 51.51391716538441],
          ],
        ],
        type: "Polygon",
      },
    },
  ],
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

  const centerLines = useMemo(() => {
    const center = point(polygonCenter);
    const length = 100;

    const line1 = destination(center, length, rotation, {
      units: "meters",
    });
    const line2 = destination(center, length, rotation + 90, {
      units: "meters",
    });
    const line3 = destination(center, length, rotation + 180, {
      units: "meters",
    });
    const line4 = destination(center, length, rotation + 270, {
      units: "meters",
    });

    const resultLines = {
      type: "FeatureCollection",
      features: [
        lineString([polygonCenter, line1.geometry.coordinates]),
        lineString([polygonCenter, line2.geometry.coordinates]),
        lineString([polygonCenter, line3.geometry.coordinates]),
        lineString([polygonCenter, line4.geometry.coordinates]),
      ],
    } as GeoJSON.FeatureCollection;

    return resultLines;
  }, [polygonCenter, rotatedData]);

  const lineDistance = useMemo(() => {
    const results = testPolygons.features.map((polygon) => {
      const intr = centerLines.features.map((line) => {
        const resp = getLineBetweenPolygonIntersections(
          rotatedData.features[0] as Feature<Polygon>,
          polygon as Feature<Polygon>,
          line as Feature<LineString>
        );
        return resp;
      });
      return intr;
    });

    const lines = results.flat().filter((item) => item !== null);
    console.log("results", lines);

    const distancesTextCoordinates = lines.map((line) => {
      const mid = midpoint(
        point(line.geometry.coordinates[0]),
        point(line.geometry.coordinates[1])
      );
      return {
        ...mid,
        properties: {
          distance: line.properties && line.properties.distance + "m",
        },
      } as Feature<Point>;
    });

    console.log("distancesTextCoordinates", distancesTextCoordinates);

    return {
      type: "FeatureCollection",
      features: [...lines, ...distancesTextCoordinates],
    } as GeoJSON.FeatureCollection;
  }, [polygonCenter, rotatedData]);

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

      <Source type="geojson" data={testPolygons}>
        <Layer
          type="fill"
          paint={{
            "fill-color": "gray",
            "fill-opacity": 0.2,
            "fill-outline-color": "black",
          }}
        />
      </Source>

      {/* Measure lines */}
      <Source type="geojson" data={centerLines}>
        <Layer
          type="line"
          paint={{
            "line-color": "#ccc",
            "line-width": 1,
          }}
        />
      </Source>

      <Source type="geojson" data={lineDistance}>
        <Layer
          type="line"
          paint={{
            "line-color": "green",
            "line-width": 2,
          }}
        />
        <Layer
          type="circle"
          paint={{
            "circle-color": "red",
            "circle-radius": 3,
          }}
        />
        <Layer
          type="symbol"
          layout={{
            "text-field": ["get", "distance"],
            "text-size": 12,
            "text-anchor": "top",
            "text-offset": [0, 0],
          }}
          paint={{
            "text-color": "black",
          }}
          filter={["==", "$type", "Point"]}
        />
      </Source>

      {/* Building examples */}
      <Source type="image" url={image} coordinates={imageCoordinates}>
        <Layer
          type="raster"
          paint={{
            "raster-fade-duration": 0,
            "raster-opacity": active ? 1 : 0.5,
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

function getLineBetweenPolygonIntersections(
  centerPolygon: Feature<Polygon>,
  targetPolygon: Feature<Polygon>,
  line: Feature<LineString>
): Feature<LineString> | null {
  const intersectionsCenter = lineIntersect(line, centerPolygon);
  const intersectionsTarget = lineIntersect(line, targetPolygon);

  if (
    intersectionsCenter.features.length === 0 ||
    intersectionsTarget.features.length === 0
  ) {
    return null; // Line doesn't intersect both polygons
  }

  const f = {
    type: "FeatureCollection",
    features: [
      centerPolygon,
      targetPolygon,
      line,
      intersectionsCenter.features[0],
      intersectionsTarget.features[0],
    ],
  };

  const lineStart = point(line.geometry.coordinates[0]);

  let exitPoint = intersectionsCenter.features[0] as Feature<Point>;
  let maxDistance = distance(lineStart, exitPoint);
  for (let i = 1; i < intersectionsCenter.features.length; i++) {
    const point = intersectionsCenter.features[i] as Feature<Point>;
    const dist = distance(lineStart, point);
    if (dist > maxDistance) {
      exitPoint = point;
      maxDistance = dist;
    }
  }

  let entryPoint = intersectionsTarget.features[0] as Feature<Point>;
  let minDistance = distance(exitPoint, entryPoint);
  for (let i = 1; i < intersectionsTarget.features.length; i++) {
    const point = intersectionsTarget.features[i] as Feature<Point>;
    const dist = distance(exitPoint, point);
    if (dist < minDistance) {
      entryPoint = point;
      minDistance = dist;
    }
  }

  const newLine = lineString([
    exitPoint.geometry.coordinates,
    entryPoint.geometry.coordinates,
  ]);

  const lineDistance = length(newLine, { units: "meters" }).toFixed(2);
  return { ...newLine, properties: { distance: lineDistance } };
}
