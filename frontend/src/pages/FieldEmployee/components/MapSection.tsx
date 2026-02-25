import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { MapPin, Save, Search, RefreshCw, Eye, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { toast } from 'sonner@2.0.3';
import { fieldEmployeeAPI } from '../../../services/api';

interface Location {
  id: number;
  location_id: string;
  lat: number;
  lng: number;
  timestamp: string;
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

// Replace with your actual Google Maps API key
const GOOGLE_MAPS_API_KEY = 'AIzaSyDDhWGybaofdMrXHWR3TevoslQn6P-lRAQ';

// Check if API key is configured
const isApiKeyConfigured = GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY';

export function MapSection() {
  const [pinPosition, setPinPosition] = useState<PinPosition | null>(null);
  const [locationId, setLocationId] = useState('');
  const [savedLocations, setSavedLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInfoWindow, setShowInfoWindow] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(13);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [animatingPin, setAnimatingPin] = useState(false);
  const [mapError, setMapError] = useState(false);

  // Demo mode for when API key is not configured or has errors
  const useDemoMode = !isApiKeyConfigured || mapError;

  // Fetch locations from backend on mount
  useEffect(() => {
    fetchLocations();
  }, []);

  // Listen for showLocationOnMap event from survey details
  useEffect(() => {
    const handleShowLocation = (event: CustomEvent) => {
      const { lat, lng } = event.detail;
      setMapCenter({ lat, lng });
      setMapZoom(15);
      setPinPosition({ lat, lng });
      setShowInfoWindow(true);
      
      // Refresh locations list in case a new one was saved
      fetchLocations();
      
      // Scroll to map section
      const mapElement = document.getElementById('field-employee-map-section');
      if (mapElement) {
        mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    window.addEventListener('showLocationOnMap', handleShowLocation as EventListener);
    return () => {
      window.removeEventListener('showLocationOnMap', handleShowLocation as EventListener);
    };
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await fieldEmployeeAPI.getMyLocations();
      const locations = response.data || [];
      
      // Transform backend data to frontend format
      const formattedLocations: Location[] = locations.map((loc: any) => ({
        id: loc.id,
        location_id: loc.location_id,
        lat: Number(loc.latitude),
        lng: Number(loc.longitude),
        timestamp: new Date(loc.created_at).toLocaleString(),
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
    
    // Convert click position to fake coordinates
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

    // Check if ID already exists
    if (savedLocations.some(loc => loc.location_id === locationId)) {
      toast.error('Location ID already exists');
      return;
    }

    try {
      const response = await fieldEmployeeAPI.saveLocation({
        location_id: locationId,
        latitude: pinPosition.lat,
        longitude: pinPosition.lng,
      });

      // Add the new location to the list
      const newLocation: Location = {
        id: response.data.id,
        location_id: response.data.location_id,
        lat: Number(response.data.latitude),
        lng: Number(response.data.longitude),
        timestamp: new Date(response.data.created_at).toLocaleString(),
        saved_by_name: response.data.saved_by_name,
      };

      setSavedLocations([newLocation, ...savedLocations]);
      toast.success(`Location "${locationId}" saved successfully`);
      setLocationId('');
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

    // Animate to location
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
      await fieldEmployeeAPI.deleteLocation(id);
      setSavedLocations(savedLocations.filter(loc => loc.id !== id));
      toast.success('Location deleted successfully');
    } catch (error: any) {
      console.error("Failed to delete location:", error);
      toast.error(error.response?.data?.message || 'Failed to delete location');
    }
  };

  const isSaveEnabled = pinPosition !== null && locationId.trim() !== '';

  return (
    <div id="field-employee-map-section" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Location Assignment</h2>
          <p className="text-sm text-gray-500 mt-1">Pin and manage field work locations</p>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
          <p className="text-sm text-blue-600">{savedLocations.length} locations saved</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2">
          <Card className="p-6 shadow-lg border-0 rounded-2xl">
            <div className="mb-4">
              <h3 className="text-gray-900">Interactive Map</h3>
              <p className="text-sm text-gray-500 mt-1">
                <MapPin className="w-4 h-4 inline mr-1" />
                Click on the map to choose a location
              </p>
            </div>

            <div className="relative rounded-2xl overflow-hidden shadow-md">
              {!isApiKeyConfigured || mapError ? (
                // Placeholder map for demo mode
                <div 
                  className="w-full h-[500px] bg-gradient-to-br from-blue-100 to-green-100 relative cursor-crosshair"
                  onClick={handlePlaceholderMapClick}
                  style={{
                    backgroundImage: `
                      linear-gradient(rgba(37, 99, 235, 0.03) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(37, 99, 235, 0.03) 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px'
                  }}
                >
                  {/* Demo mode notice */}
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 shadow-lg max-w-md z-10">
                    {mapError ? (
                      <>
                        <p className="text-sm text-yellow-900">
                          <strong>Demo Mode:</strong> Google Maps API error detected
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          This is usually due to billing not being enabled. Enable billing at: <a href="https://console.cloud.google.com/billing" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a>
                        </p>
                        <p className="text-xs text-yellow-600 mt-2">
                          The demo mode is fully functional for testing purposes.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-yellow-900">
                          <strong>Demo Mode:</strong> Add your Google Maps API key to enable full map functionality
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Get your API key at: <a href="https://console.cloud.google.com/google/maps-apis" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a>
                        </p>
                      </>
                    )}
                  </div>

                  {/* Placeholder pin */}
                  {pinPosition && (
                    <div
                      className={`absolute transform -translate-x-1/2 -translate-y-full transition-all ${
                        animatingPin ? 'animate-bounce' : ''
                      }`}
                      style={{
                        left: '50%',
                        top: '50%',
                      }}
                    >
                      <MapPin className="w-10 h-10 text-red-600 fill-red-600 drop-shadow-lg" />
                      
                      {showInfoWindow && (
                        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl p-3 min-w-[200px] border border-gray-200">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowInfoWindow(false);
                            }}
                            className="absolute top-1 right-1 text-gray-400 hover:text-gray-600"
                          >
                            ×
                          </button>
                          <p className="text-xs text-gray-600">Latitude</p>
                          <p className="text-gray-900 mb-2">{pinPosition.lat.toFixed(6)}</p>
                          <p className="text-xs text-gray-600">Longitude</p>
                          <p className="text-gray-900">{pinPosition.lng.toFixed(6)}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Grid overlay for demo map feel */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md p-2 flex flex-col gap-1">
                      <button className="w-8 h-8 bg-white hover:bg-gray-100 rounded border border-gray-300 flex items-center justify-center text-gray-600">+</button>
                      <button className="w-8 h-8 bg-white hover:bg-gray-100 rounded border border-gray-300 flex items-center justify-center text-gray-600">−</button>
                    </div>
                  </div>
                </div>
              ) : (
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
                          icon={{
                            url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                          }}
                        />
                        {showInfoWindow && (
                          <InfoWindow
                            position={pinPosition}
                            onCloseClick={() => setShowInfoWindow(false)}
                          >
                            <div className="p-2">
                              <p className="text-xs text-gray-600">Latitude</p>
                              <p className="text-gray-900 mb-2">{pinPosition.lat.toFixed(6)}</p>
                              <p className="text-xs text-gray-600">Longitude</p>
                              <p className="text-gray-900">{pinPosition.lng.toFixed(6)}</p>
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

        {/* Controls Panel */}
        <div className="space-y-6">
          {/* Save Location Card */}
          <Card className="p-6 shadow-lg border-0 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Save className="w-5 h-5 text-[#2563EB]" />
              <h3 className="text-gray-900">Save Location</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Location ID</label>
                <Input
                  placeholder="Enter unique location number"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <Button
                onClick={handleSaveLocation}
                disabled={!isSaveEnabled}
                className="w-full rounded-xl color-blue"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Location
              </Button>

              <Button
                onClick={handleClearPin}
                variant="outline"
                className="w-full rounded-xl"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear Pin
              </Button>
            </div>
          </Card>

          {/* Fetch Location Card */}
          <Card className="p-6 shadow-lg border-0 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-[#2563EB]" />
              <h3 className="text-gray-900">Fetch Location</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Search by ID</label>
                <Input
                  placeholder="Enter location ID"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  className="rounded-xl"
                  onKeyPress={(e) => e.key === 'Enter' && handleFetchById()}
                />
              </div>

              <Button
                onClick={handleFetchById}
                variant="secondary"
                className="w-full rounded-xl"
              >
                <Search className="w-4 h-4 mr-2" />
                Fetch by ID
              </Button>
            </div>
          </Card>

          {/* Current Pin Info */}
          {pinPosition && (
            <Card className="p-6 shadow-lg border-0 rounded-2xl bg-blue-50 border-blue-100">
              <p className="text-sm text-blue-900 mb-2">Current Pin</p>
              <div className="space-y-1">
                <p className="text-xs text-blue-700">Lat: {pinPosition.lat.toFixed(6)}</p>
                <p className="text-xs text-blue-700">Lng: {pinPosition.lng.toFixed(6)}</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Saved Locations List */}
      <Card className="p-6 shadow-lg border-0 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-900">Saved Locations</h3>
          <span className="text-sm text-gray-500">{savedLocations.length} total</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <p>Loading locations...</p>
          </div>
        ) : savedLocations.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No locations saved yet</p>
            <p className="text-sm mt-1">Click on the map to add your first location</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Location ID</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Latitude</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Longitude</th>
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Saved On</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {savedLocations.map((location) => (
                  <tr key={location.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-gray-900 text-center">{location.location_id}</td>
                    <td className="py-3 px-4 text-gray-600 text-center">{location.lat.toFixed(6)}</td>
                    <td className="py-3 px-4 text-gray-600 text-center">{location.lng.toFixed(6)}</td>
                    <td className="py-3 px-4 text-gray-500 text-center">{location.timestamp}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewOnMap(location)}
                          className="rounded-lg hover:bg-blue-50 hover:text-[#2563EB]"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteLocation(location.id)}
                          className="rounded-lg hover:bg-red-50 hover:text-red-600"
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