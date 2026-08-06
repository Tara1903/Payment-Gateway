export function TimelineSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="w-8 h-8 rounded-full skeleton flex-shrink-0" />
          <div className="flex-1 pt-1">
            <div className="skeleton h-4 w-32 mb-2 rounded" />
            <div className="skeleton h-3 w-48 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
