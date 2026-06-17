"use client";
import { Icon } from "@/components/ui/Icon";

export interface DetailedWeather {
  temperature: number;
  weathercode: number;
  windspeed: number;
  is_day: number;
}

export function SidebarWeatherWidget({ weather }: { weather: DetailedWeather | null }) {
  if (!weather) return null;

  const getWeatherDetails = (code: number) => {
    if (code === 0 || code === 1) return { icon: <Icon name="light_mode" className="w-16 h-16 text-amber-400" />, text: "Sunčano", desc: "Savršeno vreme za vodene atrakcije! Obavezno ponesite kremu za sunčanje." };
    if (code === 2 || code === 3) return { icon: <Icon name="cloud" className="w-16 h-16 text-slate-300" />, text: "Promenljivo", desc: "Toplo, idealno za one koji vole povremenu hladovinu." };
    return { icon: <Icon name="rainy" className="w-16 h-16 text-cyan-400" />, text: "Kišovito", desc: "Mogući pljuskovi. Proverite radno vreme za zatvorene bazene." };
  };

  const details = getWeatherDetails(weather.weathercode);

  return (
    <div className="glass-frost p-8 rounded-[2.5rem] border border-cyan-500/10 bg-cyan-500/5 relative overflow-hidden group">
      <div className="absolute -top-4 -right-4 opacity-10 group-hover:opacity-20 transition-opacity blur-sm scale-150">
        {details.icon}
      </div>
      
      <h3 className="text-sm font-black uppercase tracking-widest text-slate-300 mb-6 flex items-center gap-2">
         Vremenska Prognoza
      </h3>

      <div className="flex items-center gap-4 mb-4 relative z-10">
         {details.icon}
         <div>
            <div className="text-4xl font-black text-white tracking-tighter">{Math.round(weather.temperature)}°C</div>
            <p className="text-[10px] uppercase font-black text-cyan-400 tracking-widest">{details.text}</p>
         </div>
      </div>
      
      <p className="text-xs text-slate-400 font-medium mb-6 leading-relaxed relative z-10">
         {details.desc}
      </p>

      <div className="grid grid-cols-2 gap-3 relative z-10">
         <div className="bg-black/20 rounded-2xl p-3 flex items-center gap-3 border border-white/5">
            <Icon name="air" className="text-[20px] text-slate-400" />
            <div className="flex flex-col">
               <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500">Vetar</span>
               <span className="text-xs font-black text-slate-300">{Math.round(weather.windspeed)} km/h</span>
            </div>
         </div>
         <div className="bg-black/20 rounded-2xl p-3 flex items-center gap-3 border border-white/5">
            <Icon name="light_mode" className="text-[20px] text-amber-400/70" />
            <div className="flex flex-col">
               <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500">UV Indeks</span>
               <span className="text-xs font-black text-slate-300">Visok</span>
            </div>
         </div>
      </div>
    </div>
  );
}
