import { useState } from 'react';
import { Pagination } from '@/kvant';

export default function PaginationMobile() {
  const [page, setPage] = useState(5);
  return <Pagination variant="mobile" page={page} pageCount={25} onPageChange={setPage} className="w-full max-w-sm" />;
}
