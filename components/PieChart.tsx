import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { MacroData } from '../types';

interface Props {
  data: MacroData;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981']; // Blue, Purple, Emerald

const MacrosChart: React.FC<Props> = ({ data }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Retrasar el renderizado del gráfico un ciclo para asegurar que el contenedor
    // padre tenga dimensiones calculadas por el navegador.
    // Esto evita el error "width(-1)" en Recharts durante animaciones o carga inicial.
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const chartData = [
    { name: 'Proteína', value: data.protein },
    { name: 'Carbos', value: data.carbs },
    { name: 'Grasa', value: data.fat },
  ];

  // Renderizar un placeholder del mismo tamaño hasta que esté listo
  if (!isMounted) {
    return <div className="h-48 w-full bg-transparent" />;
  }

  return (
    <div className="h-48 w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
         <span className="text-xs text-gray-400 font-medium">Macros</span>
      </div>
    </div>
  );
};

export default MacrosChart;