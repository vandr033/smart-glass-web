"use client";

import { useDeferredValue, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  MessageSquare,
  ShieldCheck,
  Users,
} from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { usePermissions } from "@/hooks/use-permissions";
import {
  PortalActionButton,
  PortalInput,
  PortalNotice,
  PortalPanel,
  PortalSelect,
  PortalStatusPill,
  PortalTextarea,
} from "@/modules/client-portal/portal-components";
import {
  PORTAL_DOCUMENTO_LABELS,
  PORTAL_ESTADO_USUARIO_LABELS,
  PORTAL_REMITENTE_LABELS,
  formatPortalDateTime,
  getLabel,
  getPortalTone,
} from "@/modules/client-portal/ui";
import { clientPortalService } from "@/services/client-portal-service";
import type { PortalTipoDocumento } from "@/types";

const adminQueryKey = ["portal-cliente", "admin"] as const;

const defaultInviteForm = {
  clientId: "",
  email: "",
  name: "",
  phone: "",
  projectIds: [] as string[],
};

const defaultDocumentForm = {
  clientId: "",
  name: "",
  projectId: "",
  type: "DOCUMENTO_ADICIONAL" as PortalTipoDocumento,
  visibleToClient: true,
};

const defaultMessageForm = {
  clientId: "",
  mensaje: "",
  projectId: "",
};

