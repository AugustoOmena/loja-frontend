import { useState, useEffect } from "react";
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

export const Users = () => {
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

  useEffect(() => {
    setFilters((p) => ({ ...p, email: debouncedEmail, page: 1 }));
  }, [debouncedEmail]);

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
    setFormData({ email: user.email, role: user.role });
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

  if (isError)
    return <div style={styles.container}>Erro ao carregar usuários.</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Usuários ({totalCount})</h1>
      </div>

      <div style={styles.filterContainer}>
        <div style={styles.filterRow}>
          <div style={styles.searchWrapper}>
            <Search size={18} style={{ color: "var(--muted)" }} />
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
              style={{
                position: "absolute",
                left: "10px",
                pointerEvents: "none",
                color: "var(--muted)",
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
                      color: "var(--muted)",
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
        <span style={{ color: "var(--muted)", fontSize: "14px" }}>
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
                  Alteração apenas visual.
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

// ... Estilos mantidos iguais ...
const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: "20px", maxWidth: "1200px", margin: "0 auto" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
  },
  title: { fontSize: "24px", fontWeight: "bold", color: "var(--text)" },
  primaryButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#0f172a",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
  },
  secondaryButton: {
    backgroundColor: "var(--bg-elevated)",
    color: "var(--muted)",
    border: "1px solid #cbd5e1",
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
    color: "var(--muted)",
  },
  filterContainer: {
    marginBottom: "20px",
    backgroundColor: "var(--bg-elevated)",
    padding: "15px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  filterRow: {
    display: "flex",
    gap: "15px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  searchWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "var(--input-bg)",
    padding: "10px 15px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    flex: 2,
    minWidth: "200px",
  },
  searchInput: {
    border: "none",
    outline: "none",
    width: "100%",
    background: "transparent",
    fontSize: "14px",
  },
  filterSelect: {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    minWidth: "150px",
    fontSize: "14px",
  },
  tableContainer: {
    backgroundColor: "var(--bg-elevated)",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    overflow: "hidden",
  },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  tableHeadRow: {
    backgroundColor: "var(--bg-elevated)",
    borderBottom: "1px solid #e2e8f0",
  },
  th: {
    padding: "15px",
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--muted)",
  },
  thAction: {
    padding: "15px",
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--muted)",
    textAlign: "right",
  },
  tableRow: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "15px", fontSize: "15px", color: "var(--text)" },
  tdCenter: { padding: "30px", textAlign: "center", color: "var(--muted)" },
  tdAction: {
    padding: "15px",
    textAlign: "right",
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },
  badgeAdmin: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    backgroundColor: "#dcfce7",
    color: "#166534",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "bold",
    width: "fit-content",
  },
  badgeUser: {
    backgroundColor: "#f1f5f9",
    color: "#475569",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "bold",
  },
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
    border: "1px solid #cbd5e1",
    backgroundColor: "var(--bg-elevated)",
    borderRadius: "6px",
    cursor: "pointer",
    color: "var(--text)",
  },
  pageButtonDisabled: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    border: "1px solid #e2e8f0",
    backgroundColor: "var(--bg)",
    borderRadius: "6px",
    cursor: "not-allowed",
    color: "#cbd5e1",
  },
  modalOverlay: {
    position: "fixed",
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
    backgroundColor: "var(--bg-elevated)",
    padding: "30px",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "500px",
    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
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
    color: "var(--text)",
    margin: 0,
  },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  formGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "14px", fontWeight: "500", color: "var(--text)" },
  input: {
    padding: "10px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "15px",
    outline: "none",
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
    backgroundColor: "#fffbeb",
    color: "#b45309",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #fcd34d",
  },
};
