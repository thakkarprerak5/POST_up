import { ArrowUpRight, ArrowDownRight, LucideIcon } from "lucide-react";

interface InsightCardProps {
    title: string;
    value: string | number;
    trend: number;
    trendLabel: string;
    icon: LucideIcon;
}

export function InsightCard({ title, value, trend, trendLabel, icon: Icon }: InsightCardProps) {
    const isPositive = trend > 0;
    const isNegative = trend < 0;

    return (
        <div className="bg-gradient-to-br from-white via-white/95 to-white/90 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ease-in-out group border border-gray-200/30">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                    {title}
                </h3>
                <div className="flex items-center justify-center w-13 h-13 bg-gradient-to-br from-blue-50/50 to-blue-100/50 rounded-2xl shadow-md group-hover:shadow-xl group-hover:-translate-y-0.5 transition-all duration-500 ease-in-out border border-blue-200/20">
                    <Icon className="h-7 w-7 text-blue-500 group-hover:text-blue-600 transition-colors duration-500" />
                </div>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">{value}</span>
                {trend !== 0 && (
                    <span
                        className={`flex items-center text-xs font-bold ${isPositive ? "text-emerald-600" : isNegative ? "text-rose-600" : "text-slate-500"
                            }`}
                    >
                        {isPositive ? (
                            <ArrowUpRight className="h-3 w-3" />
                        ) : isNegative ? (
                            <ArrowDownRight className="h-3 w-3" />
                        ) : null}
                        {Math.abs(trend).toFixed(1)}%
                    </span>
                )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">{trendLabel}</p>
        </div>
    );
}
