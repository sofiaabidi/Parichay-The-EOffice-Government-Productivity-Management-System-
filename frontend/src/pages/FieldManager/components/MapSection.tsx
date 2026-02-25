import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { MapPin, Save, Search, RefreshCw, Eye, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { toast } from 'sonner';
import { fieldManagerAPI } from '../../../services/api';

interface Location {
  id: number;
  location_id: string;
  lat: number;
  lng: number;
  timestamp: string;
  interest: 'Project' | 'Survey' | null;
  saved_by_name?: string;
}

interface PinPosition {
  lat: number;
  lng: number;
}

const mapContainerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '16px',
};

const defaultCenter = {
  lat: 26.166094,
  lng: 90.815865
};

const GOOGLE_MAPS_API_KEY = 'AIzaSyDDhWGybaofdMrXHWR3TevoslQn6P-lRAQ';

const isApiKeyConfigured = GOOGLE_MAPS_API_KEY.length > 0 && GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY';

export function MapSection() {
  const [pinPosition, setPinPosition] = useState<PinPosition | null>(null);
  const [locationId, setLocationId] = useState('');
  const [interest, setInterest] = useState<'Project' | 'Survey'>('Project');
  const [savedLocations, setSavedLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInfoWindow, setShowInfoWindow] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(13);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [animatingPin, setAnimatingPin] = useState(false);
  const [mapError, setMapError] = useState(false);

  const useDemoMode = !isApiKeyConfigured || mapError;

  // Fetch locations from backend on mount
  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await fieldManagerAPI.getMyLocations();
      const locations = response.data || [];
      
      // Transform backend data to frontend format
      const formattedLocations: Location[] = locations.map((loc: any) => ({
        id: loc.id,
        location_id: loc.location_id,
        lat: Number(loc.latitude),
        lng: Number(loc.longitude),
        timestamp: new Date(loc.created_at).toLocaleString(),
        interest: loc.interest,
        saved_by_name: loc.saved_by_name,
      }));
      
      setSavedLocations(formattedLocations);
    } catch (error: any) {
      console.error("Failed to fetch locations:", error);
      toast.error("Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceholderMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lat = 40.7128 + (y / rect.height - 0.5) * 0.1;
    const lng = -74.0060 + (x / rect.width - 0.5) * 0.1;

    setPinPosition({ lat, lng });
    setShowInfoWindow(true);
    setAnimatingPin(true);
    setTimeout(() => setAnimatingPin(false), 600);
  };

  const onLoadError = useCallback((error: Error) => {
    console.error('Google Maps API Error:', error);
    setMapError(true);
    toast.error('Map service unavailable. Using demo mode.');
  }, []);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      setPinPosition({ lat, lng });
      setShowInfoWindow(true);
      setAnimatingPin(true);
      setTimeout(() => setAnimatingPin(false), 600);
    }
  }, []);

  const handleSaveLocation = async () => {
    if (!pinPosition) {
      toast.error('Please select a location on the map');
      return;
    }

    if (!locationId.trim()) {
      toast.error('Please enter a Location ID');
      return;
    }

    if (savedLocations.some(loc => loc.location_id === locationId)) {
      toast.error('Location ID already exists');
      return;
    }

    try {
      const response = await fieldManagerAPI.saveLocation({
        location_id: locationId,
        latitude: pinPosition.lat,
        longitude: pinPosition.lng,
        interest: interest,
      });

      // Add the new location to the list
      const newLocation: Location = {
        id: response.data.id,
        location_id: response.data.location_id,
        lat: Number(response.data.latitude),
        lng: Number(response.data.longitude),
        timestamp: new Date(response.data.created_at).toLocaleString(),
        interest: response.data.interest,
        saved_by_name: response.data.saved_by_name,
      };

      setSavedLocations([newLocation, ...savedLocations]);
      toast.success(`Location "${locationId}" saved successfully`);
      setLocationId('');
      setInterest('Project'); // Reset to default
    } catch (error: any) {
      console.error("Failed to save location:", error);
      if (error.response?.status === 409 || error.response?.data?.message?.includes('unique')) {
        toast.error('Location ID already exists');
      } else {
        toast.error(error.response?.data?.message || 'Failed to save location');
      }
    }
  };

  const handleFetchById = () => {
    if (!searchId.trim()) {
      toast.error('Please enter a Location ID to fetch');
      return;
    }

    const location = savedLocations.find(loc => loc.location_id === searchId);

    if (!location) {
      toast.error('Invalid ID - Location not found');
      return;
    }

    setPinPosition({ lat: location.lat, lng: location.lng });
    setMapCenter({ lat: location.lat, lng: location.lng });
    setMapZoom(16);
    setShowInfoWindow(true);
    setAnimatingPin(true);
    setTimeout(() => setAnimatingPin(false), 600);

    toast.success(`Location "${location.location_id}" loaded`);
    setSearchId('');
  };

  const handleClearPin = () => {
    setPinPosition(null);
    setShowInfoWindow(false);
    setLocationId('');
    setInterest('Project');
    toast.info('Pin cleared');
  };

  const handleViewOnMap = (location: Location) => {
    setPinPosition({ lat: location.lat, lng: location.lng });
    setMapCenter({ lat: location.lat, lng: location.lng });
    setMapZoom(16);
    setShowInfoWindow(true);
    setAnimatingPin(true);
    setTimeout(() => setAnimatingPin(false), 600);
    toast.info(`Viewing location "${location.location_id}"`);
  };

  const handleDeleteLocation = async (id: number) => {
    try {
      await fieldManagerAPI.deleteLocation(id);
      setSavedLocations(savedLocations.filter(loc => loc.id !== id));
      toast.success('Location deleted successfully');
    } catch (error: any) {
      console.error("Failed to delete location:", error);
      toast.error(error.response?.data?.message || 'Failed to delete location');
    }
  };

  const isSaveEnabled = pinPosition !== null && locationId.trim() !== '';
  
  const getInterestBadge = (interestType: 'Project' | 'Survey' | undefined) => {
    if (interestType === 'Project' || !interestType) {
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200">
          Project
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-300 hover:bg-green-200">
          Survey
        </Badge>
      );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Location Assignment</h2>
          <p className="text-sm text-gray-500 mt-1">Pin and manage field work locations</p>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
          <p className="text-sm text-blue-600">{savedLocations.length} locations saved</p>
        </div>
      </div>

      {/* ======================== MAP LEFT + SAVE/FETCH RIGHT ======================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT: MAP */}
        <div className="lg:col-span-2">
          <Card className="p-6 shadow-lg border-0 rounded-2xl">
            <div className="mb-4">
              <h3 className="text-gray-900">Interactive Map</h3>
              <p className="text-sm text-gray-500 mt-1">
                <MapPin className="w-4 h-4 inline mr-1" /> Click on the map to choose a location
              </p>
            </div>

            <div className="relative rounded-2xl overflow-hidden shadow-md">
              {!isApiKeyConfigured || mapError ? (
                /* DEMO MODE MAP */
                <div
                  className="w-full h-[500px] bg-gradient-to-br from-blue-100 to-green-100 relative cursor-crosshair"
                  onClick={handlePlaceholderMapClick}
                >
                  {/* demo pin */}
                  {pinPosition && (
                    <div
                      className={`absolute transform -translate-x-1/2 -translate-y-full ${
                        animatingPin ? 'animate-bounce' : ''
                      }`}
                      style={{ left: '50%', top: '50%' }}
                    >
                      <MapPin className="w-10 h-10 text-red-600 fill-red-600" />
                    </div>
                  )}
                </div>
              ) : (
                /* REAL GOOGLE MAP */
                <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} onError={onLoadError}>
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={mapCenter}
                    zoom={mapZoom}
                    onClick={handleMapClick}
                    onLoad={onLoad}
                    options={{
                      streetViewControl: false,
                      mapTypeControl: true,
                      fullscreenControl: false,
                    }}
                  >
                    {pinPosition && (
                      <>
                        <Marker
                          position={pinPosition}
                          animation={animatingPin ? google.maps.Animation.BOUNCE : undefined}
                        />
                        {showInfoWindow && (
                          <InfoWindow
                            position={pinPosition}
                            onCloseClick={() => setShowInfoWindow(false)}
                          >
                            <div>
                              <p>Lat: {pinPosition.lat.toFixed(6)}</p>
                              <p>Lng: {pinPosition.lng.toFixed(6)}</p>
                            </div>
                          </InfoWindow>
                        )}
                      </>
                    )}
                  </GoogleMap>
                </LoadScript>
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT: SAVE + FETCH */}
        <div className="flex flex-col gap-6">

          {/* SAVE */}
          <Card className="p-6 shadow-lg border-0 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Save className="w-5 h-5 text-[#2563EB]" />
              <h3 className="text-gray-900">Save Location</h3>
            </div>

            <div className="space-y-4">
              <Input
                placeholder="Enter unique location number"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="rounded-xl"
              />

              <div className="space-y-2">
                <label className="text-sm text-gray-700">Interest</label>
                <Select value={interest} onValueChange={(value: 'Project' | 'Survey') => setInterest(value)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select interest" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Project">Project</SelectItem>
                    <SelectItem value="Survey">Survey</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleSaveLocation}
                disabled={!isSaveEnabled}
                className="w-full rounded-xl color-blue"
              >
                <Save className="w-4 h-4 mr-2" /> Save Location
              </Button>

              <Button onClick={handleClearPin} variant="outline" className="w-full rounded-xl">
                <RefreshCw className="w-4 h-4 mr-2" /> Clear Pin
              </Button>
            </div>
          </Card>

          {/* FETCH */}
          <Card className="p-6 shadow-lg border-0 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-[#2563EB]" />
              <h3 className="text-gray-900">Fetch Location</h3>
            </div>

            <div className="space-y-4">
              <Input
                placeholder="Enter location ID"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="rounded-xl"
                onKeyPress={(e) => e.key === 'Enter' && handleFetchById()}
              />

              <Button onClick={handleFetchById} variant="secondary" className="w-full rounded-xl">
                <Search className="w-4 h-4 mr-2" /> Fetch by ID
              </Button>
            </div>
          </Card>

          {/* CURRENT PIN */}
          {pinPosition && (
            <Card className="p-6 shadow-lg border-0 rounded-2xl bg-blue-50 border-blue-100">
              <p className="text-sm text-blue-900 mb-1">Current Pin</p>
              <p className="text-xs text-blue-700">Lat: {pinPosition.lat.toFixed(6)}</p>
              <p className="text-xs text-blue-700">Lng: {pinPosition.lng.toFixed(6)}</p>
            </Card>
          )}
        </div>

      </div>
      {/* ======================== END OF MAP + CONTROLS ROW ======================== */}

      {/* ======================== TABLE BELOW ======================== */}
      <Card className="p-6 shadow-lg border-0 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-900">Saved Locations</h3>
          <span className="text-sm text-gray-500">{savedLocations.length} total</span>
        </div>

        {savedLocations.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No locations saved yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 text-sm">ID</th>
                  <th className="py-3 text-sm">Lat</th>
                  <th className="py-3 text-sm">Lng</th>
                  <th className="py-3 text-sm">Saved On</th>
                  <th className="py-3 text-sm">Interest</th>
                  <th className="py-3 text-sm">Saved By</th>
                  <th className="py-3 text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      Loading locations...
                    </td>
                  </tr>
                ) : savedLocations.map((loc) => (
                  <tr key={loc.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 text-center">{loc.location_id}</td>
                    <td className="py-3 text-center">{loc.lat.toFixed(6)}</td>
                    <td className="py-3 text-center">{loc.lng.toFixed(6)}</td>
                    <td className="py-3 text-center">{loc.timestamp}</td>
                    <td className="py-3 text-center">
                      {getInterestBadge(loc.interest)}
                    </td>
                    <td className="py-3 text-center text-sm text-gray-600">
                      {loc.saved_by_name || 'N/A'}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleViewOnMap(loc)}>
                          <Eye className="w-4 h-4 mr-1" /> View
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600"
                          onClick={() => handleDeleteLocation(loc.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

    </div>
  );
}
