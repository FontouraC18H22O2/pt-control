const whatsappService = {
  /**
   * Gera o link direto do WhatsApp com uma mensagem profissional estruturada.
   */
  enviarPlanoTreino: (phoneNumber, studentName, exercises, generalNotes) => {
    if (!phoneNumber) return null;

    let cleanNumber = phoneNumber.replace(/\D/g, '');
    
    if (!cleanNumber.startsWith('351') && cleanNumber.startsWith('9')) {
      cleanNumber = '351' + cleanNumber;
    }

    // Construir a mensagem com caracteres e emojis universais compatíveis
    let mensagem = `*OLÁ, ${studentName.toUpperCase()}!* \n\n`;
    mensagem += `O teu *Plano de Treino* já está disponível! Aqui está a tua rotina de exercícios:\n\n`;

    if (generalNotes) {
      mensagem += ` *Nota do PT:* _${generalNotes}_\n\n`;
    }

    mensagem += `*FICHA DE TREINO:*\n`;
    mensagem += `------------------------------------\n`; // Substituído o travessão grosso por hífen duplo (evita erros de encoding)

    if (exercises && exercises.length > 0) {
      exercises.forEach((ex, idx) => {
        mensagem += `🔹 *${ex.exerciseName}*\n`; // Usar um marcador universal limpo
        mensagem += `   •  ${ex.sets} Séries x ${ex.reps} Reps\n`;
        mensagem += `   •  Descanso: ${ex.restTime}\n`;
        if (ex.notes) {
          mensagem += `   •  _Nota: ${ex.notes}_\n`;
        }
        mensagem += `\n`;
      });
    } else {
      mensagem += `Nenhum exercício registado de momento.\n\n`;
    }

    mensagem += `------------------------------------\n`;
    mensagem += ` Dá o teu máximo no próximo treino! Qualquer dúvida, avisa-me por aqui.\n`;
    mensagem += ` _Bons treinos!_`;

    // Forçar a codificação segura para URL
    const encodedMessage = encodeURIComponent(mensagem);

    return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
  }
};

export default whatsappService;