"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

import { ExternalLink, MapPin, Search } from "lucide-react";

import { cn } from "@/utils";

type AddressMapValue = {
  addressText: string;
  formattedAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  placeId?: string | null;
};

type AddressMapPickerProps = {
  className?: string;
  disabled?: boolean;
  error?: string | null;
  label?: string;
  onChange: (value: AddressMapValue) => void;
  placeholder?: string;
  value: AddressMapValue;
};

type GoogleMapsApiState = {
  error: string | null;
  ready: boolean;
};

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-js-sdk";
const DEFAULT_CENTER = {
  lat: -16.4897,
  lng: -68.1193,
};

let googleMapsLoaderPromise: Promise<void> | null = null;

const buildGoogleMapsHref = (latitude: number, longitude: number): string => {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
};

const loadGoogleMapsApi = (apiKey: string): Promise<void> => {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.google?.maps) {
    return Promise.resolve();
  }

  if (googleMapsLoaderPromise) {
    return googleMapsLoaderPromise;
  }

  googleMapsLoaderPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(
      GOOGLE_MAPS_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("No se pudo cargar Google Maps.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar Google Maps."));
    document.head.appendChild(script);
  });

  return googleMapsLoaderPromise;
};

export function AddressMapPicker({
  className,
  disabled = false,
  error,
  label,
  onChange,
  placeholder = "Direccion",
  value,
}: AddressMapPickerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const [mapsState, setMapsState] = useState<GoogleMapsApiState>(() => ({
    error: apiKey ? null : "Google Maps no esta configurado",
    ready: false,
  }));
  const addressText = value.addressText;

  useEffect(() => {
    if (!apiKey) {
      return;
    }

    let active = true;

    void loadGoogleMapsApi(apiKey)
      .then(() => {
        if (!active) {
          return;
        }

        setMapsState({
          error: null,
          ready: true,
        });
      })
      .catch((loadError: Error) => {
        if (!active) {
          return;
        }

        setMapsState({
          error: loadError.message,
          ready: false,
        });
      });

    return () => {
      active = false;
    };
  }, [apiKey]);

  const updateValue = (nextValue: Partial<AddressMapValue>) => {
    onChange({
      ...value,
      ...nextValue,
      addressText: nextValue.addressText ?? addressText,
    });
  };

  const reverseGeocode = useEffectEvent((latitude: number, longitude: number) => {
    const geocoder = geocoderRef.current;

    if (!geocoder) {
      updateValue({
        latitude,
        longitude,
      });
      return;
    }

    geocoder.geocode(
      {
        location: {
          lat: latitude,
          lng: longitude,
        },
      },
      (results, status) => {
        const firstResult = results?.[0];

        updateValue({
          addressText: firstResult?.formatted_address ?? addressText,
          formattedAddress: firstResult?.formatted_address ?? null,
          latitude,
          longitude,
          placeId: status === "OK" ? firstResult?.place_id ?? null : null,
        });
      },
    );
  });

  const syncMarker = useEffectEvent((
    latitude: number | null | undefined,
    longitude: number | null | undefined,
  ) => {
    if (!mapRef.current) {
      return;
    }

    if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
      markerRef.current?.setMap(null);
      markerRef.current = null;
      return;
    }

    const position = {
      lat: latitude,
      lng: longitude,
    };

    if (!markerRef.current) {
      markerRef.current = new window.google!.maps.Marker({
        animation: window.google!.maps.Animation.DROP,
        draggable: !disabled,
        map: mapRef.current,
        position,
        title: "Ubicacion seleccionada",
      });
      markerRef.current.addListener("dragend", (event) => {
        if (!event.latLng) {
          return;
        }

        reverseGeocode(event.latLng.lat(), event.latLng.lng());
      });
    } else {
      markerRef.current.setPosition(position);
    }

    mapRef.current.panTo(position);
  });

  useEffect(() => {
    if (!mapsState.ready || !mapContainerRef.current || mapRef.current) {
      return;
    }

    const center =
      value.latitude !== null &&
      value.latitude !== undefined &&
      value.longitude !== null &&
      value.longitude !== undefined
        ? {
            lat: value.latitude,
            lng: value.longitude,
          }
        : DEFAULT_CENTER;

    mapRef.current = new window.google!.maps.Map(mapContainerRef.current, {
      center,
      clickableIcons: false,
      disableDefaultUI: true,
      fullscreenControl: false,
      gestureHandling: disabled ? "none" : "greedy",
      mapTypeControl: false,
      streetViewControl: false,
      zoom: center === DEFAULT_CENTER ? 5 : 15,
      zoomControl: true,
    });
    geocoderRef.current = new window.google!.maps.Geocoder();

    window.google!.maps.event.addListener(mapRef.current, "click", (event) => {
      if (disabled || !event.latLng) {
        return;
      }

      reverseGeocode(event.latLng.lat(), event.latLng.lng());
    });

    syncMarker(value.latitude, value.longitude);
  }, [disabled, mapsState.ready, value.latitude, value.longitude]);

  useEffect(() => {
    if (!mapsState.ready) {
      return;
    }

    syncMarker(value.latitude, value.longitude);
  }, [disabled, mapsState.ready, value.latitude, value.longitude]);

  const geocodeCurrentAddress = () => {
    const geocoder = geocoderRef.current;
    const trimmedAddress = addressText.trim();

    if (!geocoder || !trimmedAddress) {
      return;
    }

    geocoder.geocode(
      {
        address: trimmedAddress,
      },
      (results, status) => {
        const firstResult = results?.[0];

        if (!firstResult || status !== "OK") {
          return;
        }

        const latitude = firstResult.geometry.location.lat();
        const longitude = firstResult.geometry.location.lng();

        updateValue({
          addressText: trimmedAddress,
          formattedAddress: firstResult.formatted_address,
          latitude,
          longitude,
          placeId: firstResult.place_id,
        });
      },
    );
  };

  const coordinatesAvailable =
    value.latitude !== null &&
    value.latitude !== undefined &&
    value.longitude !== null &&
    value.longitude !== undefined;

  return (
    <div className={cn("space-y-3", className)}>
      {label ? <p className="text-sm font-medium text-stone-700">{label}</p> : null}
      <div className="grid gap-3">
        <div className="flex flex-col gap-3 lg:flex-row">
          <input
            className="h-11 flex-1 rounded-md border border-[color:var(--color-border)] bg-white px-3.5 text-sm text-[color:var(--color-text)] outline-none transition focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary-soft)] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={disabled}
            onChange={(event) => {
              const nextText = event.target.value;
              updateValue({
                addressText: nextText,
              });
            }}
            placeholder={placeholder}
            value={addressText}
          />
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[color:var(--color-border)] bg-white px-4 text-sm font-semibold text-[color:var(--color-text)] transition hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled || !mapsState.ready || !addressText.trim()}
            onClick={geocodeCurrentAddress}
            type="button"
          >
            <Search className="h-4 w-4" />
            Buscar en el mapa
          </button>
        </div>

        {mapsState.ready ? (
          <div className="overflow-hidden rounded-lg border border-[color:var(--color-border)] bg-[var(--color-surface)]">
            <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-4 py-2.5 text-sm text-[color:var(--color-text-muted)]">
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Haz clic para colocar el pin
              </span>
              {coordinatesAvailable ? (
                <a
                  className="inline-flex items-center gap-2 font-medium text-[color:var(--color-primary)]"
                  href={buildGoogleMapsHref(value.latitude!, value.longitude!)}
                  rel="noreferrer"
                  target="_blank"
                >
                  Abrir en Google Maps
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
            </div>
            <div className="h-72 w-full bg-[var(--color-surface-muted)]" ref={mapContainerRef} />
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[color:var(--color-border)] bg-[var(--color-surface)] px-4 py-4 text-sm text-[color:var(--color-text-muted)]">
            {mapsState.error ?? "Google Maps no esta configurado"}
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-xs text-[color:var(--color-text-muted)]">
          <span>
            Latitud:{" "}
            {coordinatesAvailable ? value.latitude!.toFixed(6) : "No definida"}
          </span>
          <span>
            Longitud:{" "}
            {coordinatesAvailable ? value.longitude!.toFixed(6) : "No definida"}
          </span>
        </div>

        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      </div>
    </div>
  );
}

export type { AddressMapValue };
