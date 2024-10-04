import React from 'react';

export function Slider({ ...props }) {
  return (
    <input
      type="range"
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      {...props}
    />
  );
}