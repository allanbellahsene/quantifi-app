import React from 'react';

export function Card({ className, ...props }) {
  return <div className={`bg-white shadow-md rounded-lg ${className}`} {...props} />;
}

export function CardHeader({ className, ...props }) {
  return <div className={`p-4 border-b ${className}`} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={`p-4 ${className}`} {...props} />;
}