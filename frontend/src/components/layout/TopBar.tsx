import { Link } from 'react-router-dom'

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-outline-variant bg-surface/80 px-lg backdrop-blur-md">
      <div className="flex items-center gap-4 lg:hidden">
        <span className="material-symbols-outlined text-primary-container">account_balance</span>
        <span className="font-headline-sm text-headline-sm text-on-surface">SplitMate</span>
      </div>
      
      <div className="hidden lg:block">
        <SearchBar />
      </div>
      
      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-2 hover:bg-surface-container-high">
          <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
        </button>
        <Link to="/profile">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-outline-variant font-label-md text-label-md text-on-surface-variant">
            A
          </div>
        </Link>
      </div>
    </header>
  )
}

function SearchBar() {
  return (
    <div className="relative w-80">
      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
        search
      </span>
      <input
        type="search"
        placeholder="Search..."
        className="h-10 w-full rounded-md border border-outline bg-surface-container-low pl-12 pr-4 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-2 focus:border-primary focus:outline-none"
      />
    </div>
  )
}
