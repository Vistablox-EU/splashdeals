import { GlassCard } from "@/components/ui/GlassCard";
import { Icon } from "@/components/ui/Icon";
interface Step {
  title: string;
  content: string;
  icon: string;
  color: string;
  bg: string;
}

interface HowItWorksStepsProps {
  steps: Step[];
}

export function HowItWorksSteps({ steps }: HowItWorksStepsProps) {
  return (
    <div className="grid gap-8 mb-20">
      {steps.map((step, idx) => (
        <div
          key={idx}
          className="transition-all duration-700"
        >
          <GlassCard className="p-8 sm:p-12 border-white/5 flex flex-col sm:flex-row gap-8 items-start relative overflow-hidden group">
            <div className={`p-6 rounded-2xl ${step.bg} ${step.color} shrink-0 group-hover:scale-110 transition-transform duration-500`}>
              <Icon name={step.icon} className="text-[40px]" />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-3xl font-black uppercase italic tracking-tight text-white">
                {step.title}
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed max-w-xl">
                {step.content}
              </p>
            </div>

            {/* Background Decor */}
            <div className={`absolute -right-8 -bottom-8 h-32 w-32 rounded-full ${step.bg} blur-3xl opacity-20`} />
          </GlassCard>
        </div>
      ))}
    </div>
  );
}
