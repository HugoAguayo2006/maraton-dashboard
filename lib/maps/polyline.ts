export function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encoded.length) {
    const latResult = decodeValue(encoded, index);
    if (!latResult) break;
    index = latResult.nextIndex;
    latitude += latResult.delta;

    const lngResult = decodeValue(encoded, index);
    if (!lngResult) break;
    index = lngResult.nextIndex;
    longitude += lngResult.delta;
    points.push([latitude / 1e5, longitude / 1e5]);
  }
  return points;
}

function decodeValue(encoded: string, start: number): { delta: number; nextIndex: number } | null {
  let result = 0;
  let shift = 0;
  let index = start;
  let byte: number;
  do {
    if (index >= encoded.length) return null;
    byte = encoded.charCodeAt(index++) - 63;
    result |= (byte & 0x1f) << shift;
    shift += 5;
  } while (byte >= 0x20);
  return { delta: result & 1 ? ~(result >> 1) : result >> 1, nextIndex: index };
}

