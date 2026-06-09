import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import weightService from "../services/weightService";

export default function WeightModal({
  isOpen,
  onClose,
  studentId,
  exerciseName,
}) {
  const [history, setHistory] = useState([]);
  const [weight, setWeight] = useState("");
  const [repsDone, setRepsDone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && studentId && exerciseName) {
      carregarHistorico();
    }
  }, [isOpen, studentId, exerciseName]);

  const carregarHistorico = async () => {
    try {
      setLoading(true);
      setError("");
      const dados = await weightService.getWeightHistory(
        studentId,
        exerciseName,
      );
      setHistory(dados);
    } catch (err) {
      setError("Falha ao carregar a linha temporal de cargas.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!weight || isNaN(weight)) return;

    try {
      setLoading(true);
      await weightService.logWeight({
        studentId,
        exerciseName,
        weight: parseFloat(weight),
        repsDone: repsDone ? parseInt(repsDone) : null,
      });

      setWeight("");
      setRepsDone("");
      await carregarHistorico(); // Atualiza o gráfico e a lista na hora
    } catch (err) {
      setError("Não foi possível registar a nova carga.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // 🔄 SOLUÇÃO DO BUG: Inverter os dados apenas para o gráfico desenhar cronologicamente
  // Isto faz com que a Tooltip do Recharts detete as bolinhas individualmente sem congelar!
  const chartData = [...history].reverse();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg overflow-hidden border shadow-2xl bg-neutral-900 border-neutral-800 rounded-2xl">
        {/* Cabeçalho */}
        <div className="p-5 border-b bg-neutral-950/40 border-neutral-800/60">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black tracking-wide text-white uppercase">
                Evolução de Cargas
              </h3>
              <p className="text-xs text-neutral-400 font-medium mt-0.5">
                {exerciseName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-lg transition-colors cursor-pointer text-neutral-500 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Corpo do Modal */}
        <div className="p-5 space-y-6">
          {/* Gráfico de Evolução (Apenas renderiza se houver histórico) */}
          {history.length > 0 && (
            <div className="h-[180px] bg-neutral-950/50 p-2 rounded-xl border border-neutral-800/30">
              <ResponsiveContainer width="100%" height="100%">
                {/* 📊 Alimentado com os dados corrigidos cronologicamente */}
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis
                    dataKey="createdAt"
                    tickFormatter={(tick) =>
                      new Date(tick).toLocaleDateString("pt-PT", {
                        day: "2-digit",
                        month: "2-digit",
                      })
                    }
                    stroke="#525252"
                    style={{ fontSize: "10px", fontFamily: "monospace" }}
                  />
                  <YAxis
                    stroke="#525252"
                    style={{ fontSize: "10px", fontFamily: "monospace" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#171717",
                      borderColor: "#262626",
                      borderRadius: "12px",
                    }}
                    labelStyle={{ color: "#a3a3a3", fontSize: "11px" }}
                    itemStyle={{
                      color: "#ffffff",
                      fontSize: "13px",
                      fontWeight: "bold",
                    }}
                    labelFormatter={(label) =>
                      new Date(label).toLocaleDateString("pt-PT")
                    }
                    formatter={(value, name, props) => {
                      const reps = props.payload.repsDone;
                      const textoReps = reps ? ` (${reps} reps)` : "";
                      return [`${value} kg${textoReps}`, "Registo"];
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#dc2626"
                    strokeWidth={3}
                    activeDot={{ r: 6, stroke: "#171717", strokeWidth: 2 }}
                    dot={{ r: 4, strokeWidth: 1 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Formuário de Registo Prático */}
          <form
            onSubmit={handleSubmit}
            className="grid items-end grid-cols-3 gap-3"
          >
            <div className="space-y-1.5 col-span-1">
              <label className="text-[11px] font-semibold tracking-wider uppercase text-neutral-400">
                Carga (kg)
              </label>
              <input
                type="number"
                step="0.5"
                placeholder="0.0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-3 py-2.5 text-sm text-white transition-colors border outline-none bg-neutral-950 border-neutral-800 rounded-xl focus:border-red-600 focus:ring-1 focus:ring-red-600"
                required
              />
            </div>

            <div className="space-y-1.5 col-span-1">
              <label className="text-[11px] font-semibold tracking-wider uppercase text-neutral-400">
                Reps Executadas
              </label>
              <input
                type="number"
                placeholder="Ex: 10"
                value={repsDone}
                onChange={(e) => setRepsDone(e.target.value)}
                className="w-full px-3 py-2.5 text-sm text-white transition-colors border outline-none bg-neutral-950 border-neutral-800 rounded-xl focus:border-red-600 focus:ring-1 focus:ring-red-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 text-sm font-bold transition-all cursor-pointer bg-fitnessGym text-white rounded-xl hover:bg-red-700 shadow-lg shadow-red-500/20 disabled:opacity-40 col-span-1 h-[42px]"
            >
              {loading ? "..." : "Gravar"}
            </button>
          </form>

          {error && (
            <p className="text-xs font-semibold text-center text-red-500">
              {error}
            </p>
          )}

          {/* Lista Histórica */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold tracking-wider uppercase text-neutral-400">
              Registos Anteriores
            </h4>
            <div className="max-h-[140px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {loading && history.length === 0 ? (
                <div className="py-4 text-xs text-center text-neutral-500">
                  🔄 A ler base de dados...
                </div>
              ) : history.length > 0 ? (
                history.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 text-sm border rounded-xl bg-neutral-950 border-neutral-800/40"
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-base font-bold text-white">
                        {log.weight} kg
                      </span>
                      {log.repsDone && (
                        <span className="font-mono text-xs text-neutral-500">
                          ({log.repsDone} reps)
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-neutral-500">
                      {new Date(log.createdAt).toLocaleDateString("pt-PT")}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-4 text-xs italic text-center text-neutral-600">
                  Nenhuma carga registada para este exercício.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
