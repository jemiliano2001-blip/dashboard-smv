import { memo } from 'react'

/**
 * Skeleton loader for OrderTable
 */
function SkeletonTableComponent() {
  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 h-full flex flex-col animate-pulse">
      <div className="mb-4 space-y-3">
        <div className="h-10 bg-slate-700 rounded-lg" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-slate-700 rounded-lg" />
          ))}
        </div>
        <div className="h-5 bg-slate-700 rounded w-32" />
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-slate-700">
            <tr>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <th key={i} className="px-4 py-3">
                  <div className="h-4 bg-slate-600 rounded w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
              <tr key={row}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((col) => (
                  <td key={col} className="px-4 py-3">
                    <div className="h-4 bg-slate-700 rounded w-24" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export const SkeletonTable = memo(SkeletonTableComponent)
