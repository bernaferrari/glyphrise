export function ExportFormatDetails() {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-left text-[11px]">
        <caption className="bg-muted/35 px-3 py-2 text-left font-semibold text-foreground">
          Export fidelity
        </caption>
        <thead className="border-t border-border bg-muted/20 text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Output</th>
            <th className="px-2 py-2 font-medium">Motion</th>
            <th className="px-2 py-2 font-medium">Materials</th>
            <th className="px-2 py-2 font-medium">Editable</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border text-foreground">
          <tr>
            <td className="px-3 py-2 font-medium">PNG</td>
            <td className="px-2 py-2">Still</td>
            <td className="px-2 py-2">Exact render</td>
            <td className="px-2 py-2">No</td>
          </tr>
          <tr>
            <td className="px-3 py-2 font-medium">Video</td>
            <td className="px-2 py-2">Full timeline</td>
            <td className="px-2 py-2">Exact render</td>
            <td className="px-2 py-2">No</td>
          </tr>
          <tr>
            <td className="px-3 py-2 font-medium">GLB</td>
            <td className="px-2 py-2">Subset</td>
            <td className="px-2 py-2">Compatible PBR</td>
            <td className="px-2 py-2">Yes</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
