const SkeletonCard = () => {
  return (
    <div className="rounded border border-border bg-card p-5 space-y-3">
      <div className="flex gap-2">
        <div className="skeleton h-5 w-20" />
        <div className="skeleton h-5 w-24" />
      </div>
      <div className="skeleton h-5 w-full" />
      <div className="skeleton h-5 w-3/4" />
      <div className="skeleton h-4 w-32 mt-1" />
      <div className="skeleton h-4 w-48" />
    </div>
  );
};

export default SkeletonCard;
