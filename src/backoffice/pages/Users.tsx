import { useState, useEffect } from 'react';
import { Search, Edit, Trash2, X, Save, Shield, ShieldAlert } from 'lucide-react';
import { userService } from '../../services/userService';
import type { UserProfile } from '../../types';

export const Users = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Controle do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({ email: '', role: 'user' });

  // 1. Carregar Usuários
  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch (error) {
      alert('Erro ao carregar usuários');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // 2. Abrir Modal de Edição
  const handleOpenModal = (user: UserProfile) => {
    setCurrentUser(user);
    setFormData({
      email: user.email,
      role: user.role
    });
    setIsModalOpen(true);
  };

  // 3. Salvar (Apenas Update neste caso)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const payload: UserProfile = {
        id: currentUser.id,
        email: formData.email, // O email é apenas visual aqui, o login não muda
        role: formData.role as 'user' | 'admin'
      };

      await userService.update(payload);
      
      setIsModalOpen(false);
      loadUsers();
    } catch (error) {
      alert('Erro ao salvar');
    }
  };

  // 4. Deletar
  const handleDelete = async (id: string) => {
    if (confirm('ATENÇÃO: Isso removerá os dados do perfil. Deseja continuar?')) {
      try {
        await userService.delete(id);
        loadUsers();
      } catch (error) {
        alert('Erro ao deletar');
      }
    }
  };

  // Filtro
  const filteredUsers = users.filter(u => 
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.container}>
      {/* --- HEADER --- */}
      <div style={styles.header}>
        <h1 style={styles.title}>Gerenciar Usuários</h1>
        {/* Botão Novo removido pois usuários devem se cadastrar via Auth */}
      </div>

      <div style={styles.filterBar}>
        <div style={styles.searchWrapper}>
          <Search size={18} color="#64748b" />
          <input 
            placeholder="Buscar por e-mail..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* --- TABELA --- */}
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
            {loading ? (
              <tr><td colSpan={5} style={styles.tdCenter}>Carregando...</td></tr>
            ) : filteredUsers.map(user => (
              <tr key={user.id} style={styles.tableRow}>
                <td style={{...styles.td, fontSize: '12px', color: '#94a3b8'}}>
                  {user.id.slice(0, 8)}...
                </td>
                <td style={styles.td}><b>{user.email}</b></td>
                <td style={styles.td}>
                  {user.role === 'admin' ? (
                    <span style={styles.badgeAdmin}><Shield size={12}/> Admin</span>
                  ) : (
                    <span style={styles.badgeUser}>Usuário</span>
                  )}
                </td>
                <td style={styles.td}>
                   {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '-'}
                </td>
                <td style={styles.tdAction}>
                <button 
                    onClick={() => handleOpenModal(user)} 
                    style={styles.iconButton}
                    title="Editar Permissões" 
                >
                    <Edit size={18} color="#0284c7" />
                </button>

                <button 
                    onClick={() => handleDelete(user.id)} 
                    style={styles.iconButton}
                    title="Remover Perfil"
                >
                    <Trash2 size={18} color="#ef4444" />
                </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MODAL --- */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Editar Usuário</h2>
              <button onClick={() => setIsModalOpen(false)} style={styles.closeButton}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSave} style={styles.form}>
              
              <div style={styles.alertBox}>
                <ShieldAlert size={20} />
                <span style={{fontSize: '13px'}}>
                  Alterar o e-mail aqui não altera o login do usuário, apenas o registro visual.
                </span>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>E-mail (Visual)</label>
                <input 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  style={styles.input} 
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Nível de Acesso</label>
                <select 
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  style={styles.input}
                >
                  <option value="user">Usuário Comum</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={styles.secondaryButton}>Cancelar</button>
                <button type="submit" style={styles.primaryButton}>
                  <Save size={18} /> Salvar Permissões
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Estilos Reutilizados (Copie e cole ou mova para um arquivo compartilhado depois)
const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '1200px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#1e293b' },
  primaryButton: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0f172a', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' },
  secondaryButton: { backgroundColor: '#fff', color: '#64748b', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' },
  iconButton: { background: 'none', border: 'none', cursor: 'pointer', padding: '5px' },
  closeButton: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' },
  filterBar: { marginBottom: '20px', display: 'flex', gap: '15px' },
  searchWrapper: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'white', padding: '10px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', flex: 1, maxWidth: '400px' },
  searchInput: { border: 'none', outline: 'none', width: '100%', fontSize: '15px' },
  tableContainer: { backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  tableHeadRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '15px', fontSize: '14px', fontWeight: '600', color: '#64748b' },
  thAction: { padding: '15px', fontSize: '14px', fontWeight: '600', color: '#64748b', textAlign: 'right' },
  tableRow: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '15px', fontSize: '15px', color: '#334155' },
  tdCenter: { padding: '30px', textAlign: 'center', color: '#64748b' },
  tdAction: { padding: '15px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '10px' },
  
  // Badges Específicos
  badgeAdmin: { display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', width: 'fit-content' },
  badgeUser: { backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' },

  // Modal
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  modalTitle: { fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: '500', color: '#334155' },
  input: { padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '15px', outline: 'none' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' },
  alertBox: { display: 'flex', gap: '10px', backgroundColor: '#fffbeb', color: '#b45309', padding: '10px', borderRadius: '6px', border: '1px solid #fcd34d' }
};