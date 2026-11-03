import { NordaFooter } from './full';

export default function SiteFooterPhone() {
  // 375 wide like the phone: the footer reads its own width, so the columns fold into the accordion here too.
  return (
    <div className="w-[375px] max-w-full overflow-hidden rounded-4xl bg-background shadow-[0_0_0_1px_var(--color-hairline)]">
      <NordaFooter />
    </div>
  );
}
