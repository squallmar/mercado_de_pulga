import { useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  verified: boolean;
  created_at: string;
}

interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSave: (user: User) => void;
}

export default function EditUserModal({ user, onClose, onSave }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    verified: user.verified
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/users?id=${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSave({ ...user, ...formData });
        alert('Usuário atualizado com sucesso!');
      } else {
        throw new Error('Erro ao atualizar usuário');
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      alert('Erro ao atualizar usuário. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div 
        className="vintage-card w-[96%] sm:w-full max-w-sm sm:max-w-md flex flex-col max-h-[88vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 border-b border-[#E8DCC6]">
          <h3 className="font-vintage-title text-lg sm:text-xl" style={{ color: '#6B4C57' }}>
            ✏️ Editar Usuário
          </h3>
          <button
            onClick={onClose}
            className="text-[#6B4C57] hover:text-[#8B6F47] text-xl"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Content (scrollable) */}
        <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-vintage-subtitle text-sm mb-1" style={{ color: '#6B4C57' }}>
                Nome
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="vintage-input w-full"
                required
              />
            </div>

            <div>
              <label className="block font-vintage-subtitle text-sm mb-1" style={{ color: '#6B4C57' }}>
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="vintage-input w-full"
                required
              />
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.verified}
                  onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                  className="rounded"
                />
                <span className="font-vintage-subtitle text-sm" style={{ color: '#6B4C57' }}>
                  ✅ Usuário Verificado
                </span>
              </label>
              <p className="font-vintage-body text-xs mt-1" style={{ color: '#8B6F47' }}>
                Usuários verificados têm maior credibilidade no marketplace
              </p>
            </div>
          </form>
        </div>

        {/* Footer sticky */}
        <div className="sticky bottom-0 bg-[#FAF8F3] border-t border-[#E8DCC6] px-4 sm:px-6 py-3 sm:py-4 flex space-x-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="vintage-button flex-1 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : '💾 Salvar'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 sm:px-4 py-2 border-2 border-[#8B6F47] text-[#8B6F47] rounded-lg font-vintage-subtitle hover:bg-[#8B6F47] hover:text-white transition-colors text-sm sm:text-base"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}