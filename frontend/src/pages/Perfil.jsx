import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

export default function Perfil() {
  // 🔥 ADICIONADO: Extraímos também o 'token' do estado global de autenticação
  const { user, token, updateUserProps } = useAuth();

  // Estados dos formulários
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estados para o fluxo de verificação por E-mail (2FA)
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [codigoVerificacao, setCodigoVerificacao] = useState('');
  const [loadingCodigo, setLoadingCodigo] = useState(false);

  // Estados de feedback
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  // Sincronizar os campos do formulário assim que os dados do user carregarem
  useEffect(() => {
    if (user) {
      setNome(user.nome || '');
      setEmail(user.email || '');
    }
  }, [user]);

  // Configuration de segurança para o Axios com o token em falta
  const configConfig = {
    headers: {
      Authorization: `Bearer ${token || localStorage.getItem('pt_api_token')}`
    }
  };

  // 1. Enviar código de verificação para o e-mail atual do utilizador
  const solicitarCodigo2FA = async () => {
    try {
      setLoadingCodigo(true);
      setMensagem({ tipo: '', texto: '' });

      // 🔥 CORRIGIDO: Passamos explicitamente o cabeçalho de autenticação como 2º parâmetro no POST (ou 3º se houvesse body, como não há body, passamos um objeto vazio ou a config direta dependendo da assinatura, para POST sem body passamos assim:)
      await axios.post(
        'http://localhost:5000/api/auth/perfil/solicitar-codigo', 
        {}, // Body vazio
        configConfig // Cabeçalhos com o Token JWT
      );
      
      setCodigoEnviado(true);
      setMensagem({ tipo: 'sucesso', texto: 'Código de segurança enviado para o teu e-mail!' });
    } catch (error) {
      console.error(error);
      const erroMsg = error.response?.data?.error || 'Erro ao solicitar código de verificação.';
      setMensagem({ tipo: 'erro', texto: erroMsg });
    } finally {
      setLoadingCodigo(false);
    }
  };

  // 2. Submeter formulário completo de atualização
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem({ tipo: '', texto: '' });

    // Validações básicas de segurança no lado do cliente
    if (!nome.trim() || !email.trim()) {
      return setMensagem({ tipo: 'erro', texto: 'O nome e o e-mail são campos obrigatórios.' });
    }

    const alterouEmail = email.toLowerCase().trim() !== user?.email;
    const alterouPassword = !!password;

    if (alterouPassword) {
      if (password.length < 6) {
        return setMensagem({ tipo: 'erro', texto: 'A nova palavra-passe deve ter pelo menos 6 caracteres.' });
      }
      if (password !== confirmPassword) {
        return setMensagem({ tipo: 'erro', texto: 'As palavras-passe introduzidas não coincidem.' });
      }
    }

    // Se mudou e-mail ou senha, exige o token de validação
    if ((alterouEmail || alterouPassword) && !codigoVerificacao.trim()) {
      return setMensagem({ tipo: 'erro', texto: 'Introduz o código de 6 dígitos enviado para o teu e-mail.' });
    }

    try {
      setLoadingSubmit(true);

      // 🔥 CORRIGIDO: Injetamos explicitamente a configuração com o Token como 3º parâmetro no PUT
      const response = await axios.put(
        'http://localhost:5000/api/auth/perfil/atualizar', 
        {
          nome,
          email,
          password: password || undefined,
          codigo: codigoVerificacao || undefined
        },
        configConfig
      );

      // SUCESSO: Atualiza o estado global e o localStorage
      updateUserProps(response.data.user);

      // Limpar campos confidenciais do formulário
      setPassword('');
      setConfirmPassword('');
      setCodigoVerificacao('');
      setCodigoEnviado(false);

      setMensagem({ tipo: 'sucesso', texto: 'Perfil e credenciais atualizados com sucesso!' });
    } catch (error) {
      console.error(error);
      const erroMsg = error.response?.data?.error || 'Erro ao atualizar dados do perfil.';
      setMensagem({ tipo: 'erro', texto: erroMsg });
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="max-w-2xl px-4 py-8 mx-auto">
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">O meu Perfil</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Gere os teus dados pessoais, credenciais de acesso e segurança da tua conta.
        </p>
      </div>

      {/* Alerta de Redirecionamento Forçado */}
      {user?.mustChangePassword && (
        <div className="flex items-start gap-3 p-4 mb-6 text-xs border rounded-xl md:text-sm bg-amber-500/10 border-amber-500/20 text-amber-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-bold">Aviso de Segurança</p>
            <p className="mt-0.5 opacity-90">
              Esta é uma conta criada recentemente com uma palavra-passe temporária. Para aceder às restantes funcionalidades do painel, deves atualizar os teus dados e definir uma palavra-passe definitiva.
            </p>
          </div>
        </div>
      )}

      {/* Feedbacks de Operação */}
      {mensagem.texto && (
        <div className={`mb-6 p-4 rounded-xl text-sm border font-medium ${
          mensagem.tipo === 'sucesso' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {mensagem.texto}
        </div>
      )}

      {/* Formulário Principal */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6 border bg-neutral-900 border-neutral-800 rounded-2xl">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Nome */}
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Nome Completo</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          {/* E-mail */}
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider uppercase text-neutral-400">Endereço de E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
        </div>

        <hr className="border-neutral-800" />

        {/* Secção de Alteração de Password */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold tracking-wider uppercase text-neutral-300">Alterar Palavra-Passe</h3>
          <p className="text-xs text-neutral-500">Deixe estes campos em branco caso pretenda manter a sua palavra-passe atual.</p>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-400">Nova Palavra-Passe</label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-400">Confirmar Nova Palavra-Passe</label>
              <input
                type="password"
                placeholder="Repete a palavra-passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Bloco Dinâmico: Campo de Código 2FA */}
        {(email.toLowerCase().trim() !== user?.email || !!password) && (
          <div className="pt-4 space-y-3 border-t border-neutral-800">
            <label className="block text-xs font-bold tracking-wider uppercase text-amber-500">
              🔒 Verificação de Identidade Obrigatória
            </label>
            <p className="text-xs text-neutral-400">
              Está a alterar dados críticos de segurança. Clique em solicitar código para receber um token de 6 dígitos no seu e-mail corporativo atual.
            </p>
            
            <div className="flex max-w-md gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Código de 6 dígitos"
                  value={codigoVerificacao}
                  onChange={(e) => setCodigoVerificacao(e.target.value)}
                  disabled={!codigoEnviado}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-center font-mono text-base tracking-widest text-white focus:outline-none focus:border-red-500 transition-colors disabled:opacity-40"
                />
              </div>
              <button
                type="button"
                onClick={solicitarCodigo2FA}
                disabled={loadingCodigo}
                className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold rounded-xl transition-colors text-white disabled:opacity-50 cursor-pointer h-[42px]"
              >
                {loadingCodigo ? 'A enviar...' : codigoEnviado ? 'Reenviar Código' : 'Solicitar Código'}
              </button>
            </div>
          </div>
        )}

        {/* Botão de Submissão */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loadingSubmit}
            className="w-full px-4 py-3 text-sm font-bold tracking-wider text-white uppercase transition-colors bg-red-600 shadow-lg cursor-pointer hover:bg-red-700 rounded-xl shadow-red-600/10 disabled:opacity-50"
          >
            {loadingSubmit ? 'A guardar alterações...' : 'Confirmar e Guardar Perfil'}
          </button>
        </div>
      </form>
    </div>
  );
}