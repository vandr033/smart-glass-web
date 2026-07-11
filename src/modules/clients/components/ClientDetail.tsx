"use client";

import { useState } from "react";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  Mail,
  MapPinned,
  Pencil,
  Phone,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AddressMapPicker } from "@/components/ui/address-map-picker";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PhoneInputWithCountry } from "@/components/ui/phone-input-with-country";
import { usePermissions } from "@/hooks/use-permissions";
import {
  dangerButtonClassName,
  fieldClassName,
  formatDateOnlyValue,
  primaryButtonClassName,
  secondaryButtonClassName,
  sectionClassName,
  textAreaClassName,
} from "@/modules/commercial/ui";
import { POSTVENTA_ROUTES } from "@/modules/postventa/constants";
import { PROJECTS_ROUTES, PROJECT_STATUS_LABELS } from "@/modules/projects/constants";
import { clientService } from "@/services/client-service";
import { getApiErrorMessage } from "@/utils";

import { ClientStatusBadge, ClientTypeBadge } from "../badges";
import { CLIENTS_PERMISSIONS, CLIENTS_ROUTES, CLIENTS_QUERY_KEYS } from "../constants";
import { useClients } from "../hooks/useClients";

type ClientDetailProps = {
  clientId: string;
};

type DeleteTarget =
  | {
      id: string;
      kind: "address";
      label: string;
    }
  | {
      id: string;
      kind: "client";
      label: string;
    }
  | {
      id: string;
      kind: "contact";
      label: string;
    };

const emptyContactForm = {
  email: "",
  isPrimary: false,
  name: "",
  notes: "",
  phone: "",
  position: "",
  whatsapp: "",
};

const emptyAddressForm = {
  address: "",
  city: "",
  isBilling: false,
  isProjectSite: false,
  label: "",
  latitude: "",
  longitude: "",
  notes: "",
};

const trimToNull = (value: string): string | null => {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
};

const numberOrNull = (value: string): number | null => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  return Number(trimmedValue);
};

