'use client';

import { formatNumber, formatPercent } from '@/lib/utils';

interface FunnelStep {
  label: string;
  value: number;
  color: string;
}

export function FunnelChart({ data }: { data: FunnelStep[] }) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-3">
      {data.map((step, i) => {
        const width = Math.max((step.value / maxValue) * 100, 5);
        const conversionFromPrev =
          i > 0 && data[i - 1].value > 0
            ? (step.value / data[i - 1].value) * 100
            : null;

        return (
          <div key={step.label}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium">{step.label}</span>
              <span className="text-muted-foreground">
                {formatNumber(step.value)}
                {conversionFromPrev !== null && (
                  <span className="ml-2 text-xs">
                    ({formatPercent(conversionFromPrev)})
                  </span>
                )}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-8">
              <div
                className="h-8 rounded-full transition-all duration-500"
                style={{
                  width: `${width}%`,
                  backgroundColor: step.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
