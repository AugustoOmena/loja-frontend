import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, X, Save, ChevronLeft, ChevronRight, FileSpreadsheet, Package, ArrowUpDown } from 'lucide-react';
import { productService } from '../../services/productService';
import type { Product, ProductFilters } from '../../types';
import { useDebounce } from '../../hooks/useDebounce'; // <--- IMPORTE O HOOK

export const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // 1. Estado da API (Filtros Reais)
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1, limit: 10, name: '', min_price: '', max_price: '', size: '', sort: 'newest'
  });

  // 2. Estados Locais (Inputs de Texto) - Para a digitação ser fluida
  const [localName, setLocalName] = useState('');
  const [localMinPrice, setLocalMinPrice] = useState('');
  const [localMaxPrice, setLocalMaxPrice] = useState('');

  // 3. Versões Debounced (Só atualizam após 500ms)
  const debouncedName = useDebounce(localName, 500);
  const debouncedMinPrice = useDebounce(localMinPrice, 500);
  const debouncedMaxPrice = useDebounce(localMaxPrice, 500);

  // 4. Sincroniza o Debounce com o Filtro da API
  // Quando o usuário para de digitar, atualizamos o 'filters', que dispara o loadProducts
  useEffect(() => {
    setFilters(prev => ({ ...prev, name: debouncedName, page: 1 }));
  }, [debouncedName]);

  useEffect(() => {
    setFilters(prev => ({ ...prev, min_price: debouncedMinPrice, page: 1 }));
  }, [debouncedMinPrice]);

  useEffect(() => {
    setFilters(prev => ({ ...prev, max_price: debouncedMaxPrice, page: 1 }));
  }, [debouncedMaxPrice]);


  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', size: '', quantity: '0' });

  // A chamada da API continua dependendo apenas de 'filters'
  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await productService.getAll(filters);
      setProducts(response.data);
      setTotalCount(response.count);
    } catch (error) {
      console.error(error);
      // alert('Erro ao carregar produtos'); // Comentei para não ficar pipocando se der erro no typing
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, [filters]);

  const handleExportExcel = async () => {
    try {
      const allProducts = await productService.getAllForExport();
      const headers = ['ID', 'Nome', 'Descrição', 'Preço', 'Estoque', 'Tamanho'];
      const csvRows = allProducts.map(p => {
        const cleanName = `"${(p.name || '').replace(/"/g, '""')}"`;
        const cleanDesc = `"${(p.description || '').replace(/"/g, '""')}"`;
        const formattedPrice = p.price.toFixed(2).replace('.', ',');
        return [p.id, cleanName, cleanDesc, formattedPrice, p.quantity || 0, p.size || ''].join(';');
      });
      const csvString = [headers.join(';'), ...csvRows].join('\n');
      const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `estoque_loja_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert('Erro ao gerar planilha');
    }
  };

  // Handler para Selects (Tamanho/Sort) - Estes não precisam de debounce
  const handleSelectChange = (key: keyof ProductFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setCurrentProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        size: product.size || '',
        quantity: (product.quantity || 0).toString()
      });
    } else {
      setCurrentProduct(null);
      setFormData({ name: '', description: '', price: '', size: '', quantity: '0' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        size: formData.size || null,
        quantity: parseInt(formData.quantity) || 0
      };

      if (currentProduct && currentProduct.id) {
        await productService.update({ ...payload, id: currentProduct.id });
      } else {
        await productService.create(payload);
      }
      setIsModalOpen(false);
      loadProducts();
    } catch (error) {
      alert('Erro ao salvar');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Excluir este produto?')) {
      await productService.delete(id);
      loadProducts();
    }
  };

  const totalPages = Math.ceil(totalCount / filters.limit);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Produtos ({totalCount})</h1>
        <div style={{display: 'flex', gap: '10px'}}>
          <button onClick={handleExportExcel} style={styles.excelButton} title="Baixar Planilha">
            <FileSpreadsheet size={20} /> Exportar Excel
          </button>
          <button onClick={() => handleOpenModal()} style={styles.primaryButton}>
            <Plus size={20} /> Novo
          </button>
        </div>
      </div>

      <div style={styles.filterContainer}>
        <div style={styles.filterRow}>
          
          {/* BUSCA NOME (Usa state local) */}
          <div style={styles.searchWrapper}>
            <Search size={18} color="#64748b" />
            <input 
              placeholder="Buscar nome..." 
              value={localName} 
              onChange={e => setLocalName(e.target.value)} // Atualiza localmente
              style={styles.searchInput} 
            />
          </div>

          {/* PREÇO (Usa state local) */}
          <div style={styles.inputGroupRow}>
            <input 
              placeholder="Preço Min" 
              type="number" 
              value={localMinPrice} 
              onChange={e => setLocalMinPrice(e.target.value)} 
              style={styles.filterInput} 
            />
            <span style={{color: '#94a3b8'}}>-</span>
            <input 
              placeholder="Preço Max" 
              type="number" 
              value={localMaxPrice} 
              onChange={e => setLocalMaxPrice(e.target.value)} 
              style={styles.filterInput} 
            />
          </div>

          {/* SELECTS (Usa direto o filters, sem debounce) */}
          <select value={filters.size || ''} onChange={e => handleSelectChange('size', e.target.value)} style={styles.filterSelect}>
            <option value="">Tam. (Todos)</option>
            <option value="P">P</option><option value="M">M</option><option value="G">G</option><option value="GG">GG</option>
          </select>

          <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
            <ArrowUpDown size={16} color="#64748b" style={{position: 'absolute', left: '10px', pointerEvents: 'none'}} />
            <select 
              value={filters.sort || 'newest'} 
              onChange={e => handleSelectChange('sort', e.target.value)} 
              style={{...styles.filterSelect, paddingLeft: '32px', minWidth: '160px'}}
            >
              <option value="newest">Mais Recentes</option>
              <option value="qty_asc">Estoque: Menor ⬆</option>
              <option value="qty_desc">Estoque: Maior ⬇</option>
            </select>
          </div>

        </div>
      </div>

      {/* Tabela, Paginação e Modal mantêm-se iguais */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeadRow}>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Produto</th>
              <th style={styles.th}>Preço</th>
              <th style={styles.th}>Qtd.</th>
              <th style={styles.th}>Tam.</th>
              <th style={styles.thAction}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={styles.tdCenter}>Carregando...</td></tr>
            ) : products.map(product => (
              <tr key={product.id} style={styles.tableRow}>
                <td style={styles.td}>#{product.id}</td>
                <td style={styles.td}>
                  <div style={{fontWeight: 'bold'}}>{product.name}</div>
                  <div style={{fontSize: '12px', color: '#64748b', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{product.description}</div>
                </td>
                <td style={styles.td}>R$ {product.price.toFixed(2)}</td>
                <td style={styles.td}>
                   <div style={{display: 'flex', alignItems: 'center', gap: '5px', color: (product.quantity || 0) < 5 ? '#ef4444' : '#334155'}}>
                      <Package size={16} /> {product.quantity || 0}
                   </div>
                </td>
                <td style={styles.td}>{product.size && <span style={styles.badge}>{product.size}</span>}</td>
                <td style={styles.tdAction}>
                  <button onClick={() => handleOpenModal(product)} style={styles.iconButton} title="Editar"><Edit size={18} color="#0284c7" /></button>
                  <button onClick={() => handleDelete(product.id!)} style={styles.iconButton} title="Excluir"><Trash2 size={18} color="#ef4444" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.pagination}>
        <span style={{color: '#64748b', fontSize: '14px'}}>Página <b>{filters.page}</b> de <b>{totalPages || 1}</b></span>
        <div style={{display: 'flex', gap: '5px'}}>
          <button disabled={filters.page === 1} onClick={() => setFilters(p => ({...p, page: p.page - 1}))} style={filters.page === 1 ? styles.pageButtonDisabled : styles.pageButton}><ChevronLeft size={20} /></button>
          <button disabled={filters.page >= totalPages} onClick={() => setFilters(p => ({...p, page: p.page + 1}))} style={filters.page >= totalPages ? styles.pageButtonDisabled : styles.pageButton}><ChevronRight size={20} /></button>
        </div>
      </div>

      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{currentProduct ? 'Editar' : 'Novo'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={styles.closeButton}><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nome</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={styles.input} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Descrição</label>
                <textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{...styles.input, resize: 'vertical'}} />
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Preço (R$)</label>
                  <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} style={styles.input} />
                </div>
                <div style={{ ...styles.formGroup, width: '100px' }}>
                  <label style={styles.label}>Qtd.</label>
                  <input required type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} style={styles.input} />
                </div>
                <div style={{ ...styles.formGroup, width: '100px' }}>
                  <label style={styles.label}>Tamanho</label>
                  <select value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} style={styles.input}>
                    <option value="">-</option><option value="P">P</option><option value="M">M</option><option value="G">G</option><option value="GG">GG</option>
                  </select>
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={styles.secondaryButton}>Cancelar</button>
                <button type="submit" style={styles.primaryButton}><Save size={18} /> Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Estilos
const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '1200px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#1e293b' },
  primaryButton: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0f172a', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' },
  secondaryButton: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#fff', color: '#64748b', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' },
  excelButton: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#107569', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' },
  iconButton: { background: 'none', border: 'none', cursor: 'pointer', padding: '5px' },
  closeButton: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' },
  filterContainer: { marginBottom: '20px', backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' },
  filterRow: { display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' },
  searchWrapper: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f8fafc', padding: '10px 15px', borderRadius: '6px', border: '1px solid #e2e8f0', flex: 2, minWidth: '200px' },
  searchInput: { border: 'none', outline: 'none', width: '100%', background: 'transparent', fontSize: '14px' },
  inputGroupRow: { display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '150px' },
  filterInput: { padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', width: '100%', fontSize: '14px' },
  filterSelect: { padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', minWidth: '120px', fontSize: '14px' },
  tableContainer: { backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  tableHeadRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '15px', fontSize: '14px', fontWeight: '600', color: '#64748b' },
  thAction: { padding: '15px', fontSize: '14px', fontWeight: '600', color: '#64748b', textAlign: 'right' },
  tableRow: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '15px', fontSize: '15px', color: '#334155' },
  tdCenter: { padding: '30px', textAlign: 'center', color: '#64748b' },
  tdAction: { padding: '15px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '10px' },
  badge: { backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' },
  pagination: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' },
  pageButton: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', border: '1px solid #cbd5e1', backgroundColor: 'white', borderRadius: '6px', cursor: 'pointer', color: '#334155' },
  pageButtonDisabled: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', border: '1px solid #e2e8f0', backgroundColor: '#f1f5f9', borderRadius: '6px', cursor: 'not-allowed', color: '#cbd5e1' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  modalTitle: { fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: '500', color: '#334155' },
  input: { padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '15px', outline: 'none' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }
};