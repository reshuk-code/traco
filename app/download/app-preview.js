/**
 * The app's own budget card, at the size it really renders — no device frame
 * around it. Showing the rollover maths is what explains the product.
 */
export default function AppPreview() {
  return (
    <div className="card w-full p-[18px]">
      <p className="text-xs text-muted">Spent today</p>
      <p className="mt-1 text-[2.125rem] font-bold leading-none tracking-tight tabular-nums">
        Rs 145
      </p>

      <div className="mt-3.5 h-2 w-full overflow-hidden rounded-full bg-track">
        <div className="h-full rounded-full" style={{ width: '41%', background: 'var(--good)' }} />
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-[13px] font-medium" style={{ color: 'var(--good)' }}>
          Within budget
        </span>
        <span className="text-[13px] tabular-nums text-muted">Rs 205 left</span>
      </div>

      <div className="mt-3.5 rounded-xl bg-surface-2 px-3.5 py-3">
        <div className="flex items-center justify-between tabular-nums">
          <span className="text-[13px] text-muted">Today&apos;s goal</span>
          <span className="text-[13px] font-medium">Rs 200</span>
        </div>
        <div className="mt-[7px] flex items-center justify-between tabular-nums">
          <span className="text-[13px] text-muted">Saved from before</span>
          <span className="text-[13px] font-medium" style={{ color: 'var(--good)' }}>
            + Rs 150
          </span>
        </div>
        <div className="my-2.5 h-px bg-border" />
        <div className="flex items-center justify-between tabular-nums">
          <span className="text-[13px] font-semibold">Available today</span>
          <span className="text-[15px] font-bold">Rs 350</span>
        </div>
      </div>
    </div>
  );
}