export default function ClientPortalAdminPage() {
  const queryClient = useQueryClient();
  const { permissions } = usePermissions();
  const canBlock = permissions.includes("portal_cliente.bloquear");
  const canConfigure = permissions.includes("portal_cliente.configurar");
  const canInvite = permissions.includes("portal_cliente.invitar");
  const canManageDocuments = permissions.includes("portal_cliente.documentos");
  const canManageMessages = permissions.includes("portal_cliente.mensajes");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteForm, setInviteForm] = useState(defaultInviteForm);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [documentForm, setDocumentForm] = useState(defaultDocumentForm);
  const [messageForm, setMessageForm] = useState(defaultMessageForm);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [messageFile, setMessageFile] = useState<File | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    projectIds: [] as string[],
    status: "ACTIVO",
  });

  const usersQuery = useQuery({
    queryFn: () =>
      clientPortalService.listAdminUsers({
        page,
        perPage: 8,
        search: deferredSearch,
        status: status || undefined,
      }),
    queryKey: [...adminQueryKey, page, deferredSearch, status],
  });

  const invalidateAdmin = async () => {
    await queryClient.invalidateQueries({
      queryKey: adminQueryKey,
    });
  };

  const inviteMutation = useMutation({
    mutationFn: clientPortalService.inviteUser,
    onError: (error) => {
      setInviteError(error.message);
    },
    onSuccess: async () => {
      setInviteError(null);
      setInviteForm(defaultInviteForm);
      await invalidateAdmin();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingUserId) {
        throw new Error("Selecciona un usuario del portal para editar.");
      }

      return clientPortalService.updateUser(editingUserId, {
        name: editForm.name,
        phone: editForm.phone || null,
        projectIds: editForm.projectIds,
        status: editForm.status as
          | "ACCESO_BLOQUEADO"
          | "ACTIVO"
          | "INACTIVO"
          | "INVITACION_ENVIADA"
          | "PENDIENTE_INVITACION",
      });
    },
    onError: (error) => {
      setEditError(error.message);
    },
    onSuccess: async () => {
      setEditError(null);
      setEditingUserId(null);
      await invalidateAdmin();
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (values: {
      status: "ACCESO_BLOQUEADO" | "ACTIVO";
      userId: string;
    }) =>
      clientPortalService.changeUserStatus(values.userId, {
        motivo:
          values.status === "ACCESO_BLOQUEADO"
            ? "Bloqueo manual desde administracion del portal."
            : "Reactivacion manual desde administracion del portal.",
        status: values.status,
      }),
    onSuccess: async () => {
      await invalidateAdmin();
    },
  });

  const documentMutation = useMutation({
    mutationFn: async () => {
      if (!documentFile) {
        throw new Error("Debes seleccionar un archivo para compartir.");
      }

      return clientPortalService.createDocument(
        {
          clientId: documentForm.clientId,
          name: documentForm.name,
          projectId: documentForm.projectId || null,
          type: documentForm.type,
          visibleToClient: documentForm.visibleToClient,
        },
        documentFile,
      );
    },
    onError: (error) => {
      setDocumentError(error.message);
    },
    onSuccess: async () => {
      setDocumentError(null);
      setDocumentFile(null);
      setDocumentForm(defaultDocumentForm);
      await invalidateAdmin();
    },
  });

  const messageMutation = useMutation({
    mutationFn: () =>
      clientPortalService.createInternalMessage(
        {
          mensaje: messageForm.mensaje,
          projectId: messageForm.projectId,
        },
        messageFile ?? undefined,
      ),
    onError: (error) => {
      setMessageError(error.message);
    },
    onSuccess: async () => {
      setMessageError(null);
      setMessageFile(null);
      setMessageForm(defaultMessageForm);
      await invalidateAdmin();
    },
  });

  if (usersQuery.isPending) {
    return <LoadingState cards={4} title="Cargando administracion del portal del cliente" />;
  }

  if (usersQuery.isError) {
    return (
      <ErrorState
        description={usersQuery.error.message}
        title="No se pudo abrir Portal del Cliente"
      />
    );
  }

  const adminData = usersQuery.data.data;
  const pagination = usersQuery.data.pagination;
  const selectedInviteClient = adminData.options.find(
    (item) => item.id === inviteForm.clientId,
  );
  const selectedDocumentClient = adminData.options.find(
    (item) => item.id === documentForm.clientId,
  );
  const selectedMessageClient = adminData.options.find(
    (item) => item.id === messageForm.clientId,
  );

  const activeUsers = adminData.users.filter((item) => item.status === "ACTIVO").length;
  const startEditingUser = (userId: string) => {
    const user = adminData.users.find((item) => item.id === userId);

    if (!user) {
      return;
    }

    setEditingUserId(user.id);
    setEditError(null);
    setEditForm({
      name: user.name,
      phone: user.phone ?? "",
      projectIds: user.projectAccesses.map((project) => project.id),
      status: user.status,
    });
  };

  const selectedEditingUser = adminData.users.find((item) => item.id === editingUserId);
  const selectedEditingClient = adminData.options.find(
    (item) => item.id === selectedEditingUser?.client.id,
  );

  return (
    <main className="space-y-6">
      <PageHeader
        description="Administra invitaciones, accesos, documentos y mensajeria del Portal del Cliente sin exponer informacion interna sensible."
        eyebrow="Modulo 18"
        title="Portal del Cliente"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          description="Usuarios cliente visibles en la pagina actual con acceso al portal."
          icon={Users}
          label="Usuarios"
          tone="accent"
          value={String(adminData.users.length)}
        />
        <StatCard
          description="Usuarios activos listos para consultar proyectos y documentos."
          icon={ShieldCheck}
          label="Accesos activos"
          value={String(activeUsers)}
        />
        <StatCard
          description="Documentos recientes compartidos manualmente desde administracion."
          icon={FileText}
          label="Documentos recientes"
          value={String(adminData.recentDocuments.length)}
        />
        <StatCard
          description="Mensajes recientes entre equipo interno y clientes."
          icon={MessageSquare}
          label="Mensajes recientes"
          value={String(adminData.recentMessages.length)}
        />
      </section>

      <PortalPanel title="Filtros">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_14rem]">
          <PortalInput
            label="Buscar cliente o correo"
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Nombre, correo o cliente"
            value={search}
          />
          <PortalSelect
            label="Estado"
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value);
            }}
            value={status}
          >
            <option value="">Todos</option>
            {Object.keys(PORTAL_ESTADO_USUARIO_LABELS).map((value) => (
              <option key={value} value={value}>
                {getLabel(PORTAL_ESTADO_USUARIO_LABELS, value)}
              </option>
            ))}
          </PortalSelect>
        </div>
      </PortalPanel>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <PortalPanel title="Usuarios del portal">
          {adminData.users.length === 0 ? (
            <EmptyState
              description="No hay usuarios que coincidan con los filtros actuales."
              icon={Users}
              title="Sin usuarios"
            />
          ) : (
            <div className="space-y-4">
              {adminData.users.map((user) => (
                <article
                  className="rounded-[1.25rem] border border-[#e6ddd2] bg-[#fffdfa] p-4"
                  key={user.id}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-[#302016]">{user.name}</p>
                        <PortalStatusPill tone={getPortalTone(user.status)}>
                          {getLabel(PORTAL_ESTADO_USUARIO_LABELS, user.status)}
                        </PortalStatusPill>
                      </div>
                      <p className="text-sm text-[#6f6256]">{user.email}</p>
                      <p className="text-sm text-[#6f6256]">
                        Cliente: {user.client.displayName}
                      </p>
                      <p className="text-sm text-[#6f6256]">
                        Ultimo acceso: {formatPortalDateTime(user.lastAccessAt)}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {user.projectAccesses.map((project) => (
                          <span
                            className="inline-flex rounded-full bg-[#f7ead6] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#8a5a1f]"
                            key={project.id}
                          >
                            {project.code}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {canConfigure ? (
                        <PortalActionButton
                          onClick={() => startEditingUser(user.id)}
                          tone="secundario"
                        >
                          Editar acceso
                        </PortalActionButton>
                      ) : null}
                      {canBlock ? (
                        <PortalActionButton
                          onClick={() =>
                            statusMutation.mutate({
                              status:
                                user.status === "ACCESO_BLOQUEADO"
                                  ? "ACTIVO"
                                  : "ACCESO_BLOQUEADO",
                              userId: user.id,
                            })
                          }
                          tone={user.status === "ACCESO_BLOQUEADO" ? "primario" : "suave"}
                        >
                          {user.status === "ACCESO_BLOQUEADO" ? "Reactivar" : "Bloquear"}
                        </PortalActionButton>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="mt-5 flex items-center justify-between text-sm text-[#6f6256]">
            <span>
              Pagina {pagination.page} de {Math.max(1, Math.ceil(pagination.total / pagination.perPage))}
            </span>
            <div className="flex gap-3">
              <PortalActionButton
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                tone="secundario"
              >
                Anterior
              </PortalActionButton>
              <PortalActionButton
                onClick={() =>
                  setPage((current) =>
                    current * pagination.perPage < pagination.total ? current + 1 : current,
                  )
                }
                tone="secundario"
              >
                Siguiente
              </PortalActionButton>
            </div>
          </div>
        </PortalPanel>

        <div className="space-y-6">
          {canInvite ? (
            <PortalPanel title="Invitar cliente">
              {inviteError ? <PortalNotice tone="error">{inviteError}</PortalNotice> : null}
              <div className="space-y-4">
                <PortalSelect
                  label="Cliente"
                  onChange={(event) =>
                    setInviteForm((current) => ({
                      ...current,
                      clientId: event.target.value,
                      projectIds: [],
                    }))
                  }
                  value={inviteForm.clientId}
                >
                  <option value="">Selecciona un cliente</option>
                  {adminData.options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.displayName}
                    </option>
                  ))}
                </PortalSelect>
                <div className="grid gap-4 sm:grid-cols-2">
                  <PortalInput
                    label="Nombre"
                    onChange={(event) =>
                      setInviteForm((current) => ({ ...current, name: event.target.value }))
                    }
                    value={inviteForm.name}
                  />
                  <PortalInput
                    label="Telefono"
                    onChange={(event) =>
                      setInviteForm((current) => ({ ...current, phone: event.target.value }))
                    }
                    value={inviteForm.phone}
                  />
                </div>
                <PortalInput
                  label="Correo"
                  onChange={(event) =>
                    setInviteForm((current) => ({ ...current, email: event.target.value }))
                  }
                  type="email"
                  value={inviteForm.email}
                />

                {selectedInviteClient ? (
                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a5a1f]">
                      Proyectos habilitados
                    </p>
                    <div className="space-y-2">
                      {selectedInviteClient.projects.map((project) => {
                        const checked = inviteForm.projectIds.includes(project.id);

                        return (
                          <label
                            className="flex items-center gap-3 rounded-[1rem] border border-[#e6ddd2] bg-[#fffdfa] px-4 py-3 text-sm text-[#302016]"
                            key={project.id}
                          >
                            <input
                              checked={checked}
                              onChange={(event) =>
                                setInviteForm((current) => ({
                                  ...current,
                                  projectIds: event.target.checked
                                    ? [...current.projectIds, project.id]
                                    : current.projectIds.filter((item) => item !== project.id),
                                }))
                              }
                              type="checkbox"
                            />
                            <span>
                              {project.code} · {project.title}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <PortalActionButton
                  className="w-full"
                  onClick={() =>
                    inviteMutation.mutate({
                      clientId: inviteForm.clientId,
                      email: inviteForm.email,
                      name: inviteForm.name,
                      phone: inviteForm.phone || null,
                      projectIds: inviteForm.projectIds,
                    })
                  }
                >
                  {inviteMutation.isPending ? "Enviando invitacion..." : "Invitar cliente"}
                </PortalActionButton>
              </div>
            </PortalPanel>
          ) : null}

          {canConfigure && editingUserId && selectedEditingClient ? (
            <PortalPanel title="Editar acceso del usuario">
              {editError ? <PortalNotice tone="error">{editError}</PortalNotice> : null}
              <div className="space-y-4">
                <PortalInput
                  label="Nombre"
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, name: event.target.value }))
                  }
                  value={editForm.name}
                />
                <PortalInput
                  label="Telefono"
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, phone: event.target.value }))
                  }
                  value={editForm.phone}
                />
                <PortalSelect
                  label="Estado"
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, status: event.target.value }))
                  }
                  value={editForm.status}
                >
                  {Object.keys(PORTAL_ESTADO_USUARIO_LABELS).map((value) => (
                    <option key={value} value={value}>
                      {getLabel(PORTAL_ESTADO_USUARIO_LABELS, value)}
                    </option>
                  ))}
                </PortalSelect>
                <div className="space-y-2">
                  {selectedEditingClient.projects.map((project) => (
                    <label
                      className="flex items-center gap-3 rounded-[1rem] border border-[#e6ddd2] bg-[#fffdfa] px-4 py-3 text-sm text-[#302016]"
                      key={project.id}
                    >
                      <input
                        checked={editForm.projectIds.includes(project.id)}
                        onChange={(event) =>
                          setEditForm((current) => ({
                            ...current,
                            projectIds: event.target.checked
                              ? [...current.projectIds, project.id]
                              : current.projectIds.filter((item) => item !== project.id),
                          }))
                        }
                        type="checkbox"
                      />
                      <span>
                        {project.code} · {project.title}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <PortalActionButton onClick={() => updateMutation.mutate()}>
                    {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
                  </PortalActionButton>
                  <PortalActionButton
                    onClick={() => setEditingUserId(null)}
                    tone="secundario"
                  >
                    Cancelar
                  </PortalActionButton>
                </div>
              </div>
            </PortalPanel>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        {canManageDocuments ? (
          <PortalPanel title="Compartir documento">
            {documentError ? <PortalNotice tone="error">{documentError}</PortalNotice> : null}
            <div className="space-y-4">
              <PortalSelect
                label="Cliente"
                onChange={(event) =>
                  setDocumentForm((current) => ({
                    ...current,
                    clientId: event.target.value,
                    projectId: "",
                  }))
                }
                value={documentForm.clientId}
              >
                <option value="">Selecciona un cliente</option>
                {adminData.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.displayName}
                  </option>
                ))}
              </PortalSelect>
              <PortalInput
                label="Nombre del documento"
                onChange={(event) =>
                  setDocumentForm((current) => ({ ...current, name: event.target.value }))
                }
                value={documentForm.name}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <PortalSelect
                  label="Tipo"
                  onChange={(event) =>
                    setDocumentForm((current) => ({
                      ...current,
                      type: event.target.value as PortalTipoDocumento,
                    }))
                  }
                  value={documentForm.type}
                >
                  {Object.keys(PORTAL_DOCUMENTO_LABELS).map((value) => (
                    <option key={value} value={value}>
                      {getLabel(PORTAL_DOCUMENTO_LABELS, value)}
                    </option>
                  ))}
                </PortalSelect>
                <PortalSelect
                  label="Proyecto"
                  onChange={(event) =>
                    setDocumentForm((current) => ({ ...current, projectId: event.target.value }))
                  }
                  value={documentForm.projectId}
                >
                  <option value="">Sin proyecto especifico</option>
                  {selectedDocumentClient?.projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.code} · {project.title}
                    </option>
                  ))}
                </PortalSelect>
              </div>
              <label className="flex items-center gap-3 text-sm text-[#302016]">
                <input
                  checked={documentForm.visibleToClient}
                  onChange={(event) =>
                    setDocumentForm((current) => ({
                      ...current,
                      visibleToClient: event.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                Visible para el cliente
              </label>
              <input
                className="w-full rounded-[1rem] border border-[#ddd4c9] bg-[#fffdfa] px-4 py-3 text-sm text-[#302016]"
                onChange={(event) => setDocumentFile(event.target.files?.[0] ?? null)}
                type="file"
              />
              <PortalActionButton
                className="w-full"
                onClick={() => documentMutation.mutate()}
              >
                {documentMutation.isPending ? "Subiendo documento..." : "Compartir documento"}
              </PortalActionButton>
            </div>
          </PortalPanel>
        ) : null}

        {canManageMessages ? (
          <PortalPanel title="Mensaje interno al cliente">
            {messageError ? <PortalNotice tone="error">{messageError}</PortalNotice> : null}
            <div className="space-y-4">
              <PortalSelect
                label="Cliente"
                onChange={(event) =>
                  setMessageForm((current) => ({
                    ...current,
                    clientId: event.target.value,
                    projectId: "",
                  }))
                }
                value={messageForm.clientId}
              >
                <option value="">Selecciona un cliente</option>
                {adminData.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.displayName}
                  </option>
                ))}
              </PortalSelect>
              <PortalSelect
                label="Proyecto"
                onChange={(event) =>
                  setMessageForm((current) => ({ ...current, projectId: event.target.value }))
                }
                value={messageForm.projectId}
              >
                <option value="">Selecciona un proyecto</option>
                {selectedMessageClient?.projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.code} · {project.title}
                  </option>
                ))}
              </PortalSelect>
              <PortalTextarea
                label="Mensaje"
                onChange={(event) =>
                  setMessageForm((current) => ({ ...current, mensaje: event.target.value }))
                }
                placeholder="Escribe el mensaje que recibira el cliente en el portal."
                value={messageForm.mensaje}
              />
              <input
                className="w-full rounded-[1rem] border border-[#ddd4c9] bg-[#fffdfa] px-4 py-3 text-sm text-[#302016]"
                onChange={(event) => setMessageFile(event.target.files?.[0] ?? null)}
                type="file"
              />
              <PortalActionButton
                className="w-full"
                onClick={() => messageMutation.mutate()}
              >
                {messageMutation.isPending ? "Enviando mensaje..." : "Enviar mensaje interno"}
              </PortalActionButton>
            </div>
          </PortalPanel>
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <PortalPanel title="Documentos recientes">
          {adminData.recentDocuments.length === 0 ? (
            <p className="text-sm leading-6 text-[#6f6256]">
              Todavia no hay documentos compartidos manualmente.
            </p>
          ) : (
            <div className="space-y-3">
              {adminData.recentDocuments.map((document) => (
                <article
                  className="rounded-[1.15rem] border border-[#e6ddd2] bg-[#fffdfa] p-4"
                  key={document.id}
                >
                  <p className="font-semibold text-[#302016]">{document.name}</p>
                  <p className="mt-1 text-sm text-[#6f6256]">
                    {getLabel(PORTAL_DOCUMENTO_LABELS, document.type)}
                  </p>
                  <p className="mt-1 text-sm text-[#6f6256]">
                    {document.client.displayName}
                  </p>
                </article>
              ))}
            </div>
          )}
        </PortalPanel>

        <PortalPanel title="Mensajes recientes">
          {adminData.recentMessages.length === 0 ? (
            <p className="text-sm leading-6 text-[#6f6256]">
              Todavia no hay mensajes recientes.
            </p>
          ) : (
            <div className="space-y-3">
              {adminData.recentMessages.map((message) => (
                <article
                  className="rounded-[1.15rem] border border-[#e6ddd2] bg-[#fffdfa] p-4"
                  key={message.id}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <PortalStatusPill tone={getPortalTone(message.sentBy)}>
                      {getLabel(PORTAL_REMITENTE_LABELS, message.sentBy)}
                    </PortalStatusPill>
                    <span className="text-sm text-[#6f6256]">
                      {message.client.displayName}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#302016]">
                    {message.message}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.12em] text-[#9a8876]">
                    {formatPortalDateTime(message.createdAt)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </PortalPanel>
      </section>
    </main>
  );
}
