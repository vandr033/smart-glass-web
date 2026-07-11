import { cache } from "react";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { APP_CONFIG } from "@/lib/constants";
import type { ApiErrorResponse, ApiSuccessResponse, PortalSesion } from "@/types";

const buildCookieHeader = async (): Promise<string> => {
  const cookieStore = await cookies();

  return cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
};

const fetchPortalJson = async <T>(input: string): Promise<T> => {
  const headers = new Headers({
    Accept: "application/json",
  });
  const cookieHeader = await buildCookieHeader();

  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }

  const response = await fetch(input, {
    cache: "no-store",
    headers,
  });

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok) {
    let message = "La solicitud no es válida.";

    try {
      const body = (await response.json()) as ApiErrorResponse;
      message = body.message ?? message;
    } catch {
      message = "Ocurrió un error al consultar el portal.";
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
};

export const getServerPortalSession = cache(async (): Promise<PortalSesion | null> => {
  try {
    const response = await fetchPortalJson<ApiSuccessResponse<PortalSesion>>(
      `${APP_CONFIG.apiBaseUrl}/portal-cliente/auth/sesion`,
    );

    return response.data;
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return null;
    }

    throw error;
  }
});

export const requirePortalAuth = async (): Promise<PortalSesion> => {
  const session = await getServerPortalSession();

  if (!session) {
    redirect("/portal-cliente/iniciar-sesion");
  }

  return session;
};

export const requirePortalGuest = async (): Promise<void> => {
  const session = await getServerPortalSession();

  if (session) {
    redirect("/portal-cliente");
  }
};
