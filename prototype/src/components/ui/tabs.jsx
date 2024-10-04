import React from 'react';

export function Tabs({ children, ...props }) {
  return <div {...props}>{children}</div>;
}

export function TabsList({ className, ...props }) {
  return <div className={`flex border-b ${className}`} {...props} />;
}

export function TabsTrigger({ className, ...props }) {
  return (
    <button
      className={`px-4 py-2 border-b-2 border-transparent hover:border-blue-500 ${className}`}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }) {
  return <div className={`mt-4 ${className}`} {...props} />;
}