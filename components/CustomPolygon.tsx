import React, { useRef, useState, useMemo, useCallback } from "react";
import { Layer, Marker, Source } from "react-map-gl";
import { transformRotate, centroid, getCoord } from "@turf/turf";

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

const MemoizedImageSource = React.memo(
  ({ coordinates }: { coordinates: number[][] }) => (
    <Source type="image" url="/svg.png" coordinates={coordinates}>
      <Layer
        type="raster"
        paint={{
          "raster-fade-duration": 0,
          "raster-opacity": 1,
        }}
      />
    </Source>
  ),
  (prevProps, nextProps) =>
    JSON.stringify(prevProps.coordinates) ===
    JSON.stringify(nextProps.coordinates)
);

export const CustomPolygon = () => {
  const [polygon, setPolygon] = useState(data);
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState(0);
  const divRef = useRef<HTMLDivElement>(null);

  const center = useMemo(() => getCoord(centroid(polygon)), [polygon]);
  const [lng, lat] = center;

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!isDragging || !divRef.current) return;

      const rect = divRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const angle = Math.atan2(
        event.clientY - centerY,
        event.clientX - centerX
      );
      const degrees = (angle * 180) / Math.PI + 90;

      const rotatedPoly = transformRotate(polygon, degrees / 25);

      setPolygon(rotatedPoly);
      setRotation(degrees);
    },
    [isDragging, polygon]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const coordinates = useMemo(
    () => polygon.features[0].geometry.coordinates[0].slice(0, 4),
    [polygon]
  );

  return (
    <>
      <Marker longitude={-0.12246169380219385} latitude={51.514320237250246}>
        <div
          ref={divRef}
          className="bg-white border-2 border-red-600 rounded-full w-[40px] h-[40px] flex justify-center items-center"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {rotation.toFixed(0)}°
        </div>
      </Marker>

      <Marker longitude={lng} latitude={lat}>
        <div
          className="border-2 border-red-600 rounded-full w-[500px] h-[500px] flex justify-center items-center"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {rotation.toFixed(0)}°
        </div>
      </Marker>

      <Source type="geojson" data={polygon}>
        <Layer
          type="line"
          paint={{
            "line-color": "#ff0000",
            "line-width": 2,
          }}
        />
      </Source>

      <MemoizedImageSource coordinates={coordinates} />
    </>
  );
};
