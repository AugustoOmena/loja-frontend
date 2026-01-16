import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, X, Save } from 'lucide-react';
import { productService } from '../../services/productService';
import type { Product } from '../../types';

export const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Controle do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '', size: '' });
  // 1. Carregar Produtos
  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productService.getAll();
      // Ordena por ID decrescente (mais novos primeiro)
      setProducts(data.sort((a, b) => (b.id || 0) - (a.id || 0)));
    } catch (error) {
      alert('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // 2. Manipulação do Modal
  const handleOpenModal = (product?: Product) => {
    if (product) {
      setCurrentProduct(product);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        size: product.size || ''
      });
    } else {
      setCurrentProduct(null);
      setFormData({ name: '', price: '', size: '' });
    }
    setIsModalOpen(true);
  };

  // 3. Salvar (Criar ou Editar)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        price: parseFloat(formData.price),
        size: formData.size
      };

      if (currentProduct && currentProduct.id) {
        await productService.update({ ...payload, id: currentProduct.id });
      } else {
        await productService.create(payload);
      }
      
      setIsModalOpen(false);
      loadProducts(); // Recarrega a tabela
    } catch (error) {
      alert('Erro ao salvar');
    }
  };

  // 4. Deletar
  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await productService.delete(id);
        loadProducts();
      } catch (error) {
        alert('Erro ao deletar');
      }
    }
  };

  // Filtro local
  const filteredProducts = products.filter(p => 
  (p.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.container}>
      {/* --- HEADER E FILTROS --- */}
      <div style={styles.header}>
        <h1 style={styles.title}>Gerenciar Produtos</h1>
        <button onClick={() => handleOpenModal()} style={styles.primaryButton}>
          <Plus size={20} /> Novo Produto
        </button>
      </div>

      <div style={styles.filterBar}>
        <div style={styles.searchWrapper}>
          <Search size={18} color="#64748b" />
          <input 
            placeholder="Buscar por nome..." 
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
              <th style={styles.th}>Nome</th>
              <th style={styles.th}>Preço</th>
              <th style={styles.th}>size</th>
              <th style={styles.thAction}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={styles.tdCenter}>Carregando...</td></tr>
            ) : filteredProducts.map(product => (
              <tr key={product.id} style={styles.tableRow}>
                <td style={styles.td}>#{product.id}</td>
                <td style={styles.td}><b>{product.name}</b></td>
                <td style={styles.td}>R$ {product.price.toFixed(2)}</td>
                <td style={styles.td}>
                  <span style={styles.badge}>{product.size}</span>
                </td>
                <td style={styles.tdAction}>
                  <button onClick={() => handleOpenModal(product)} style={styles.iconButton}><Edit size={18} color="#0284c7" /></button>
                  <button onClick={() => handleDelete(product.id!)} style={styles.iconButton}><Trash2 size={18} color="#ef4444" /></button>
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
              <h2 style={styles.modalTitle}>{currentProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={styles.closeButton}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSave} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nome do Produto</label>
                <input 
                  required 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  style={styles.input} 
                  placeholder="Ex: Biquíni Asa Delta"
                />
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Preço (R$)</label>
                  <input 
                    required 
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    style={styles.input} 
                    placeholder="0.00"
                  />
                </div>
                <div style={{ ...styles.formGroup, width: '100px' }}>
                  <label style={styles.label}>size</label>
                  <select 
                    value={formData.size}
                    onChange={e => setFormData({...formData, size: e.target.value})}
                    style={styles.input}
                  >
                    <option value="">-</option>
                    <option value="P">P</option>
                    <option value="M">M</option>
                    <option value="G">G</option>
                    <option value="GG">GG</option>
                  </select>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={styles.secondaryButton}>Cancelar</button>
                <button type="submit" style={styles.primaryButton}>
                  <Save size={18} /> Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Estilos (CSS-in-JS) para manter o arquivo único e organizado
const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '1200px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#1e293b' },
  
  // Botões
  primaryButton: { 
    display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0f172a', color: 'white', 
    border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' 
  },
  secondaryButton: { 
    backgroundColor: '#fff', color: '#64748b', border: '1px solid #cbd5e1', 
    padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' 
  },
  iconButton: { background: 'none', border: 'none', cursor: 'pointer', padding: '5px' },
  closeButton: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' },

  // Filtros
  filterBar: { marginBottom: '20px', display: 'flex', gap: '15px' },
  searchWrapper: { 
    display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'white', 
    padding: '10px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', flex: 1, maxWidth: '400px' 
  },
  searchInput: { border: 'none', outline: 'none', width: '100%', fontSize: '15px' },

  // Tabela
  tableContainer: { backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  tableHeadRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '15px', fontSize: '14px', fontWeight: '600', color: '#64748b' },
  thAction: { padding: '15px', fontSize: '14px', fontWeight: '600', color: '#64748b', textAlign: 'right' },
  tableRow: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '15px', fontSize: '15px', color: '#334155' },
  tdCenter: { padding: '30px', textAlign: 'center', color: '#64748b' },
  tdAction: { padding: '15px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '10px' },
  badge: { 
    backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 10px', 
    borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' 
  },

  // Modal
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
  },
  modalContent: {
    backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '500px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
  },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  modalTitle: { fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: '500', color: '#334155' },
  input: {
    padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '15px', outline: 'none'
  },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }
};