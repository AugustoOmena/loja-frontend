import { useState } from "react";
import {
  Search,
  Edit,
  Trash2,
  X,
  Shield,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Loader2, // Adicionei para ficar bonito igual aos outros
} from "lucide-react";
import { userService } from "../../services/userService";
import type { UserProfile, UserFilters } from "../../types";
import { useDebounce } from "../../hooks/useDebounce";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { useTheme } from "../../contexts/ThemeContext";

export const Users = () => {
  const { colors, theme } = useTheme();
  const queryClient = useQueryClient();

  // Estados
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 10,
    email: "",
    role: "",
    sort: "newest",
  });
  const [localEmail, setLocalEmail] = useState("");
  const debouncedEmail = useDebounce(localEmail, 500);

  // Sincroniza email debounced
  if (filters.email !== debouncedEmail) {
    setFilters({ ...filters, email: debouncedEmail, page: 1 });
  }

  // --- REACT QUERY ---
  const { data, isLoading, isError } = useQuery({
    queryKey: ["users", filters],
    queryFn: () => userService.getAll(filters),
    placeholderData: keepPreviousData,
  });

  const users = data?.data || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / filters.limit);

  // Mutações
  const updateMutation = useMutation({
    mutationFn: userService.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsModalOpen(false);
    },
    onError: () => alert("Erro ao atualizar"),
  });

  const deleteMutation = useMutation({
    mutationFn: userService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
    onError: () => alert("Erro ao deletar"),
  });

  // --- UI ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({ email: "", role: "user" });

  const handleSelectChange = (key: keyof UserFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleOpenModal = (user: UserProfile) => {
    setCurrentUser(user);
    setFormData({ email: user.email ?? "", role: user.role ?? "user" });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const payload: UserProfile = {
      id: currentUser.id,
      email: formData.email,
      role: formData.role as "user" | "admin",
    };
    updateMutation.mutate(payload);
  };

  const handleDelete = (id: string) => {
    if (
      confirm("ATENÇÃO: Isso removerá os dados do perfil. Deseja continuar?")
    ) {
      deleteMutation.mutate(id);
    }
  };

  // --- 3. ESTILOS DINÂMICOS ---
  const styles = {
    container: {
      padding: "20px",
      maxWidth: "1200px",
      margin: "0 auto",
      fontFamily: "sans-serif",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "25px",
    },
    title: {
      fontSize: "24px",
      fontWeight: "bold",
      color: colors.text,
    },
    // Botões
    primaryButton: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      backgroundColor: theme === "dark" ? "#6366f1" : "#0f172a",
      color: "white",
      border: "none",
      padding: "10px 20px",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "500",
    },
    secondaryButton: {
      backgroundColor: colors.card,
      color: colors.muted,
      border: `1px solid ${colors.border}`,
      padding: "10px 20px",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "500",
    },
    iconButton: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "5px",
    },
    closeButton: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: colors.muted,
    },
    // Filtros
    filterContainer: {
      marginBottom: "20px",
      backgroundColor: colors.card,
      padding: "15px",
      borderRadius: "8px",
      border: `1px solid ${colors.border}`,
    },
    filterRow: {
      display: "flex",
      gap: "15px",
      flexWrap: "wrap" as const,
      alignItems: "center",
    },
    searchWrapper: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      backgroundColor: theme === "dark" ? "#0f172a" : "#f8fafc",
      padding: "10px 15px",
      borderRadius: "6px",
      border: `1px solid ${colors.border}`,
      flex: 2,
      minWidth: "200px",
    },
    searchInput: {
      border: "none",
      outline: "none",
      width: "100%",
      background: "transparent",
      fontSize: "14px",
      color: colors.text,
    },
    filterSelect: {
      padding: "10px",
      borderRadius: "6px",
      border: `1px solid ${colors.border}`,
      minWidth: "150px",
      fontSize: "14px",
      backgroundColor: theme === "dark" ? "#0f172a" : "white",
      color: colors.text,
    },
    // Tabela
    tableContainer: {
      backgroundColor: colors.card,
      borderRadius: "8px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      overflow: "hidden",
      border: `1px solid ${colors.border}`,
    },
    table: {
      width: "100%",
      borderCollapse: "collapse" as const,
      textAlign: "left" as const,
    },
    tableHeadRow: {
      backgroundColor: theme === "dark" ? "#1e293b" : "#f8fafc",
      borderBottom: `1px solid ${colors.border}`,
    },
    th: {
      padding: "15px",
      fontSize: "14px",
      fontWeight: "600",
      color: colors.muted,
    },
    thAction: {
      padding: "15px",
      fontSize: "14px",
      fontWeight: "600",
      color: colors.muted,
      textAlign: "right" as const,
    },
    tableRow: { borderBottom: `1px solid ${colors.border}` },
    td: { padding: "15px", fontSize: "15px", color: colors.text },
    tdCenter: { padding: "30px", textAlign: "center", color: colors.muted },
    tdAction: {
      padding: "15px",
      textAlign: "right" as const,
      display: "flex",
      justifyContent: "flex-end",
      gap: "10px",
    },
    // Badges (Adaptados para Dark Mode)
    badgeAdmin: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      backgroundColor: theme === "dark" ? "rgba(22, 163, 74, 0.2)" : "#dcfce7",
      color: theme === "dark" ? "#4ade80" : "#166534",
      padding: "4px 10px",
      borderRadius: "12px",
      fontSize: "12px",
      fontWeight: "bold",
      width: "fit-content",
    },
    badgeUser: {
      backgroundColor:
        theme === "dark" ? "rgba(148, 163, 184, 0.2)" : "#f1f5f9",
      color: theme === "dark" ? "#cbd5e1" : "#475569",
      padding: "4px 10px",
      borderRadius: "12px",
      fontSize: "12px",
      fontWeight: "bold",
      width: "fit-content", // Adicionado para consistência
    },
    // Paginação
    pagination: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "20px",
    },
    pageButton: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "36px",
      height: "36px",
      border: `1px solid ${colors.border}`,
      backgroundColor: colors.card,
      borderRadius: "6px",
      cursor: "pointer",
      color: colors.text,
    },
    pageButtonDisabled: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "36px",
      height: "36px",
      border: `1px solid ${colors.border}`,
      backgroundColor: theme === "dark" ? "#1e293b" : "#f8fafc",
      borderRadius: "6px",
      cursor: "not-allowed",
      color: colors.muted,
    },
    // Modal
    modalOverlay: {
      position: "fixed" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: colors.card,
      padding: "30px",
      borderRadius: "12px",
      width: "100%",
      maxWidth: "500px",
      boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
      border: `1px solid ${colors.border}`,
      color: colors.text,
    },
    modalHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
    },
    modalTitle: {
      fontSize: "20px",
      fontWeight: "bold",
      color: colors.text,
      margin: 0,
    },
    form: { display: "flex", flexDirection: "column" as const, gap: "20px" },
    formGroup: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "8px",
    },
    label: { fontSize: "14px", fontWeight: "500", color: colors.text },
    input: {
      padding: "10px",
      border: `1px solid ${colors.border}`,
      borderRadius: "6px",
      fontSize: "15px",
      outline: "none",
      backgroundColor: theme === "dark" ? "#0f172a" : "white",
      color: colors.text,
    },
    modalFooter: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "10px",
      marginTop: "10px",
    },
    alertBox: {
      display: "flex",
      gap: "10px",
      backgroundColor: theme === "dark" ? "rgba(234, 179, 8, 0.1)" : "#fffbeb",
      color: theme === "dark" ? "#facc15" : "#b45309",
      padding: "10px",
      borderRadius: "6px",
      border: `1px solid ${theme === "dark" ? "#854d0e" : "#fcd34d"}`,
    },
  };

  if (isError)
    return (
      <div style={{ padding: "20px", color: colors.text }}>
        Erro ao carregar usuários.
      </div>
    );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Usuários ({totalCount})</h1>
      </div>

      <div style={styles.filterContainer}>
        <div style={styles.filterRow}>
          <div style={styles.searchWrapper}>
            <Search size={18} color={colors.muted} />
            <input
              placeholder="Buscar e-mail..."
              value={localEmail}
              onChange={(e) => setLocalEmail(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          <select
            value={filters.role || ""}
            onChange={(e) => handleSelectChange("role", e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">Todas Permissões</option>
            <option value="admin">Admin</option>
            <option value="user">Usuário</option>
          </select>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ArrowUpDown
              size={16}
              color={colors.muted}
              style={{
                position: "absolute",
                left: "10px",
                pointerEvents: "none",
              }}
            />
            <select
              value={filters.sort || "newest"}
              onChange={(e) => handleSelectChange("sort", e.target.value)}
              style={{
                ...styles.filterSelect,
                paddingLeft: "32px",
                minWidth: "180px",
              }}
            >
              <option value="newest">Recentes</option>
              <option value="role_asc">Permissão A-Z</option>
              <option value="role_desc">Permissão Z-A</option>
            </select>
          </div>
        </div>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeadRow}>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Permissão</th>
              <th style={styles.th}>Criado em</th>
              <th style={styles.thAction}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} style={styles.tdCenter}>
                  <Loader2
                    className="animate-spin"
                    style={{ margin: "0 auto" }}
                  />{" "}
                  Carregando...
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} style={styles.tableRow}>
                  <td
                    style={{
                      ...styles.td,
                      fontSize: "12px",
                      color: colors.muted,
                      fontFamily: "monospace",
                    }}
                  >
                    {user.id.slice(0, 8)}...
                  </td>
                  <td style={styles.td}>
                    <b>{user.email}</b>
                  </td>
                  <td style={styles.td}>
                    {user.role === "admin" ? (
                      <span style={styles.badgeAdmin}>
                        <Shield size={12} /> Admin
                      </span>
                    ) : (
                      <span style={styles.badgeUser}>Usuário</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString("pt-BR")
                      : "-"}
                  </td>
                  <td style={styles.tdAction}>
                    <button
                      onClick={() => handleOpenModal(user)}
                      style={styles.iconButton}
                    >
                      <Edit size={18} color="#0284c7" />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      style={styles.iconButton}
                    >
                      <Trash2 size={18} color="#ef4444" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={styles.pagination}>
        <span style={{ color: colors.muted, fontSize: "14px" }}>
          Pág <b>{filters.page}</b> de <b>{totalPages || 1}</b>
        </span>
        <div style={{ display: "flex", gap: "5px" }}>
          <button
            disabled={filters.page === 1}
            onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
            style={
              filters.page === 1 ? styles.pageButtonDisabled : styles.pageButton
            }
          >
            <ChevronLeft size={20} />
          </button>
          <button
            disabled={filters.page >= totalPages}
            onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
            style={
              filters.page >= totalPages
                ? styles.pageButtonDisabled
                : styles.pageButton
            }
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Editar Usuário</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                style={styles.closeButton}
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSave} style={styles.form}>
              <div style={styles.alertBox}>
                <ShieldAlert size={20} />
                <span style={{ fontSize: "13px" }}>
                  Alteração apenas visual (Exemplo).
                </span>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>E-mail</label>
                <input
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nível</label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  style={styles.input}
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={styles.secondaryButton}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={styles.primaryButton}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
