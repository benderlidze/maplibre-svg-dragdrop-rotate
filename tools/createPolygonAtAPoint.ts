import * as turf from "@turf/turf";

interface PolygonOptions {
  lat: number;
  lng: number;
  width: number;
  height: number;
}

export const createPolygonAtAPoint = ({
  lat,
  lng,
  width,
  height,
}: PolygonOptions) => {
  console.log("lat,lng", lat, lng);

  const halfWidth = width / 2 / 1000;
  const halfHeight = height / 2 / 1000;

  const hypotenuse = Math.sqrt(halfWidth * halfWidth + halfHeight * halfHeight);
  const longerSide = Math.max(halfWidth, halfHeight);
  const shorterSide = Math.min(halfWidth, halfHeight);
  const angleRadians = Math.atan(shorterSide / longerSide);
  const angleDegrees = angleRadians * (180 / Math.PI);

  // Calculate the corners of the polygon using Turf.js
  const topLeft = turf.destination([lng, lat], hypotenuse, 270 + angleDegrees);
  const topRight = turf.destination([lng, lat], hypotenuse, 90 - angleDegrees); // 45° for top-right
  const bottomRight = turf.destination(
    [lng, lat],
    hypotenuse,
    90 + angleDegrees
  );
  const bottomLeft = turf.destination(
    [lng, lat],
    hypotenuse,
    270 - angleDegrees
  );

  const polygonCoords = [
    topLeft.geometry.coordinates,
    topRight.geometry.coordinates,
    bottomRight.geometry.coordinates,
    bottomLeft.geometry.coordinates,
    topLeft.geometry.coordinates,
  ];

  const polygon = turf.polygon([
    polygonCoords,
  ]) as GeoJSON.Feature<GeoJSON.Polygon>;

  return polygon;
};
