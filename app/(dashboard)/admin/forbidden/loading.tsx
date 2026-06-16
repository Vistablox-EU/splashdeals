export default function ForbiddenLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 bg-slate-950">
      <div className="animate-pulse space-y-6 flex flex-col items-center">
        <div className="size-20 rounded-full bg-slate-800/50" />
        <div className="h-10 w-64 bg-slate-800/50 rounded" />
        <div className="h-4 w-80 bg-slate-800/30 rounded" />
      </div>
    </div>
  )
}
