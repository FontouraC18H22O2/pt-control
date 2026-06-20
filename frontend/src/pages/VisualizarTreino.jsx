import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function VisualizarTreino() {
  const { planId } = useParams();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BACKEND_URL}/api/training/public/${planId}`);
        setPlan(response.data);
      } catch (err) {
        console.error(err);
        setError('Não foi possível carregar o seu plano de treino. Confirme o link enviado pelo seu treinador.');
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [planId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4 text-white bg-neutral-950">
        <div className="w-10 h-10 border-4 border-red-500 rounded-full border-t-transparent animate-spin"></div>
        <p className="text-sm font-medium text-neutral-400">A preparar a tua rotina de treino...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 text-white bg-neutral-950">
        <div className="w-full max-w-md p-6 text-center border border-red-900 bg-red-950/20 rounded-2xl">
          <p className="text-sm font-semibold text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 space-y-6 text-white md:p-6 bg-neutral-950">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="p-6 space-y-2 border border-neutral-800 bg-neutral-900 rounded-2xl">
          <span className="text-xs font-black tracking-widest text-red-500 uppercase">O Teu Treino</span>
          <h1 className="text-3xl font-black tracking-tight text-white">Olá, {plan?.studentName}!</h1>
          {plan?.notes && (
            <div className="pt-2 mt-2 border-t border-neutral-800">
              <p className="text-xs font-bold tracking-wider uppercase text-neutral-400">Recomendações do Treinador:</p>
              <p className="text-sm italic text-neutral-300">"{plan.notes}"</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {plan?.exercises.map((ex, index) => (
            <div 
              key={ex.id || index}
              className="flex flex-col overflow-hidden transition-colors border md:flex-row border-neutral-800 bg-neutral-900 rounded-2xl group hover:border-neutral-700"
            >
              <div className="flex items-center justify-center w-full overflow-hidden border-b md:w-64 aspect-video md:aspect-square bg-neutral-950 md:border-b-0 md:border-r border-neutral-800">
                {ex.gifUrl ? (
                  <img 
                    src={`${BACKEND_URL}${ex.gifUrl}`} 
                    alt={ex.exerciseName}
                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/600x400/171717/a3a3a3?text=Sem+Visualiza%C3%A7%C3%A3o';
                    }}
                  />
                ) : (
                  <div className="text-xs font-medium text-neutral-600">Sem imagem disponível</div>
                )}
              </div>

              <div className="flex flex-col justify-between flex-1 p-5 space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black bg-neutral-950 px-2 py-1 border border-neutral-800 rounded-md text-red-500 uppercase tracking-wider">
                    Exercício {index + 1}
                  </span>
                  <h3 className="pt-1 text-lg font-bold transition-colors text-neutral-100 group-hover:text-red-500">
                    {ex.exerciseName}
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 text-center border bg-neutral-950/60 rounded-xl border-neutral-800/50">
                  <div>
                    <span className="block text-[10px] font-bold text-neutral-500 uppercase">Séries</span>
                    <span className="text-sm font-black text-white">{ex.sets}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-neutral-500 uppercase">Reps</span>
                    <span className="text-sm font-black text-white">{ex.reps}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-neutral-500 uppercase">Descanso</span>
                    <span className="text-sm font-black text-red-400">{ex.restTime}</span>
                  </div>
                </div>

                {ex.notes && (
                  <div className="p-3 border bg-neutral-950/30 border-neutral-800/40 rounded-xl">
                    <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Nota de execução:</span>
                    <p className="text-xs italic text-neutral-300">"{ex.notes}"</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}