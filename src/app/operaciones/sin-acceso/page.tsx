import Link from "next/link";

export default function OperationalDeniedPage() {
  return <main className="portal-auth-page"><section className="portal-auth-card"><div className="portal-brand-mark"><span>VS</span></div><p className="portal-eyebrow">Portal Operativo</p><h1>Acceso no habilitado</h1><p>Tu cuenta está autenticada, pero todavía no tiene permisos para trabajar en este espacio.</p><div className="portal-auth-actions"><Link className="portal-primary-button" href="/admin">Volver al ERP</Link><Link className="portal-secondary-button" href="/operaciones/iniciar-sesion">Cambiar de cuenta</Link></div></section></main>;
}

