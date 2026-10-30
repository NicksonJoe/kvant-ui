import { useLocation } from 'react-router';
import { TokenRow } from '../../components/TokenRow';
import { pluralize } from '../../lib/registry';
import { TOKEN_GROUPS, tokenAnchor, tokensOf, useTokenValues, type TokenGroupId } from '../../lib/tokens';
import type { DocPageDef } from './types';

function TokenTable({ group }: { group: TokenGroupId }) {
  const read = useTokenValues();
  const { hash } = useLocation();
  return (
    <div className="flex flex-col divide-y divide-separator overflow-hidden rounded-xl bg-surface-1 shadow-raised">
      {tokensOf(group).map((token) => {
        const anchor = tokenAnchor(token.name);
        return <TokenRow key={token.name} id={anchor} name={token.name} value={read(token.name)} target={hash === `#${anchor}`} />;
      })}
    </div>
  );
}

const count = { one: 'токен', few: 'токена', many: 'токенов' };

export const tokensPage: DocPageDef = {
  slug: 'tokens',
  title: 'Токены',
  lead: 'Все CSS-переменные Kvant с живыми значениями: они пересчитываются, когда в «Среде» меняются тема, режим, плотность или движение. Значок справа копирует var().',
  boards: ['Q80-0', 'A-0', 'RP-0', 'B-0', 'RHI-0', 'P8-0'],
  sections: TOKEN_GROUPS.map((group) => ({
    id: group.id,
    title: group.title,
    content: (
      <div className="flex flex-col gap-4">
        <p className="max-w-[72ch] text-body-sm text-fg-2">
          {group.lead} <span className="text-fg-3">{pluralize(tokensOf(group.id).length, count)}.</span>
        </p>
        <TokenTable group={group.id} />
      </div>
    ),
  })),
};
