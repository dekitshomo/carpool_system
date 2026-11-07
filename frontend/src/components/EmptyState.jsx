import React from 'react';
import { Link } from 'react-router-dom';

export const EmptyState = ({ icon: Icon, title, description, actionText, actionLink, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-brand-blue dark:text-blue-400 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8" />
        </div>
      )}
      <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">{description}</p>
      {actionText && (
        actionLink ? (
          <Link
            to={actionLink}
            className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-brand-blue to-indigo-600 text-white rounded-xl font-bold text-xs hover:from-blue-700 hover:to-indigo-700 transition shadow-md shadow-blue-500/20"
          >
            {actionText}
          </Link>
        ) : onAction ? (
          <button
            onClick={onAction}
            className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-brand-blue to-indigo-600 text-white rounded-xl font-bold text-xs hover:from-blue-700 hover:to-indigo-700 transition shadow-md shadow-blue-500/20"
          >
            {actionText}
          </button>
        ) : null
      )}
    </div>
  );
};
