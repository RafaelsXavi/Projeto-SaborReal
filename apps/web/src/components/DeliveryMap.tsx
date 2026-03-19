import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useState } from 'react';
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMapEvents,
} from 'react-leaflet';

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const RESTAURANT_LOCATION: [number, number] = [-23.5505, -46.6333];

interface DeliveryMapProps {
  onLocationSelect: (lat: number, lng: number, distanceKm: number) => void;
}

function LocationMarker({
  onSelect,
}: {
  onSelect: (lat: number, lng: number, distance: number) => void;
}) {
  const [position, setPosition] = useState<L.LatLng | null>(null);

  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      const distance =
        map.distance(L.latLng(RESTAURANT_LOCATION), e.latlng) / 1000;
      onSelect(e.latlng.lat, e.latlng.lng, distance);
    },
  });

  if (!position) return null;

  return (
    <>
      <Marker position={position}>
        <Popup>Sua casa esta aqui!</Popup>
      </Marker>
      <Polyline
        positions={[RESTAURANT_LOCATION, [position.lat, position.lng]]}
        color="var(--primary)"
        dashArray="5, 10"
        weight={3}
      />
    </>
  );
}

export function DeliveryMap({ onLocationSelect }: DeliveryMapProps) {
  return (
    <div className="relative z-0 h-64 w-full overflow-hidden rounded-3xl border-4 border-white shadow-xl dark:border-slate-800 sm:h-72">
      <MapContainer
        center={RESTAURANT_LOCATION}
        zoom={13}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={RESTAURANT_LOCATION}>
          <Popup>Restaurante SaborReal</Popup>
        </Marker>
        <LocationMarker onSelect={onLocationSelect} />
      </MapContainer>
      <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-[1000] rounded-2xl bg-white/90 p-3 text-center shadow-lg backdrop-blur-md dark:bg-slate-900/90">
        <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Selecione o local de entrega
        </p>
        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
          Clique no mapa para marcar sua residencia
        </p>
      </div>
    </div>
  );
}
