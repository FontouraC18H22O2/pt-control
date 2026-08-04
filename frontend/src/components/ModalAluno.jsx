import React, { useState, useEffect } from 'react';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

export default function ModalAluno({ isOpen, onClose, onSave, alunoParaEditar }) {
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [status, setStatus] = useState('Ativo');
  const [error, setError] = useState('');

  useEffect(() => {
    if (alunoParaEditar) {
      setNome(alunoParaEditar.nome || '');
      // Se o número já tem indicativo (+351...) usa diretamente, senão converte
      const num = alunoParaEditar.whatsapp || '';
      setWhatsapp(num.startsWith('+') ? num : num ? `+351${num}` : '');
      setStatus(alunoParaEditar.status || 'Ativo');
    } else {
      setNome('');
      setWhatsapp('');
      setStatus('Ativo');
    }
    setError('');
  }, [alunoParaEditar, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!nome.trim()) {
      setError('Por favor, preencha o nome do aluno.');
      return;
    }
    if (!whatsapp) {
      setError('Por favor, introduza o número de telemóvel.');
      return;
    }
    if (!isValidPhoneNumber(whatsapp)) {
      setError('Número de telemóvel inválido para o país selecionado.');
      return;
    }

    onSave({
      nome: nome.trim(),
      whatsapp: whatsapp, // Guarda com indicativo: ex: +351912345678
      status
    });
    onClose();
  };

  return (
    <>
      {/* Estilos para integrar o PhoneInput na estética do projeto */}
      <style>{`
        .PhoneInput {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #0a0a0a;
          border: 1px solid #262626;
          border-radius: 12px;
          padding: 0 16px;
          transition: border-color 0.2s;
        }
        .PhoneInput:focus-within {
          border-color: #dc2626;
        }
        .PhoneInputCountry {
          display: flex;
          align-items: center;
          gap: 6px;
          border-right: 1px solid #262626;
          padding-right: 10px;
          margin-right: 2px;
        }
        .PhoneInputCountrySelect {
          background: transparent;
          border: none;
          color: #a3a3a3;
          font-size: 13px;
          outline: none;
          cursor: pointer;
          max-width: 28px;
          opacity: 0;
          position: absolute;
        }
        .PhoneInputCountrySelectArrow {
          color: #525252;
          font-size: 10px;
        }
        .PhoneInputCountryIcon {
          width: 20px;
          height: 15px;
          border-radius: 2px;
        }
        .PhoneInputInput {
          background: transparent;
          border: none;
          color: white;
          font-size: 14px;
          font-family: monospace;
          outline: none;
          width: 100%;
          padding: 12px 0;
        }
        .PhoneInputInput::placeholder {
          color: #525252;
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="relative w-full max-w-md p-6 overflow-hidden border shadow-2xl bg-neutral-900 border-neutral-800 rounded-2xl">

          {/* Cabeçalho */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800">
            <h2 className="text-xl font-bold tracking-tight text-white">
              {alunoParaEditar ? 'Editar Ficha do Aluno' : 'Registar Novo Aluno'}
            </h2>
            <button onClick={onClose} className="p-1 text-lg transition-colors cursor-pointer text-neutral-500 hover:text-white">✕</button>
          </div>

          {/* Erro */}
          {error && (
            <div className="p-3 mb-4 text-xs font-medium text-red-400 border bg-red-500/10 border-red-500/20 rounded-xl">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Nome */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Nome Completo *</label>
              <input
                type="text"
                placeholder="Ex: Carlos Alberto Antunes"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-3 text-sm text-white transition-colors border outline-none bg-neutral-950 border-neutral-800 rounded-xl focus:border-fitnessGym placeholder-neutral-600"
              />
            </div>

            {/* Telefone Internacional */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-wider uppercase text-neutral-400">
                Telemóvel / WhatsApp *
              </label>
              <PhoneInput
                placeholder="912 345 678"
                value={whatsapp}
                onChange={setWhatsapp}
                defaultCountry="PT"
                international
              />
              {whatsapp && !isValidPhoneNumber(whatsapp) && (
                <p className="text-[11px] text-amber-500">⚠️ Número incompleto ou inválido para este país</p>
              )}
              {whatsapp && isValidPhoneNumber(whatsapp) && (
                <p className="text-[11px] text-emerald-500">✔ Número válido — {whatsapp}</p>
              )}
            </div>

            {/* Estado (só em edição) */}
            {alunoParaEditar && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Estado do Atleta</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 text-sm text-white transition-colors border outline-none cursor-pointer bg-neutral-950 border-neutral-800 rounded-xl focus:border-fitnessGym"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>
            )}

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-neutral-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800 text-sm font-medium transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-fitnessGym hover:bg-red-700 text-white font-bold text-sm transition-colors cursor-pointer shadow-lg shadow-red-500/20"
              >
                {alunoParaEditar ? 'Atualizar Dados' : 'Guardar Aluno'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}