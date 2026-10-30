import { ExternalLink } from 'lucide-react';
import { Button } from '@/kvant';
import { PAPER_BOARDS, PAPER_FILE_URL, type ComponentMeta } from '@/kvant/meta';

/** Opens the Paper file; the board name says where to look. */
export function PaperLink({ meta }: { meta: ComponentMeta }) {
  if (!meta.paperBoard) return null;
  return (
    <Button
      size="sm"
      variant="secondary"
      trailingIcon={<ExternalLink />}
      render={<a href={PAPER_FILE_URL} target="_blank" rel="noreferrer" />}
      nativeButton={false}
    >
      Доска в Paper · {PAPER_BOARDS[meta.paperBoard]}
    </Button>
  );
}
