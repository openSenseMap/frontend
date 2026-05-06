import { Languages } from 'lucide-react'
import { useFetcher } from 'react-router'
import { Button } from '~/components/ui/button'
import { useRootRouteLoaderData } from '~/root'

export default function LanguageSelector() {
  const { locale } = useRootRouteLoaderData()
  const fetcher = useFetcher()

  const toggleLanguage = () => {
    const newLocale = locale === 'en' ? 'de' : 'en'

    void fetcher.submit(
      { 'set-language': newLocale },
      { method: 'post', action: '/' },
    )
  }

  return (
    <div className="relative group">
      <Button
        variant="topbar"
        size="topbarPill"
        onClick={toggleLanguage}
        disabled={fetcher.state !== 'idle'}
        aria-label={`Current language: ${locale.toUpperCase()}`}
      >
        <Languages />
      </Button>

      <div className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100">
        {locale.toUpperCase()}
      </div>
    </div>
  )
}