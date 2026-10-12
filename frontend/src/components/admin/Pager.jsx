export default function Pager({ page, pages, setPage }) {
  if (pages <= 1) return null;
  return (
    <div className="flex justify-between items-center mt-6 text-sm">
      <button type="button" className="btn-outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
        Previous
      </button>
      <span className="text-gray-500">Page {page} of {pages}</span>
      <button type="button" className="btn-outline" disabled={page === pages} onClick={() => setPage(page + 1)}>
        Next
      </button>
    </div>
  );
}
