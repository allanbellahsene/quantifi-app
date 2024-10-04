import React from 'react';

export function Select({ className, ...props }) {
  return (
    <select
      className={`block w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${className}`}
      {...props}
    />
  );
}