import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Campus Circular render error', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#f7f8f6] px-5">
          <section className="max-w-lg rounded-2xl border border-rose-200 bg-white p-7 text-center shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-rose-600">
              Something went wrong
            </p>
            <h1 className="mt-3 text-2xl font-black text-slate-900">
              This campus surface could not load
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Try refreshing the page. If the problem continues, reset the demo data from the
              browser storage and reopen Campus Circular.
            </p>
          </section>
        </main>
      )
    }
    return this.props.children
  }
}
