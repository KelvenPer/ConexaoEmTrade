"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Settings2,
  Users,
  Factory,
  Boxes,
  Megaphone,
  CalendarDays,
  LineChart,
} from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

type LayoutProps = {
  children: ReactNode;
};

type ThemeOption = "light" | "dark";

export default function PainelLayout({ children }: LayoutProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeOption>("light");
  const [userName, setUserName] = useState("Usuario");
  const [userRole, setUserRole] = useState("Trade & Dados");
  const [userEmail, setUserEmail] = useState("");
  const [userLogin, setUserLogin] = useState("");
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [accessChannel, setAccessChannel] = useState("industria");
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [retailId, setRetailId] = useState<number | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoMsg, setPhotoMsg] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const menuRef = useRef<HTMLDivElement | null>(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const getToken = useCallback(
    () => (typeof window !== "undefined" ? localStorage.getItem("conexao_trade_token") : null),
    []
  );
  const isPlatformAdmin = userRole === "PLATFORM_ADMIN";
  const isTenantAdmin = userRole === "TENANT_ADMIN";
  const canManageConfig = isPlatformAdmin || isTenantAdmin;
  const channelLabel =
    accessChannel === "varejo" ? "Varejo" : accessChannel === "interno" ? "Interno" : "Industria";

  const persistUser = useCallback((data: Record<string, unknown>) => {
    if (typeof window === "undefined") return;
    try {
      const current = localStorage.getItem("conexao_trade_user");
      const parsed = current ? JSON.parse(current) : {};
      localStorage.setItem("conexao_trade_user", JSON.stringify({ ...parsed, ...data }));
    } catch {
      localStorage.setItem("conexao_trade_user", JSON.stringify(data));
    }
  }, []);

  const syncUserFromApi = useCallback(async () => {
    const token = getToken();
    if (!token) return null;

    const res = await fetch(`${apiBaseUrl}/api/usuarios/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data?.name) setUserName(String(data.name));
    if (data?.email) setUserEmail(String(data.email));
    if (data?.login) setUserLogin(String(data.login));
    if (data?.role) setUserRole(String(data.role));
    if (data?.accessChannel) setAccessChannel(String(data.accessChannel));
    if (data?.tenantId !== undefined) setTenantId(data.tenantId ? Number(data.tenantId) : null);
    if (data?.supplierId !== undefined) setSupplierId(data.supplierId ? Number(data.supplierId) : null);
    if (data?.retailId !== undefined) setRetailId(data.retailId ? Number(data.retailId) : null);
    if (data?.photoUrl) {
      setUserPhoto(String(data.photoUrl));
      localStorage.setItem("conexao_trade_user_photo", String(data.photoUrl));
    } else {
      localStorage.removeItem("conexao_trade_user_photo");
      setUserPhoto(null);
    }
    persistUser(data);
    return data;
  }, [apiBaseUrl, getToken, persistUser]);

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Formato de arquivo invalido."));
        }
      };
      reader.onerror = () => reject(reader.error || new Error("Erro ao ler arquivo."));
      reader.readAsDataURL(file);
    });

  const applyTheme = useCallback((nextTheme: ThemeOption) => {
    document.documentElement.classList.toggle("theme-dark", nextTheme === "dark");
    localStorage.setItem("conexao_trade_theme", nextTheme);
  }, []);

  const toggleTheme = (nextTheme: ThemeOption) => {
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  useEffect(() => {
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("conexao_trade_user") : null;
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?.name) setUserName(parsed.name as string);
        if (parsed?.role) setUserRole(String(parsed.role));
        if (parsed?.accessChannel) setAccessChannel(String(parsed.accessChannel));
        if (parsed?.email) setUserEmail(String(parsed.email));
        if (parsed?.login) setUserLogin(String(parsed.login));
        if (parsed?.tenantId !== undefined) setTenantId(parsed.tenantId ? Number(parsed.tenantId) : null);
        if (parsed?.supplierId !== undefined) setSupplierId(parsed.supplierId ? Number(parsed.supplierId) : null);
        if (parsed?.retailId !== undefined) setRetailId(parsed.retailId ? Number(parsed.retailId) : null);
        if (parsed?.photoUrl) setUserPhoto(String(parsed.photoUrl));
      } catch {
        // ignore parse issues
      }
    }

    const storedPhoto = typeof window !== "undefined" ? localStorage.getItem("conexao_trade_user_photo") : null;
    if (storedPhoto) {
      setPhotoPreview(storedPhoto);
      setUserPhoto(storedPhoto);
    }

    // sincroniza com backend, se token disponivel
    syncUserFromApi().catch(() => {
      /* ignora falha de sincronizacao */
    });

    const stored = typeof window !== "undefined" ? localStorage.getItem("conexao_trade_theme") : null;
    const prefersDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme: ThemeOption = stored === "dark" || stored === "light" ? (stored as ThemeOption) : prefersDark ? "dark" : "light";
    applyTheme(nextTheme);
    setTheme(nextTheme);
  }, [applyTheme, syncUserFromApi]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ").filter(Boolean);
    if (!parts.length) return "CT";
    const [first, second] = parts;
    return (first[0] || "C").toUpperCase() + ((second?.[0] || "").toUpperCase() || (parts[0][1] || "T").toUpperCase());
  };

  const goToProfile = (tab?: string) => {
    const suffix = tab ? `?tab=${tab}` : "";
    window.location.assign(`/painel/config/perfil${suffix}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("conexao_trade_token");
    localStorage.removeItem("conexao_trade_user");
    window.location.assign("/login");
  };

  return (
    <div className="app-shell">
      {/* SIDEBAR */}
      <aside className="app-shell__sidebar">
        <div className="app-shell__sidebar-header">
          <div className="app-shell__sidebar-header-logo">CT</div>
          <div className="app-shell__sidebar-header-title">
            <span className="app-shell__sidebar-header-title-main">
              Conexao em Trade
            </span>
            <span className="app-shell__sidebar-header-title-sub">
              Painel de Trade Marketing &amp; Dados
            </span>
            <span className="app-shell__sidebar-header-title-sub">
              {channelLabel} • {userRole}
            </span>
          </div>
        </div>

        <nav className="app-shell__sidebar-nav">
          <NavGroup title="Principal">
            <NavItem
              href="/painel"
              pathname={pathname}
              icon={<LayoutDashboard size={16} />}
            >
              Dashboard Geral
            </NavItem>
          </NavGroup>

          <NavGroup title="Trade Marketing">
            <NavItem
              href="/painel/trade/jbp-jvc"
              pathname={pathname}
              icon={<Boxes size={16} />}
            >
              JBP &amp; JVC
            </NavItem>
          </NavGroup>

          <NavGroup title="Marketing">
            <NavItem
              href="/painel/marketing/calendario"
              pathname={pathname}
              icon={<CalendarDays size={16} />}
            >
              Calendario de campanhas
            </NavItem>
            <NavItem
              href="/painel/marketing/campanhas"
              pathname={pathname}
              icon={<Megaphone size={16} />}
            >
              Campanhas &amp; conteudo
            </NavItem>
            <NavItem
              href="/painel/marketing/resultados"
              pathname={pathname}
              icon={<LineChart size={16} />}
            >
              Resultados de campanha
            </NavItem>
          </NavGroup>

          {canManageConfig && (
            <NavGroup title="Configuracoes">
              <NavItem
                href="/painel/config/usuarios"
                pathname={pathname}
                icon={<Users size={16} />}
              >
                Usuarios
              </NavItem>
              <NavItem
                href="/painel/config/produtos"
                pathname={pathname}
                icon={<Boxes size={16} />}
              >
                Produtos
              </NavItem>
              <NavItem
                href="/painel/config/fornecedores"
                pathname={pathname}
                icon={<Factory size={16} />}
              >
                Fornecedores
              </NavItem>
              <NavItem
                href="/painel/config/ativos"
                pathname={pathname}
                icon={<Settings2 size={16} />}
              >
                Ativos de midia
              </NavItem>
              <NavItem
                href="/painel/config/varejo"
                pathname={pathname}
                icon={<Factory size={16} />}
              >
                Varejo
              </NavItem>
            </NavGroup>
          )}
        </nav>

        <div className="app-shell__sidebar-footer">
          <div>Conexao em Trade - v0.1</div>
          <div>Ambiente de demonstracao</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            {tenantId ? `Tenant #${tenantId}` : "Tenant nao atribuido"} •{" "}
            {supplierId ? `Industria #${supplierId}` : retailId ? `Varejo #${retailId}` : channelLabel}
          </div>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="app-shell__main">
        {!pathname?.startsWith("/painel/config") && (
          <header className="app-shell__topbar">
            <div className="app-shell__topbar-left">
              <div className="app-shell__topbar-title">Visao de Portfolio</div>
              <div className="app-shell__topbar-sub">
                Acompanhe JBP, campanhas, execucao em loja e resultados em uma visao unica.
              </div>
            </div>

            <div className="app-shell__topbar-right">
              <span className="app-shell__env-tag">- Ambiente de demonstracao</span>
              <button type="button" className="app-shell__primary-cta">
                + Nova campanha
              </button>
              <div className="app-shell__user-menu" ref={menuRef}>
                <button
                  type="button"
                  className="app-shell__user-chip"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-haspopup="true"
                  aria-expanded={menuOpen}
                >
                  {userPhoto ? <img src={userPhoto} alt={userName} /> : getInitials(userName)}
                </button>
                {menuOpen && (
                  <div className="app-shell__user-popover">
                    <div className="app-shell__user-header">
                      <div className="app-shell__user-avatar">
                        {userPhoto ? <img src={userPhoto} alt={userName} /> : getInitials(userName)}
                      </div>
                      <div>
                        <div className="app-shell__user-name">{userName}</div>
                        <div className="app-shell__user-role">{userRole}</div>
                      </div>
                    </div>

                    <div className="app-shell__user-actions">
                      <button
                        type="button"
                        className="app-shell__user-action"
                        onClick={() => {
                          setShowProfileModal(true);
                          setMenuOpen(false);
                        }}
                      >
                        Perfil
                      </button>
                      <button
                        type="button"
                        className="app-shell__user-action"
                        onClick={() => {
                          setShowPhotoModal(true);
                          setMenuOpen(false);
                        }}
                      >
                        Adicionar foto de perfil
                      </button>
                      <button
                        type="button"
                        className="app-shell__user-action"
                        onClick={() => {
                          setShowPasswordModal(true);
                          setMenuOpen(false);
                        }}
                      >
                        Trocar senha
                      </button>
                    </div>

                    <div className="app-shell__user-theme">
                      <span>Tema</span>
                      <div className="app-shell__theme-switch">
                        <button
                          type="button"
                          className={"app-shell__theme-pill" + (theme === "light" ? " is-active" : "")}
                          onClick={() => toggleTheme("light")}
                        >
                          Light
                        </button>
                        <button
                          type="button"
                          className={"app-shell__theme-pill" + (theme === "dark" ? " is-active" : "")}
                          onClick={() => toggleTheme("dark")}
                        >
                          Dark
                        </button>
                      </div>
                    </div>

                    <button type="button" className="app-shell__user-logout" onClick={handleLogout}>
                      Sair
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>
        )}

        <main className="app-shell__content">{children}</main>
      </div>

      {showProfileModal && (
        <Modal onClose={() => setShowProfileModal(false)} title="Perfil">
          <div className="modal-section">
            <div className="modal-avatar">{getInitials(userName)}</div>
            <div className="modal-user-info">
              <div className="modal-user-name">{userName}</div>
              <div className="modal-user-role">{userRole}</div>
            </div>
          </div>
          <div className="modal-grid">
            <div>
              <label className="modal-label">Nome</label>
              <div className="modal-value">{userName}</div>
            </div>
            <div>
              <label className="modal-label">Login</label>
              <div className="modal-value">{userLogin || "-"}</div>
            </div>
            <div>
              <label className="modal-label">Email</label>
              <div className="modal-value">{userEmail || "-"}</div>
            </div>
            <div>
              <label className="modal-label">Perfil</label>
              <div className="modal-value">{userRole}</div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="modal-link" onClick={() => goToProfile()}>
              Abrir pagina completa de perfil
            </button>
            <button type="button" className="modal-close" onClick={() => setShowProfileModal(false)}>
              Fechar
            </button>
          </div>
        </Modal>
      )}

      {showPhotoModal && (
        <Modal onClose={() => setShowPhotoModal(false)} title="Adicionar foto de perfil">
          <form
            className="modal-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setPhotoMsg("");
              if (!photoFile) {
                setPhotoMsg("Selecione uma imagem para enviar.");
                return;
              }
              try {
                const token = getToken();
                if (!token) {
                  setPhotoMsg("Token ausente. Faca login novamente.");
                  return;
                }

                setPhotoSaving(true);
                const photoDataUrl = await readFileAsDataUrl(photoFile);

                const res = await fetch(`${apiBaseUrl}/api/usuarios/me/foto`, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ photoUrl: photoDataUrl }),
                });

                const data = await res.json();
                if (!res.ok) {
                  setPhotoMsg(data?.message || "Erro ao salvar foto. Tente novamente.");
                  return;
                }

                const finalPhoto = data?.usuario?.photoUrl || photoDataUrl;
                if (finalPhoto) {
                  localStorage.setItem("conexao_trade_user_photo", finalPhoto);
                  setPhotoPreview(finalPhoto);
                  setUserPhoto(finalPhoto);
                  persistUser({ photoUrl: finalPhoto });
                } else {
                  setPhotoPreview(null);
                  setUserPhoto(null);
                  localStorage.removeItem("conexao_trade_user_photo");
                  persistUser({ photoUrl: null });
                }

                setPhotoMsg(data?.message || "Foto atualizada com sucesso.");
              } catch (err) {
                console.error(err);
                setPhotoMsg("Erro ao salvar foto. Tente novamente.");
              } finally {
                setPhotoSaving(false);
              }
            }}
          >
            <div className="modal-upload">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="modal-photo-preview" />
              ) : (
                <div className="modal-photo-placeholder">{getInitials(userName)}</div>
              )}
              <label className="modal-upload-btn">
                Escolher arquivo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setPhotoFile(file);
                    if (file) {
                      setPhotoPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>
            </div>
            {photoMsg && <div className="modal-feedback">{photoMsg}</div>}
            <div className="modal-actions">
              <button type="button" className="modal-close" onClick={() => setShowPhotoModal(false)}>
                Cancelar
              </button>
              <button type="submit" className="modal-submit" disabled={photoSaving}>
                {photoSaving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showPasswordModal && (
        <Modal onClose={() => setShowPasswordModal(false)} title="Trocar senha">
          <form
            className="modal-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const formEl = e.currentTarget;
              const formData = new FormData(e.currentTarget);
              const atual = String(formData.get("senhaAtual") || "");
              const nova = String(formData.get("novaSenha") || "");
              const confirmar = String(formData.get("confirmarSenha") || "");
              setPasswordError("");
              setPasswordMsg("");

              if (!atual || !nova || !confirmar) {
                setPasswordError("Preencha todas as senhas.");
                return;
              }
              if (nova !== confirmar) {
                setPasswordError("Nova senha e confirmacao nao conferem.");
                return;
              }

              try {
                setPasswordSaving(true);
                const token = getToken();
                if (!token) {
                  setPasswordError("Token ausente. Faca login novamente.");
                  return;
                }

                const res = await fetch(`${apiBaseUrl}/api/usuarios/me/senha`, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    senhaAtual: atual,
                    novaSenha: nova,
                  }),
                });

                const data = await res.json();
                if (!res.ok) {
                  setPasswordError(data?.message || "Erro ao atualizar senha. Tente novamente.");
                  return;
                }

                setPasswordMsg(data?.message || "Senha atualizada com sucesso.");
                formEl.reset();
              } catch (err) {
                console.error(err);
                setPasswordError("Erro ao atualizar senha. Tente novamente.");
              } finally {
                setPasswordSaving(false);
              }
            }}
          >
            <label className="modal-label">Senha atual</label>
            <input type="password" name="senhaAtual" className="modal-input" />

            <label className="modal-label">Nova senha</label>
            <input type="password" name="novaSenha" className="modal-input" />

            <label className="modal-label">Confirmar nova senha</label>
            <input type="password" name="confirmarSenha" className="modal-input" />

            {passwordError && <div className="modal-feedback error">{passwordError}</div>}
            {passwordMsg && <div className="modal-feedback success">{passwordMsg}</div>}

            <div className="modal-actions">
              <button type="button" className="modal-close" onClick={() => setShowPasswordModal(false)}>
                Cancelar
              </button>
              <button type="submit" className="modal-submit" disabled={passwordSaving}>
                {passwordSaving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function NavGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div className="app-shell__nav-group-title">{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{children}</div>
    </div>
  );
}

function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: ReactNode }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Fechar modal">
            x
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function NavItem({
  href,
  pathname,
  icon,
  children,
}: {
  href: string;
  pathname: string | null;
  icon?: ReactNode;
  children: ReactNode;
}) {
  const isActive = pathname === href || (pathname || "").startsWith(href + "/");

  return (
    <Link href={href} className={"app-shell__nav-item" + (isActive ? " app-shell__nav-item--active" : "")}>
      {icon && <span className="app-shell__nav-item-icon">{icon}</span>}
      <span className="app-shell__nav-label">{children}</span>
    </Link>
  );
}
