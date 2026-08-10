import { Link } from 'react-router-dom'

export function TopBar() {
  return (
    <header className="fixed top-0 w-full lg:w-main z-50 glass-panel shadow-sm">
      <div className="flex justify-between items-center h-16 px-md md:px-xxl w-full">
        <div className="lg:hidden flex items-center gap-sm">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-label-md">
            S
          </div>
          <span className="font-headline-md text-headline-md font-bold text-primary">SplitMate</span>
        </div>

        <div className="hidden md:flex items-center flex-1 max-w-md relative">
          <span className="material-symbols-outlined absolute left-4 text-on-surface-variant">search</span>
          <input
            type="text"
            placeholder="Search friends, groups, or expenses..."
            className="w-full h-12 pl-12 pr-4 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 focus:border-primary font-body-md text-body-md placeholder:text-on-surface-variant outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-md ml-auto">
          <button className="relative p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
          </button>
          <Link to="/profile">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/30 cursor-pointer bg-primary flex items-center justify-center text-on-primary font-bold text-label-md">
              A
            </div>
          </Link>
        </div>
      </div>
    </header>
  )
}

