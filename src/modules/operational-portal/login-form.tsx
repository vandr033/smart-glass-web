"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { authService } from "@/services/auth-service";

export function OperationalLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState(() => typeof window === "undefined" ? "" : window.localStorage.getItem("vidriera-sebitas-operaciones-email") ?? "");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setLoading(true); setError(null);
    try { if (remember) window.localStorage.setItem("vidriera-sebitas-operaciones-email", email); else window.localStorage.removeItem("vidriera-sebitas-operaciones-email"); await authService.login({ email, password }); router.push("/operaciones/inicio"); router.refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo iniciar sesión."); }
    finally { setLoading(false); }
  };
  return <main className="portal-auth-page"><section className="portal-auth-card"><div className="portal-auth-brand"><div className="portal-brand-mark"><span>VS</span></div><div><p className="portal-kicker">VIDRIERA SEBITAS</p><p className="portal-brand-name">Portal Operativo</p></div></div><div><p className="portal-eyebrow">Acceso de equipo</p><h1>Entra a tu jornada.</h1><p className="portal-auth-copy">Usa las mismas credenciales del ERP para continuar con tus tareas de campo.</p></div>{error ? <div className="portal-auth-error">{error}</div> : null}<form className="portal-auth-form" onSubmit={submit}><label>Correo electrónico<input autoComplete="email" onChange={(event) => setEmail(event.target.value)} placeholder="nombre@vidrierasebitas.com" required type="email" value={email} /></label><label>Contraseña<input autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} placeholder="Tu contraseña" required type="password" value={password} /></label><label className="portal-check-label"><input checked={remember} onChange={(event) => setRemember(event.target.checked)} type="checkbox" /> Recordarme en este dispositivo</label><button className="portal-primary-button" disabled={loading} type="submit">{loading ? "Validando acceso…" : "Iniciar sesión"}</button></form><Link className="portal-auth-forgot" href="/forgot-password">¿Olvidaste tu contraseña?</Link><p className="portal-auth-foot">La sesión es única y válida para todo Vidriera Sebitas ERP.</p></section></main>;
}
