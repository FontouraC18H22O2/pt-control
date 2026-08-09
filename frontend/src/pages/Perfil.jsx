import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function Perfil() {
  const { user, role, token, updateUserProps } = useAuth();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [codigoVerificacao, setCodigoVerificacao] = useState('');
  const [loadingCodigo, setLoadingCodigo] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });
  const [mostrarPassword, setMostrarPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setNome(user.nome || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const configConfig = {
    headers: { Authorization: `Bearer ${token || localStorage.getItem('pt_api_token')}` }
  };

  const iniciais = nome ? nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '?';
  const alterouEmail = email.toLowerCase().trim() !== user?.email;
  const alterouPassword = !!password;
  const precisaCodigo = alterouEmail || alterouPassword;

  const badgeRole = {
    ADMIN: { label: 'Administrador', cor: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    PT: { label: 'Personal Trainer', cor: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    GUEST: { label: 'Convidado', cor: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20' },
  }[role] || { label: role, cor: 'bg-neutral-800 text-neutral-400 border-neutral-700' };

  const solicitarCodigo2FA = async () => {
    try {
      setLoadingCodigo(true);
      setMensagem({ tipo: '', texto: '' });
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/perfil/solicitar-codigo`, {}, configConfig);
      setCodigoEnviado(true);
      setMensagem({ tipo: 'sucesso', texto: 'Código de segurança enviado para o teu e-mail!' });
    } catch (error) {
      setMensagem({ tipo: 'erro', texto: error.response?.data?.error || 'Erro ao solicitar código.' });
    } finally {
      setLoadingCodigo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem({ tipo: '', texto: '' });

    if (!nome.trim() || !email.trim()) return setMensagem({ tipo: 'erro', texto: 'O nome e o e-mail são obrigatórios.' });
    if (alterouPassword && password.length < 6) return setMensagem({ tipo: 'erro', texto: 'A palavra-passe deve ter pelo menos 6 caracteres.' });
    if (alterouPassword && password !== confirmPassword) return setMensagem({ tipo: 'erro', texto: 'As palavras-passe não coincidem.' });
    if (precisaCodigo && !codigoVerificacao.trim()) return setMensagem({ tipo: 'erro', texto: 'Introduz o código de 6 dígitos enviado para o teu e-mail.' });

    try {
      setLoadingSubmit(true);
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/auth/perfil/atualizar`,
        { nome, email, password: password || undefined, codigo: codigoVerificacao || undefined },
        configConfig
      );
      updateUserProps(response.data.user);
      setPassword(''); setConfirmPassword(''); setCodigoVerificacao(''); setCodigoEnviado(false);
      setMensagem({ tipo: 'sucesso', texto: 'Perfil atualizado com sucesso!' });
    } catch (error) {
      setMensagem({ tipo: 'erro', texto: error.response?.data?.error || 'Erro ao atualizar perfil.' });
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-2">

      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">O meu Perfil</h1>
        <p className="mt-1 text-sm text-neutral-400">Gere os teus dados pessoais e segurança da conta.</p>
      </div>

      {/* Aviso conta temporária */}
      {user?.mustChangePassword && (
        <div className="flex items-start gap-3 p-4 text-sm border rounded-2xl bg-amber-500/10 border-amber-500/20 text-amber-400">
          <span className="text-lg shrink-0">⚠️</span>
          <div>
            <p className="font-bold">Aviso de Segurança</p>
            <p className="mt-0.5 text-xs opacity-90">Conta com palavra-passe temporária. Atualiza os teus dados para aceder a todas as funcionalidades.</p>
          </div>
        </div>
      )}

      {/* Feedback */}
      {mensagem.texto && (
        <div className={`p-4 rounded-2xl text-sm border font-medium flex items-center gap-2 ${
          mensagem.tipo === 'sucesso' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {mensagem.tipo === 'sucesso' ? '✅' : '⚠️'} {mensagem.texto}
        </div>
      )}

      {/* Cartão de identidade */}
      <div className="p-6 border bg-neutral-900 border-neutral-800 rounded-2xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">

          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-500/20">
              <span className="text-2xl font-black text-white">{iniciais}</span>
            </div>
            {/* Indicador online */}
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-neutral-900 rounded-full"></span>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <h2 className="text-xl font-bold text-white">{user?.nome || '—'}</h2>
            <p className="text-sm text-neutral-400">{user?.email || '—'}</p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              {/* Badge de role */}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badgeRole.cor}`}>
                {role === 'ADMIN' ? '👑' : role === 'PT' ? '💪' : '👤'} {badgeRole.label}
              </span>
              {/* Badge conta ativa */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Conta Ativa
              </span>
              {/* Badge 2FA */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-blue-500/10 text-blue-400 border-blue-500/20">
                🔒 2FA Ativo
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">

        {/* Secção: Dados Pessoais */}
        <div className="p-6 border bg-neutral-900 border-neutral-800 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
            <span className="text-lg">👤</span>
            <div>
              <h3 className="text-sm font-bold text-white">Dados Pessoais</h3>
              <p className="text-[11px] text-neutral-500">Nome e endereço de e-mail da conta</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Nome Completo</label>
              <input
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-wider uppercase text-neutral-400">
                Endereço de E-mail
                {alterouEmail && <span className="ml-2 text-amber-400 normal-case font-normal">(alterado)</span>}
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors ${alterouEmail ? 'border-amber-500/50 focus:border-amber-500' : 'border-neutral-800 focus:border-red-500'}`}
              />
            </div>
          </div>
        </div>

        {/* Secção: Segurança */}
        <div className="p-6 border bg-neutral-900 border-neutral-800 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
            <span className="text-lg">🔑</span>
            <div>
              <h3 className="text-sm font-bold text-white">Palavra-Passe</h3>
              <p className="text-[11px] text-neutral-500">Deixa em branco para manter a atual</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-400">Nova Palavra-Passe</label>
              <div className="relative">
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 pr-10 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                />
                <button type="button" onClick={() => setMostrarPassword(!mostrarPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white cursor-pointer">
                  {mostrarPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-400">Confirmar Palavra-Passe</label>
              <div className="relative">
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  placeholder="Repete a palavra-passe"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={`w-full bg-neutral-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors ${
                    confirmPassword && password !== confirmPassword ? 'border-red-500/50' : confirmPassword && password === confirmPassword ? 'border-emerald-500/50' : 'border-neutral-800 focus:border-red-500'
                  }`}
                />
                {confirmPassword && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs">
                    {password === confirmPassword ? '✅' : '❌'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Indicador de força da password */}
          {password && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1,2,3,4].map(n => (
                  <div key={n} className={`h-1 flex-1 rounded-full transition-colors ${
                    password.length >= n * 3
                      ? n <= 1 ? 'bg-red-500' : n <= 2 ? 'bg-amber-500' : n <= 3 ? 'bg-blue-500' : 'bg-emerald-500'
                      : 'bg-neutral-800'
                  }`} />
                ))}
              </div>
              <p className="text-[10px] text-neutral-500">
                {password.length < 3 ? 'Muito fraca' : password.length < 6 ? 'Fraca' : password.length < 9 ? 'Média' : 'Forte'}
              </p>
            </div>
          )}
        </div>

        {/* Secção: Verificação 2FA — aparece só quando necessário */}
        {precisaCodigo && (
          <div className="p-6 border bg-amber-500/5 border-amber-500/20 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-amber-500/10">
              <span className="text-lg">🔒</span>
              <div>
                <h3 className="text-sm font-bold text-amber-400">Verificação de Identidade</h3>
                <p className="text-[11px] text-neutral-500">Obrigatória ao alterar e-mail ou palavra-passe</p>
              </div>
            </div>

            <p className="text-xs text-neutral-400">
              Clica em <strong className="text-white">Solicitar Código</strong> para receber um token de 6 dígitos no teu e-mail atual.
            </p>

            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <input
                type="text"
                maxLength={6}
                placeholder="_ _ _ _ _ _"
                value={codigoVerificacao}
                onChange={e => setCodigoVerificacao(e.target.value)}
                disabled={!codigoEnviado}
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-center font-mono text-lg tracking-[0.5em] text-white focus:outline-none focus:border-amber-500 transition-colors disabled:opacity-40"
              />
              <button
                type="button"
                onClick={solicitarCodigo2FA}
                disabled={loadingCodigo}
                className="w-full sm:w-auto px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold rounded-xl transition-colors text-white disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                {loadingCodigo ? '📨 A enviar...' : codigoEnviado ? '🔄 Reenviar' : '📨 Solicitar Código'}
              </button>
            </div>

            {codigoEnviado && (
              <p className="text-[11px] text-emerald-400">✔ Código enviado! Verifica o teu e-mail.</p>
            )}
          </div>
        )}

        {/* Botão guardar */}
        <button
          type="submit"
          disabled={loadingSubmit}
          className="w-full py-3 text-sm font-bold tracking-wider text-white uppercase transition-all bg-red-600 hover:bg-red-700 rounded-2xl shadow-lg shadow-red-600/20 cursor-pointer disabled:opacity-50"
        >
          {loadingSubmit ? ' A guardar...' : ' Confirmar e Guardar'}
        </button>
      </form>
    </div>
  );
}