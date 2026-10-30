import { Dropzone } from '@/kvant';
import type { Playground } from '@/kvant/meta';

const playground: Playground = {
  initial: { accept: '.pdf,.png,.jpg', maxFiles: 10 },
  render: (p) => (
    <Dropzone
      accept={p.text('accept') || undefined}
      maxSize={20 * 1024 * 1024}
      maxFiles={p.num('maxFiles') || undefined}
      multiple={p.bool('multiple')}
      disabled={p.bool('disabled')}
      hint={p.text('hint') || undefined}
      onFiles={() => undefined}
      className="w-104 max-w-full"
    />
  ),
  code: (p) => `<Dropzone${p.attrs(['accept', 'maxFiles', 'multiple', 'disabled', 'hint'])}
  maxSize={20 * 1024 * 1024}
  onFiles={(accepted) => setFiles(accepted)}
/>`,
};

export default playground;
