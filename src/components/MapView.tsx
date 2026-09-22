import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { useNavigate } from "react-router-dom";
import { Postcard } from "@/types/postcard";

interface MapViewProps { postcards: Postcard[] }

export default function MapView({ postcards }: MapViewProps) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const boundsRef = useRef<L.LatLngBounds | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const [tileError, setTileError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!container.current) return;
    const map = L.map(container.current, { scrollWheelZoom: false }).setView([48, 15], 4);
    mapRef.current = map;
    map.attributionControl.setPosition("bottomleft");
    const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);
    tiles.on("tileerror", () => setTileError(true));
    tiles.on("tileload", () => setTileError(false));
    const clusters = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 45 });
    map.addLayer(clusters);
    clusterRef.current = clusters;
    const resize = new ResizeObserver(() => map.invalidateSize());
    resize.observe(container.current);
    return () => {
      resize.disconnect();
      map.remove();
      mapRef.current = null;
      clusterRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current, clusters = clusterRef.current;
    if (!map || !clusters) return;
    clusters.clearLayers();
    const bounds = L.latLngBounds([]);
    for (const card of postcards) {
      if (!Number.isFinite(card.latitude) || !Number.isFinite(card.longitude)) continue;
      bounds.extend([card.latitude, card.longitude]);
      const icon = L.divIcon({ className: "postcard-map-pin", html: '<span aria-hidden="true">●</span>', iconSize: [30, 30], iconAnchor: [15, 15] });
      const marker = L.marker([card.latitude, card.longitude], { icon, title: card.title, alt: card.title });
      const link = document.createElement("a");
      link.textContent = card.title;
      link.href = `${import.meta.env.BASE_URL}postcards/${encodeURIComponent(card.id)}`;
      link.addEventListener("click", event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        navigate(`/postcards/${encodeURIComponent(card.id)}`);
      });
      marker.bindPopup(link);
      clusters.addLayer(marker);
    }
    boundsRef.current = bounds.isValid() ? bounds : null;
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [36, 36], maxZoom: 13, animate: false });
  }, [postcards, navigate]);

  const reset = () => {
    const map = mapRef.current;
    if (map && boundsRef.current) map.fitBounds(boundsRef.current, { padding: [36, 36], maxZoom: 13, animate: false });
    else map?.setView([48, 15], 4);
  };

  return <div className="postcard-map">
    <div className="postcard-map-toolbar">
      <p>Select a marker to open its postcard. Numbered circles group nearby postcards.</p>
      <button type="button" onClick={reset}>Show all postcards</button>
    </div>
    {tileError && <p role="status" className="postcard-map-notice">Some map images could not load. Check your connection or try again later; postcard markers and the Gallery remain available.</p>}
    {!postcards.length && <p role="status" className="postcard-map-notice">No postcards match your search. Clear the search to see them on the map.</p>}
    <div ref={container} className="postcard-map-canvas" aria-label="Map of historical postcards" />
  </div>;
}
