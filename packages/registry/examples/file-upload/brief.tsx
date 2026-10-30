import { useState } from 'react';
import { Dropzone } from '@/kvant';

export default function FileUploadBrief() {
  const [names, setNames] = useState<string[]>([]);
  return (
    <div className="flex w-104 max-w-full flex-col gap-3">
      <Dropzone accept=".pdf,.png,.jpg" maxSize={20 * 1024 * 1024} maxFiles={10} onFiles={(accepted) => setNames(accepted.map((file) => file.name))} />
      {names.length > 0 ? <p className="text-caption text-fg-3">Принято: {names.join(', ')}</p> : null}
    </div>
  );
}
