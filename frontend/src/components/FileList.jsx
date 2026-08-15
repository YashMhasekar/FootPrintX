import FileCard from "./FileCard.jsx";

export default function FileList({ files }) {
  if (!files?.length) {
    return (
      <div className="glass rounded-2xl p-6 text-slate-500 text-sm">
        No files scored yet.
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-slate-100 mb-4">
        Files ranked by decay score
      </h3>
      <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
        {files.map((file) => (
          <FileCard key={file.id} file={file} />
        ))}
      </div>
    </div>
  );
}
