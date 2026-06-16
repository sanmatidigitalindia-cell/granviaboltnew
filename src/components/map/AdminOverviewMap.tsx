/**
 * Admin web: overview map showing guards (green), sites (red), jobs (blue).
 * Pass whichever datasets are available — renders whatever has coordinates.
 */
import MapView from './MapView';
import type { MapMarker, LatLng } from './types';

interface Guard {
  id: string;
  name: string;
  city?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

interface Site {
  id: string;
  site_name?: string;
  name?: string;
  city?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

interface Job {
  id: string;
  title: string;
  company?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

interface Props {
  guards?: Guard[];
  sites?: Site[];
  jobs?: Job[];
  mapHeight?: number | string;
  className?: string;
}

const INDIA_CENTER: LatLng = { lat: 20.5937, lng: 78.9629 };

function hasCoords(item: { latitude?: number | string | null; longitude?: number | string | null }) {
  return item.latitude != null && item.longitude != null &&
    Number(item.latitude) !== 0 && Number(item.longitude) !== 0;
}

export default function AdminOverviewMap({ guards = [], sites = [], jobs = [], mapHeight = 400, className }: Props) {
  const markers: MapMarker[] = [
    ...guards.filter(hasCoords).map(g => ({
      id: `guard-${g.id}`,
      position: { lat: Number(g.latitude), lng: Number(g.longitude) },
      title: g.name,
      subtitle: g.city,
      type: 'guard' as const,
    })),
    ...sites.filter(hasCoords).map(s => ({
      id: `site-${s.id}`,
      position: { lat: Number(s.latitude), lng: Number(s.longitude) },
      title: s.site_name ?? s.name ?? 'Site',
      subtitle: s.city,
      type: 'site' as const,
    })),
    ...jobs.filter(hasCoords).map(j => ({
      id: `job-${j.id}`,
      position: { lat: Number(j.latitude), lng: Number(j.longitude) },
      title: j.title,
      subtitle: j.company,
      type: 'job' as const,
    })),
  ];

  const center = markers[0]?.position ?? INDIA_CENTER;

  return (
    <div className={`rounded-2xl overflow-hidden border border-gray-100 ${className ?? ''}`} style={{ height: mapHeight }}>
      <MapView center={center} zoom={markers.length ? 10 : 5} markers={markers} />
    </div>
  );
}