export function ClientDetail({ clientId }: ClientDetailProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { permissions } = usePermissions();
  const { useClient, useDeleteClient } = useClients();
  const clientQuery = useClient(clientId);
  const deleteClientMutation = useDeleteClient();
  const [contactForm, setContactForm] = useState(emptyContactForm);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [sectionError, setSectionError] = useState<string | null>(null);
  const canEdit = permissions.includes(CLIENTS_PERMISSIONS.update);
  const canDelete = permissions.includes(CLIENTS_PERMISSIONS.delete);
  const canCreatePostventa = permissions.includes("postventa.crear");

  const invalidateClient = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: CLIENTS_QUERY_KEYS.all,
      }),
      queryClient.invalidateQueries({
        queryKey: CLIENTS_QUERY_KEYS.detail(clientId),
      }),
    ]);
  };

  const createContactMutation = useMutation({
    mutationFn: async () =>
      clientService.createClientContact(clientId, {
        email: trimToNull(contactForm.email),
        isPrimary: contactForm.isPrimary,
        name: contactForm.name.trim(),
        notes: trimToNull(contactForm.notes),
        phone: trimToNull(contactForm.phone),
        position: trimToNull(contactForm.position),
        whatsapp: trimToNull(contactForm.whatsapp),
      }),
    onSuccess: async () => {
      setContactForm(emptyContactForm);
      await invalidateClient();
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async () => {
      if (!editingContactId) {
        throw new Error("Selecciona un contacto para actualizar.");
      }

      return clientService.updateClientContact(clientId, editingContactId, {
        email: trimToNull(contactForm.email),
        isPrimary: contactForm.isPrimary,
        name: contactForm.name.trim(),
        notes: trimToNull(contactForm.notes),
        phone: trimToNull(contactForm.phone),
        position: trimToNull(contactForm.position),
        whatsapp: trimToNull(contactForm.whatsapp),
      });
    },
    onSuccess: async () => {
      setContactForm(emptyContactForm);
      setEditingContactId(null);
      await invalidateClient();
    },
  });

  const createAddressMutation = useMutation({
    mutationFn: async () =>
      clientService.createClientAddress(clientId, {
        address: addressForm.address.trim(),
        city: trimToNull(addressForm.city),
        isBilling: addressForm.isBilling,
        isProjectSite: addressForm.isProjectSite,
        label: addressForm.label.trim(),
        latitude: numberOrNull(addressForm.latitude),
        longitude: numberOrNull(addressForm.longitude),
        notes: trimToNull(addressForm.notes),
      }),
    onSuccess: async () => {
      setAddressForm(emptyAddressForm);
      await invalidateClient();
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: async () => {
      if (!editingAddressId) {
        throw new Error("Selecciona una direccion para actualizar.");
      }

      return clientService.updateClientAddress(clientId, editingAddressId, {
        address: addressForm.address.trim(),
        city: trimToNull(addressForm.city),
        isBilling: addressForm.isBilling,
        isProjectSite: addressForm.isProjectSite,
        label: addressForm.label.trim(),
        latitude: numberOrNull(addressForm.latitude),
        longitude: numberOrNull(addressForm.longitude),
        notes: trimToNull(addressForm.notes),
      });
    },
    onSuccess: async () => {
      setAddressForm(emptyAddressForm);
      setEditingAddressId(null);
      await invalidateClient();
    },
  });

  if (clientQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void clientQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={clientQuery.error.message}
        title="No se pudieron cargar los datos del cliente"
      />
    );
  }

  if (clientQuery.isLoading || !clientQuery.data) {
    return (
      <section className={sectionClassName}>
        <p className="text-sm text-stone-500">Cargando datos del cliente...</p>
      </section>
    );
  }

  const client = clientQuery.data;

  return (
    <main className="space-y-6">
      <section className={sectionClassName}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-[var(--color-primary)] p-4 text-blue-100">
              <Building2 className="h-7 w-7" />
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                  Ficha del cliente
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">
                  {client.displayName}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <ClientTypeBadge clientType={client.clientType} />
                <ClientStatusBadge status={client.status} />
                {client.taxId ? (
                  <span className="rounded-full bg-white/85 px-3 py-1.5 text-xs font-semibold text-stone-700">
                    NIT: {client.taxId}
                  </span>
                ) : null}
              </div>

              <p className="max-w-3xl text-sm leading-7 text-stone-700">
                {client.notes ||
                  "Aun no hay notas internas. Usa esta ficha para centralizar ingresos, decisiones y contexto de futuras cotizaciones."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link className={secondaryButtonClassName} href={CLIENTS_ROUTES.list}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a clientes
            </Link>
            {canCreatePostventa ? (
              <Link
                className={secondaryButtonClassName}
                href={POSTVENTA_ROUTES.registrarDesde({
                  clientId: client.id,
                  origen: "cliente",
                })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Registrar postventa
              </Link>
            ) : null}
            {canEdit ? (
              <Link className={primaryButtonClassName} href={CLIENTS_ROUTES.edit(client.id)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar cliente
              </Link>
            ) : null}
            {canDelete ? (
              <button
                className={dangerButtonClassName}
                onClick={() => {
                  setDeleteTarget({
                    id: client.id,
                    kind: "client",
                    label: client.displayName,
                  });
                }}
                type="button"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar cliente
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className={sectionClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Contacto principal
          </p>
          <p className="mt-3 text-lg font-semibold text-stone-950">
            {client.phone || client.email || "No definido"}
          </p>
        </article>
        <article className={sectionClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Ubicacion
          </p>
          <p className="mt-3 text-lg font-semibold text-stone-950">
            {[client.city, client.country].filter(Boolean).join(", ") || "No definido"}
          </p>
        </article>
        <article className={sectionClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Proyectos relacionados
          </p>
          <p className="mt-3 text-3xl font-semibold text-stone-950">
            {client.relatedProjects.length}
          </p>
        </article>
        <article className={sectionClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Creado
          </p>
          <p className="mt-3 text-lg font-semibold text-stone-950">
            {formatDateOnlyValue(client.createdAt)}
          </p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className={sectionClassName}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                Contactos
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                Personas y canales de contacto
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            {client.contacts.length > 0 ? (
              client.contacts.map((contact) => (
                <article
                  key={contact.id}
                  className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-stone-950">
                        {contact.name}
                        {contact.isPrimary ? (
                          <span className="ml-2 rounded-full bg-blue-100 px-2 py-1 text-[11px] font-semibold text-blue-900">
                            Principal
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 text-sm text-stone-600">
                        {contact.position || "Sin cargo"}
                      </p>
                    </div>
                    {canEdit ? (
                      <div className="flex gap-2">
                        <button
                          className={secondaryButtonClassName}
                          onClick={() => {
                            setSectionError(null);
                            setEditingContactId(contact.id);
                            setContactForm({
                              email: contact.email ?? "",
                              isPrimary: contact.isPrimary,
                              name: contact.name,
                              notes: contact.notes ?? "",
                              phone: contact.phone ?? "",
                              position: contact.position ?? "",
                              whatsapp: contact.whatsapp ?? "",
                            });
                          }}
                          type="button"
                        >
                          Editar
                        </button>
                        <button
                          className={secondaryButtonClassName}
                          onClick={() => {
                            setDeleteTarget({
                              id: contact.id,
                              kind: "contact",
                              label: contact.name,
                            });
                          }}
                          type="button"
                        >
                          Eliminar
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <p className="flex items-center gap-2 text-sm text-stone-700">
                      <Phone className="h-4 w-4 text-stone-400" />
                      {contact.phone || contact.whatsapp || "Sin telefonos registrados"}
                    </p>
                    <p className="flex items-center gap-2 text-sm text-stone-700">
                      <Mail className="h-4 w-4 text-stone-400" />
                      {contact.email || "Sin correo registrado"}
                    </p>
                  </div>
                  {contact.notes ? (
                    <p className="mt-3 text-sm leading-6 text-stone-600">{contact.notes}</p>
                  ) : null}
                </article>
              ))
            ) : (
              <EmptyState
                description="Agrega contactos identificados para que los equipos comercial, de medicion e instalacion sepan con quien coordinar."
                title="Aun no hay contactos"
              />
            )}
          </div>

          {canEdit ? (
            <form
              className="mt-6 space-y-4 rounded-md border border-dashed border-stone-300 bg-white/75 px-4 py-4"
              onSubmit={async (event) => {
                event.preventDefault();
                setSectionError(null);

                try {
                  if (editingContactId) {
                    await updateContactMutation.mutateAsync();
                  } else {
                    await createContactMutation.mutateAsync();
                  }
                } catch (error) {
                  setSectionError(getApiErrorMessage(error));
                }
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-stone-950">
                  {editingContactId ? "Editar contacto" : "Agregar contacto"}
                </p>
                {editingContactId ? (
                  <button
                    className={secondaryButtonClassName}
                    onClick={() => {
                      setEditingContactId(null);
                      setContactForm(emptyContactForm);
                      setSectionError(null);
                    }}
                    type="button"
                  >
                    Cancelar edicion
                  </button>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  className={fieldClassName}
                  onChange={(event) => {
                    setContactForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }));
                  }}
                  placeholder="Nombre del contacto"
                  value={contactForm.name}
                />
                <input
                  className={fieldClassName}
                  onChange={(event) => {
                    setContactForm((current) => ({
                      ...current,
                      position: event.target.value,
                    }));
                  }}
                  placeholder="Cargo"
                  value={contactForm.position}
                />
                <PhoneInputWithCountry
                  label="Telefono"
                  onChange={(fullNumber) => {
                    setContactForm((current) => ({
                      ...current,
                      phone: fullNumber,
                    }));
                  }}
                  value={contactForm.phone}
                />
                <PhoneInputWithCountry
                  label="WhatsApp"
                  onChange={(fullNumber) => {
                    setContactForm((current) => ({
                      ...current,
                      whatsapp: fullNumber,
                    }));
                  }}
                  value={contactForm.whatsapp}
                />
              </div>

              <input
                className={fieldClassName}
                onChange={(event) => {
                  setContactForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }));
                }}
                placeholder="Correo electrónico"
                value={contactForm.email}
              />

              <label className="flex items-center gap-3 text-sm text-stone-700">
                <input
                  checked={contactForm.isPrimary}
                  onChange={(event) => {
                    setContactForm((current) => ({
                      ...current,
                      isPrimary: event.target.checked,
                    }));
                  }}
                  type="checkbox"
                />
                Marcar como contacto principal
              </label>

              <textarea
                className={textAreaClassName}
                onChange={(event) => {
                  setContactForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }));
                }}
                placeholder="Notas"
                value={contactForm.notes}
              />

              {sectionError ? (
                <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {sectionError}
                </div>
              ) : null}

              <button
                className={primaryButtonClassName}
                disabled={createContactMutation.isPending || updateContactMutation.isPending}
                type="submit"
              >
                <Plus className="mr-2 h-4 w-4" />
                {editingContactId ? "Guardar contacto" : "Agregar contacto"}
              </button>
            </form>
          ) : null}
        </section>

        <section className="space-y-6">
          <section className={sectionClassName}>
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                Direcciones
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                Referencias de facturacion y obra
              </h2>
            </div>

            <div className="space-y-4">
              {client.addresses.length > 0 ? (
                client.addresses.map((address) => (
                  <article
                    key={address.id}
                    className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-stone-950">{address.label}</p>
                        <p className="mt-1 text-sm leading-6 text-stone-700">
                          {address.address}
                        </p>
                      </div>
                      {canEdit ? (
                        <div className="flex gap-2">
                          <button
                            className={secondaryButtonClassName}
                            onClick={() => {
                              setSectionError(null);
                              setEditingAddressId(address.id);
                              setAddressForm({
                                address: address.address,
                                city: address.city ?? "",
                                isBilling: address.isBilling,
                                isProjectSite: address.isProjectSite,
                                label: address.label,
                                latitude: address.latitude === null ? "" : String(address.latitude),
                                longitude:
                                  address.longitude === null ? "" : String(address.longitude),
                                notes: address.notes ?? "",
                              });
                            }}
                            type="button"
                          >
                            Editar
                          </button>
                          <button
                            className={secondaryButtonClassName}
                            onClick={() => {
                              setDeleteTarget({
                                id: address.id,
                                kind: "address",
                                label: address.label,
                              });
                            }}
                            type="button"
                          >
                            Eliminar
                          </button>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {address.isBilling ? (
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-900">
                          Facturacion
                        </span>
                      ) : null}
                      {address.isProjectSite ? (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                          Sitio de proyecto
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 flex items-center gap-2 text-sm text-stone-700">
                      <MapPinned className="h-4 w-4 text-stone-400" />
                      {[address.city, client.country].filter(Boolean).join(", ") || "Sin ciudad"}
                    </p>
                  </article>
                ))
              ) : (
                <EmptyState
                  description="Guarda aqui las direcciones de facturacion y obra para iniciar mediciones e instalaciones con datos confiables."
                  title="Aun no hay direcciones"
                />
              )}
            </div>

            {canEdit ? (
              <form
                className="mt-6 space-y-4 rounded-md border border-dashed border-stone-300 bg-white/75 px-4 py-4"
                onSubmit={async (event) => {
                  event.preventDefault();
                  setSectionError(null);

                  try {
                    if (editingAddressId) {
                      await updateAddressMutation.mutateAsync();
                    } else {
                      await createAddressMutation.mutateAsync();
                    }
                  } catch (error) {
                    setSectionError(getApiErrorMessage(error));
                  }
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-stone-950">
                    {editingAddressId ? "Editar direccion" : "Agregar direccion"}
                  </p>
                  {editingAddressId ? (
                    <button
                      className={secondaryButtonClassName}
                      onClick={() => {
                        setEditingAddressId(null);
                        setAddressForm(emptyAddressForm);
                        setSectionError(null);
                      }}
                      type="button"
                    >
                      Cancelar edicion
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    className={fieldClassName}
                    onChange={(event) => {
                    setAddressForm((current) => ({
                      ...current,
                      label: event.target.value,
                    }));
                  }}
                    placeholder="Etiqueta"
                    value={addressForm.label}
                  />
                  <input
                    className={fieldClassName}
                    onChange={(event) => {
                    setAddressForm((current) => ({
                      ...current,
                      city: event.target.value,
                    }));
                  }}
                    placeholder="Ciudad"
                    value={addressForm.city}
                  />
                </div>

                <AddressMapPicker
                  label="Direccion"
                  onChange={(nextValue) => {
                    setAddressForm((current) => ({
                      ...current,
                      address: nextValue.addressText,
                      latitude:
                        nextValue.latitude === null || nextValue.latitude === undefined
                          ? ""
                          : String(nextValue.latitude),
                      longitude:
                        nextValue.longitude === null || nextValue.longitude === undefined
                          ? ""
                          : String(nextValue.longitude),
                    }));
                  }}
                  value={{
                    addressText: addressForm.address,
                    latitude: addressForm.latitude ? Number(addressForm.latitude) : null,
                    longitude: addressForm.longitude ? Number(addressForm.longitude) : null,
                  }}
                />

                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-3 text-sm text-stone-700">
                    <input
                      checked={addressForm.isBilling}
                      onChange={(event) => {
                        setAddressForm((current) => ({
                          ...current,
                          isBilling: event.target.checked,
                        }));
                      }}
                      type="checkbox"
                    />
                    Direccion de facturacion
                  </label>
                  <label className="flex items-center gap-3 text-sm text-stone-700">
                    <input
                      checked={addressForm.isProjectSite}
                      onChange={(event) => {
                        setAddressForm((current) => ({
                          ...current,
                          isProjectSite: event.target.checked,
                        }));
                      }}
                      type="checkbox"
                    />
                    Sitio de proyecto
                  </label>
                </div>

                <textarea
                  className={textAreaClassName}
                onChange={(event) => {
                  setAddressForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }));
                }}
                  placeholder="Notas"
                  value={addressForm.notes}
                />

                <button
                  className={primaryButtonClassName}
                  disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                  type="submit"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {editingAddressId ? "Guardar direccion" : "Agregar direccion"}
                </button>
              </form>
            ) : null}
          </section>

          <section className={sectionClassName}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Proyectos relacionados
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Seguimiento de proyectos
            </h2>

            <div className="mt-5 space-y-3">
              {client.relatedProjects.length > 0 ? (
                client.relatedProjects.map((project) => (
                  <Link
                    key={project.id}
                    className="block rounded-md border border-stone-200/90 bg-white/80 px-4 py-4 transition hover:border-stone-300"
                    href={PROJECTS_ROUTES.view(project.id)}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-stone-950">
                          {project.code} · {project.title}
                        </p>
                        <p className="mt-1 text-sm text-stone-600">
                          {PROJECT_STATUS_LABELS[project.status]}
                        </p>
                      </div>
                      <span className="text-sm text-stone-500">
                        {formatDateOnlyValue(project.expectedDeliveryDate)}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <EmptyState
                  description="Aqui apareceran los proyectos de este cliente conforme el trabajo avance desde la captacion hasta la medicion y ejecucion."
                  title="Aun no hay proyectos relacionados"
                />
              )}
            </div>
          </section>

          <section className={sectionClassName}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Modulos futuros
            </p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-md border border-dashed border-stone-300 bg-stone-50/80 px-4 py-4">
                <p className="font-semibold text-stone-950">Cotizaciones</p>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  Espacio reservado. Las propuestas comerciales se vincularan aqui mas adelante.
                </p>
              </div>
              <div className="rounded-md border border-dashed border-stone-300 bg-stone-50/80 px-4 py-4">
                <p className="font-semibold text-stone-950">Facturas</p>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  Espacio reservado. Los documentos financieros siguen fuera del alcance de esta fase.
                </p>
              </div>
            </div>
          </section>
        </section>
      </section>

      <ConfirmDialog
        confirmLabel={
          deleteTarget?.kind === "client"
            ? "Eliminar cliente"
            : deleteTarget?.kind === "contact"
              ? "Eliminar contacto"
              : "Eliminar direccion"
        }
        description={`Eliminar ${deleteTarget?.label ?? "este elemento"}? Esta accion quedara registrada en la auditoria.`}
        isLoading={
          deleteClientMutation.isPending ||
          createContactMutation.isPending ||
          updateContactMutation.isPending ||
          createAddressMutation.isPending ||
          updateAddressMutation.isPending
        }
        onConfirm={() => {
          if (!deleteTarget) {
            return;
          }

          const runDelete = async () => {
            if (deleteTarget.kind === "client") {
              await deleteClientMutation.mutateAsync(deleteTarget.id);
              router.push(CLIENTS_ROUTES.list);
              router.refresh();
              return;
            }

            if (deleteTarget.kind === "contact") {
              await clientService.deleteClientContact(clientId, deleteTarget.id);
              await invalidateClient();
              return;
            }

            await clientService.deleteClientAddress(clientId, deleteTarget.id);
            await invalidateClient();
          };

          void runDelete().then(() => {
            setDeleteTarget(null);
          });
        }}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        open={Boolean(deleteTarget)}
        title={`Eliminar ${
          deleteTarget?.kind === "client"
            ? "cliente"
            : deleteTarget?.kind === "contact"
              ? "contacto"
              : deleteTarget?.kind === "address"
                ? "direccion"
                : "elemento"
        }?`}
      />
    </main>
  );
}
