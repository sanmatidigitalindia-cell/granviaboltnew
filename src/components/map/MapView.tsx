/**
 * Provider-agnostic map view.
 *
 * To switch to Google Maps:
 *   1. Set VITE_MAP_PROVIDER=google in .env
 *   2. Implement src/components/map/google/GoogleMapView.tsx with the same MapViewProps interface
 *   3. Uncomment the google branch below
 *
 * All consumer components import from here — zero changes needed elsewhere.
 */
import type { MapViewProps } from './types';
import LeafletMapView from './leaflet/LeafletMapView';
// import GoogleMapView from './google/GoogleMapView'; // future

const provider = import.meta.env.VITE_MAP_PROVIDER ?? 'leaflet';

export default function MapView(props: MapViewProps) {
  if (provider === 'google') {
    // return <GoogleMapView {...props} />;
    console.warn('Google Maps provider not yet implemented — falling back to Leaflet');
  }
  return <LeafletMapView {...props} />;
}
