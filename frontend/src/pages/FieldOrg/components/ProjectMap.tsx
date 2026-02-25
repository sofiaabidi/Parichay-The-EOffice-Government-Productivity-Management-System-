import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { MapPin, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Card } from './ui/card';

interface Project {
  id: string;
  name: string;
  team: string;
  startDate: string;
  completion: string;
  status: 'active' | 'delayed' | 'on-hold';
  progress: number;
  icon: string;
  lat: number;
  lng: number;
}

interface ProjectMapProps {
  selectedProject: string | null;
}

const mapContainerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '16px',
};

const defaultCenter = {
  lat: 26.166094,
  lng: 90.815865,
};

const GOOGLE_MAPS_API_KEY = 'AIzaSyDDhWGybaofdMrXHWR3TevoslQn6P-lRAQ';

const projects: Project[] = [
  {
    id: 'proj-1',
    name: 'Highway Survey - Phase 1',
    team: 'Survey Team A',
    startDate: '2024-01-15',
    completion: '2024-06-30',
    status: 'active',
    progress: 68,
    icon: '🛣️',
    lat: 26.166094,
    lng: 90.815865,
  },
  {
    id: 'proj-2',
    name: 'Bridge Construction',
    team: 'Engineering Team B',
    startDate: '2023-11-20',
    completion: '2024-08-15',
    status: 'active',
    progress: 45,
    icon: '🌉',
    lat: 26.2,
    lng: 90.8,
  },
  {
    id: 'proj-3',
    name: 'Road Expansion Project',
    team: 'Infrastructure Team C',
    startDate: '2024-02-01',
    completion: '2024-05-31',
    status: 'delayed',
    progress: 32,
    icon: '🚧',
    lat: 26.1,
    lng: 90.9,
  },
  {
    id: 'proj-4',
    name: 'Railway Survey',
    team: 'Survey Team D',
    startDate: '2024-03-10',
    completion: '2024-09-20',
    status: 'active',
    progress: 58,
    icon: '🚄',
    lat: 26.3,
    lng: 90.7,
  },
  {
    id: 'proj-5',
    name: 'Metro Line Extension',
    team: 'Metro Team E',
    startDate: '2024-01-05',
    completion: '2024-12-31',
    status: 'on-hold',
    progress: 25,
    icon: '🚇',
    lat: 26.0,
    lng: 90.85,
  },
  {
    id: 'proj-6',
    name: 'Drainage System Upgrade',
    team: 'Civil Team F',
    startDate: '2024-02-20',
    completion: '2024-07-15',
    status: 'active',
    progress: 72,
    icon: '💧',
    lat: 26.25,
    lng: 90.75,
  },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active':
      return CheckCircle;
    case 'delayed':
      return AlertCircle;
    case 'on-hold':
      return Clock;
    default:
      return AlertCircle;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
    case 'delayed':
      return 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
    case 'on-hold':
      return 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
    default:
      return 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';
  }
};

export function ProjectMap({ selectedProject }: ProjectMapProps) {
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(13);
  const mapRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (selectedProject) {
      const project = projects.find((p) => p.id === selectedProject);
      if (project) {
        setMapCenter({ lat: project.lat, lng: project.lng });
        setMapZoom(14);
        setSelectedMarker(project.id);
      }
    }
  }, [selectedProject]);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const handleMarkerClick = (projectId: string) => {
    setSelectedMarker(projectId);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Project Locations</h2>
          <p className="text-sm text-gray-500 mt-1">
            View and track active field projects on the map
          </p>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
          <p className="text-sm text-blue-600">{projects.length} projects active</p>
        </div>
      </div>

      {/* FIXED GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* MAP SECTION (3 columns on large screens) */}
        <div className="lg:col-span-3">
          <Card className="p-6 shadow-lg border-0 rounded-2xl">
            <div className="mb-4">
              <h3 className="text-gray-900">Project Map</h3>
              <p className="text-sm text-gray-500 mt-1">
                <MapPin className="w-4 h-4 inline mr-1" />
                Click markers to view project details
              </p>
            </div>

            <div className="relative rounded-2xl overflow-hidden shadow-md">
              <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={mapCenter}
                  zoom={mapZoom}
                  onLoad={onLoad}
                  options={{
                    streetViewControl: false,
                    mapTypeControl: true,
                    fullscreenControl: false,
                  }}
                >
                  {projects.map((project) => (
                    <Marker
                      key={project.id}
                      position={{ lat: project.lat, lng: project.lng }}
                      icon={{ url: getStatusColor(project.status) }}
                      onClick={() => handleMarkerClick(project.id)}
                    />
                  ))}

                  {selectedMarker && (
                    <InfoWindow
                      position={{
                        lat: projects.find((p) => p.id === selectedMarker)!.lat,
                        lng: projects.find((p) => p.id === selectedMarker)!.lng,
                      }}
                      onCloseClick={() => setSelectedMarker(null)}
                    >
                      <div className="p-3 max-w-xs">
                        {(() => {
                          const project = projects.find((p) => p.id === selectedMarker)!;
                          const StatusIcon = getStatusIcon(project.status);

                          return (
                            <div className="flex items-start gap-3">
                              <div className="text-2xl">{project.icon}</div>
                              <div className="flex-1">
                                <h4 className="text-gray-900 font-medium">{project.name}</h4>
                                <p className="text-sm text-gray-600">{project.team}</p>

                                <div className="flex items-center gap-2 mt-2">
                                  <StatusIcon className="w-4 h-4" />
                                  <span className="text-sm capitalize">
                                    {project.status.replace('-', ' ')}
                                  </span>
                                </div>

                                <div className="mt-2">
                                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                                    <span>Progress</span>
                                    <span>{project.progress}%</span>
                                  </div>

                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                      className="bg-blue-600 h-1.5 rounded-full"
                                      style={{ width: `${project.progress}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </LoadScript>
            </div>
          </Card>
        </div>

        {/* RIGHT SIDEBAR (1 column) */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6 shadow-lg border-0 rounded-2xl">
            <h3 className="text-gray-900 mb-4">Legend</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src="http://maps.google.com/mapfiles/ms/icons/green-dot.png"
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Active Projects</span>
              </div>
              <div className="flex items-center gap-3">
                <img
                  src="http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Delayed Projects</span>
              </div>
              <div className="flex items-center gap-3">
                <img
                  src="http://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">On Hold</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-lg border-0 rounded-2xl">
            <h3 className="text-gray-900 mb-4">Project Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Active</span>
                <span className="text-green-600 font-medium">
                  {projects.filter((p) => p.status === 'active').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delayed</span>
                <span className="text-red-600 font-medium">
                  {projects.filter((p) => p.status === 'delayed').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">On Hold</span>
                <span className="text-amber-600 font-medium">
                  {projects.filter((p) => p.status === 'on-hold').length}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
