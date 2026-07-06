declare global {
  interface Window {
    google?: typeof google;
  }

  namespace google.maps {
    type Animation = number;

    type GeocoderStatus = string;

    type LatLngLiteral = {
      lat: number;
      lng: number;
    };

    type MapOptions = {
      center?: LatLngLiteral;
      clickableIcons?: boolean;
      disableDefaultUI?: boolean;
      draggableCursor?: string;
      fullscreenControl?: boolean;
      gestureHandling?: string;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      zoom?: number;
      zoomControl?: boolean;
    };

    type MarkerOptions = {
      animation?: Animation;
      draggable?: boolean;
      map?: Map | null;
      position?: LatLngLiteral;
      title?: string;
    };

    type GeocoderRequest = {
      address?: string;
      location?: LatLngLiteral;
    };

    type GeocoderAddressComponent = {
      long_name: string;
      short_name: string;
      types: string[];
    };

    type GeocoderResult = {
      address_components: GeocoderAddressComponent[];
      formatted_address: string;
      geometry: {
        location: {
          lat: () => number;
          lng: () => number;
        };
      };
      place_id: string;
      types: string[];
    };

    type MapMouseEvent = {
      latLng: {
        lat: () => number;
        lng: () => number;
      } | null;
    };

    class Map {
      constructor(element: HTMLElement, options?: MapOptions);
      fitBounds(bounds: unknown): void;
      panTo(latLng: LatLngLiteral): void;
      setCenter(latLng: LatLngLiteral): void;
      setZoom(zoom: number): void;
    }

    class Marker {
      constructor(options?: MarkerOptions);
      setMap(map: Map | null): void;
      setPosition(position: LatLngLiteral): void;
      addListener(
        eventName: string,
        handler: (event: MapMouseEvent) => void,
      ): { remove: () => void };
    }

    class Geocoder {
      geocode(
        request: GeocoderRequest,
        callback: (results: GeocoderResult[] | null, status: GeocoderStatus) => void,
      ): void;
    }

    namespace event {
      function addListener(
        instance: Map | Marker,
        eventName: string,
        handler: (event: MapMouseEvent) => void,
      ): { remove: () => void };
      function clearInstanceListeners(instance: Map | Marker): void;
    }

    const Animation: {
      DROP: Animation;
    };
  }
}

export {};
