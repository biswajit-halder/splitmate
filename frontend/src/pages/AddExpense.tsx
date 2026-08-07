import { Button, Input, Card } from '../components/ui'

export function AddExpensePage() {
  return (
    <div className="flex flex-col gap-xl">
      <div><h1 className="font-headline-lg text-headline-lg text-on-surface">Add Expense</h1><p className="font-body-md text-body-md text-on-surface-variant">Add a new expense to a group or with friends.</p></div>
      <Card><form className="flex flex-col gap-lg"><Input label="Amount" type="number" placeholder="0.00" /><Input label="Description" type="text" placeholder="What was this for?" /><Input label="Category" type="text" placeholder="e.g., Dining, Travel, Utilities" /><div className="flex flex-col gap-sm"><label className="font-label-sm text-label-sm text-on-surface-variant">Split between</label><div className="flex flex-wrap gap-sm"><span className="rounded-full bg-primary-container px-3 py-1 font-label-sm text-label-sm text-on-primary-container">You</span><span className="rounded-full bg-surface-container-high px-3 py-1 font-label-sm text-label-sm text-on-surface-variant">Sarah J.</span><span className="rounded-full bg-surface-container-high px-3 py-1 font-label-sm text-label-sm text-on-surface-variant">Mike R.</span></div></div><div className="flex gap-md"><Button type="submit" className="flex-1">Add Expense</Button><Button variant="secondary" type="button">Cancel</Button></div></form></Card>
    </div>
  )
}
