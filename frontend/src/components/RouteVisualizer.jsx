import React from 'react';
import { MapPin, Clock } from 'lucide-react';

export const RouteVisualizer = ({
  startLocation,
  destination,
  pickupPoint,
  departureTime,
  estimatedDuration = '35 mins',
  horizontal = false
}) => {
  if (horizontal) {
    return (
      <div className="flex items-center gap-3 w-full">
        {/* Origin */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-sm">{startLocation}</span>
        </div>

        {/* Connector */}
        <div className="flex-1 flex items-center relative px-2">
          <div className="w-full h-0.5 bg-gradient-to-r from-emerald-400 via-blue-400 to-brand-orange"></div>
          <span className="absolute left-1/2 -translate-x-1/2 -top-3.5 bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            {estimatedDuration}
          </span>
        </div>

        {/* Destination */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-3.5 h-3.5 rounded-sm border-2 border-brand-orange bg-orange-50 dark:bg-orange-950/60 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-brand-orange"></div>
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-sm">{destination}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-4">
      {/* Vertical Connecting Track */}
      <div className="absolute left-[7px] top-2 bottom-3 w-0.5 bg-gradient-to-b from-emerald-500 via-blue-400 to-orange-500"></div>

      {/* Origin Point */}
      <div className="relative flex items-start gap-3">
        <div className="absolute -left-[19px] top-1 w-3.5 h-3.5 rounded-full border-2 border-emerald-500 bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight">{startLocation}</span>
            {departureTime && (
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-800/60">
                {departureTime}
              </span>
            )}
          </div>
          {pickupPoint && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-brand-blue dark:text-blue-400 flex-shrink-0" />
              Pickup: <span className="font-medium text-slate-700 dark:text-slate-300">{pickupPoint}</span>
            </p>
          )}
        </div>
      </div>

      {/* Duration Pill in the middle */}
      <div className="relative pl-1">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
          <Clock className="w-3 h-3 text-slate-400" />
          {estimatedDuration} direct travel
        </span>
      </div>

      {/* Destination Point */}
      <div className="relative flex items-start gap-3">
        <div className="absolute -left-[19px] top-1 w-3.5 h-3.5 rounded-sm border-2 border-brand-orange bg-brand-orange flex items-center justify-center shadow-sm">
          <div className="w-1.5 h-1.5 bg-white"></div>
        </div>
        <div>
          <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight">{destination}</span>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Campus destination drop-off</p>
        </div>
      </div>
    </div>
  );
};
