/**
 * Provider-agnostic location picker (click map → drop pin → get LatLng).
 *
 * To switch to Google Maps:
 *   1. Set VITE_MAP_PROVIDER=google in .env
 *   2. Implement src/components/map/google/GoogleLocationPicker.tsx with the same LocationPickerProps interface
 *   3. Uncomment the google branch below
 */
import type { LocationPickerProps } from './types';
import LeafletLocationPicker from './leaflet/LeafletLocationPicker';
// import GoogleLocationPicker from './google/GoogleLocationPicker'; // future

const provider = import.meta.env.VITE_MAP_PROVIDER ?? 'leaflet';

export default function LocationPicker(props: LocationPickerProps) {
  if (provider === 'google') {
    // return <GoogleLocationPicker {...props} />;
    console.warn('Google Maps provider not yet implemented — falling back to Leaflet');
  }
  return <LeafletLocationPicker {...props} />;
}
