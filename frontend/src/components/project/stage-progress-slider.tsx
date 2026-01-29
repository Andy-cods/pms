'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ProjectLifecycleLabels } from '@/lib/api/projects';
import type { ProjectLifecycle } from '@/types';

interface StageProgressSliderProps {
  stage: ProjectLifecycle;
  progress: number;
  onChange: (progress: number) => void;
  disabled?: boolean;
  showLabel?: boolean;
  debounceMs?: number;
}

export function StageProgressSlider({
  stage,
  progress,
  onChange,
  disabled = false,
  showLabel = true,
  debounceMs = 500,
}: StageProgressSliderProps) {
  const [localProgress, setLocalProgress] = useState(progress);

  // Sync with external progress changes
  useEffect(() => {
    setLocalProgress(progress);
  }, [progress]);

  // Debounced onChange
  useEffect(() => {
    if (localProgress === progress) return;

    const timer = setTimeout(() => {
      onChange(localProgress);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localProgress, progress, onChange, debounceMs]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalProgress(parseInt(e.target.value, 10));
  }, []);

  // Quick set buttons
  const quickSetValues = [0, 25, 50, 75, 100];

  return (
    <div className="space-y-3">
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {ProjectLifecycleLabels[stage]} Progress
          </span>
          <span
            className={cn(
              'text-sm font-bold tabular-nums transition-colors',
              localProgress === 100
                ? 'text-[#34c759] dark:text-[#30d158]'
                : 'text-[#007aff] dark:text-[#0a84ff]'
            )}
          >
            {localProgress}%
          </span>
        </div>
      )}

      {/* Progress bar visual */}
      <div className="relative h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={cn(
            'absolute inset-y-0 left-0 transition-all duration-300 rounded-full',
            localProgress === 100
              ? 'bg-[#34c759] dark:bg-[#30d158]'
              : 'bg-[#007aff] dark:bg-[#0a84ff]'
          )}
          style={{ width: `${localProgress}%` }}
        />
      </div>

      {/* Slider input */}
      <input
        type="range"
        min="0"
        max="100"
        value={localProgress}
        onChange={handleChange}
        disabled={disabled}
        className={cn(
          'w-full h-2 bg-transparent rounded-full appearance-none cursor-pointer',
          '[&::-webkit-slider-thumb]:appearance-none',
          '[&::-webkit-slider-thumb]:w-5',
          '[&::-webkit-slider-thumb]:h-5',
          '[&::-webkit-slider-thumb]:rounded-full',
          '[&::-webkit-slider-thumb]:bg-white',
          '[&::-webkit-slider-thumb]:border-2',
          '[&::-webkit-slider-thumb]:border-[#007aff]',
          '[&::-webkit-slider-thumb]:dark:border-[#0a84ff]',
          '[&::-webkit-slider-thumb]:shadow-lg',
          '[&::-webkit-slider-thumb]:cursor-pointer',
          '[&::-webkit-slider-thumb]:transition-transform',
          '[&::-webkit-slider-thumb]:hover:scale-110',
          '[&::-webkit-slider-thumb]:active:scale-95',
          '[&::-moz-range-thumb]:w-5',
          '[&::-moz-range-thumb]:h-5',
          '[&::-moz-range-thumb]:rounded-full',
          '[&::-moz-range-thumb]:bg-white',
          '[&::-moz-range-thumb]:border-2',
          '[&::-moz-range-thumb]:border-[#007aff]',
          '[&::-moz-range-thumb]:dark:border-[#0a84ff]',
          '[&::-moz-range-thumb]:shadow-lg',
          '[&::-moz-range-thumb]:cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      />

      {/* Quick set buttons */}
      <div className="flex items-center justify-between gap-1">
        {quickSetValues.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setLocalProgress(value);
              onChange(value);
            }}
            disabled={disabled}
            className={cn(
              'flex-1 py-1.5 text-xs font-medium rounded-lg transition-all',
              localProgress === value
                ? 'bg-[#007aff] dark:bg-[#0a84ff] text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {value}%
          </button>
        ))}
      </div>
    </div>
  );
}