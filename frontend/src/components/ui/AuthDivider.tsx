export function AuthDivider({ text = 'Or continue with' }: { text?: string }) {
  return (
    <div className="mt-lg mb-lg flex items-center text-center">
      <div className="flex-grow border-t border-outline-variant/30" />
      <span className="mx-md font-label-sm text-label-sm text-outline tracking-wide uppercase">{text}</span>
      <div className="flex-grow border-t border-outline-variant/30" />
    </div>
  )
}
