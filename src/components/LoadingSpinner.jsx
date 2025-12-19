export default function LoadingSpinner({ size = 'md', message = '로딩 중...' }) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-14 h-14 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div 
        className={`${sizeClasses[size]} border-gold-500 border-t-transparent rounded-full animate-spin mb-3`}
      ></div>
      {message && <p className="text-gray-400">{message}</p>}
    </div>
  );
}

