import React from 'react'

type ErrorBoundaryState = {
    hasError: boolean
    message?: string
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false, message: undefined }

    private unhandledRejectionHandler = (ev: PromiseRejectionEvent) => {
        const reason: any = ev?.reason
        const msg = (reason && (reason.message || String(reason))) ?? ''
        if (/Failed to fetch dynamically imported module|Loading chunk .* failed/i.test(msg)) {
            this.setState({ hasError: true, message: msg })
        }
    }

    private errorEventHandler = (ev: ErrorEvent) => {
        const msg = ev?.message ?? ''
        if (/Failed to fetch dynamically imported module|Loading chunk .* failed/i.test(msg)) {
            this.setState({ hasError: true, message: msg })
        }
    }

    static getDerivedStateFromError(error: unknown) {
        return { hasError: true, message: error instanceof Error ? error.message : String(error) }
    }

    componentDidCatch(error: unknown, info: unknown) {
        console.error('Unhandled error captured by ErrorBoundary', error, info)
    }

    componentDidMount() {
        window.addEventListener('unhandledrejection', this.unhandledRejectionHandler as EventListener)
        window.addEventListener('error', this.errorEventHandler as EventListener)
    }

    componentWillUnmount() {
        window.removeEventListener('unhandledrejection', this.unhandledRejectionHandler as EventListener)
        window.removeEventListener('error', this.errorEventHandler as EventListener)
    }

    private async reloadAndUnregisterServiceWorkers() {
        try {
            if ('serviceWorker' in navigator) {
                const regs = await (navigator as any).serviceWorker.getRegistrations()
                if (Array.isArray(regs)) {
                    await Promise.all(regs.map((r: any) => r.unregister().catch(() => undefined)))
                }
            }
        } catch (e) {
        } finally {
            window.location.reload()
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="w-full max-w-md bg-white border rounded-lg p-6 shadow">
                        <h2 className="text-xl font-semibold mb-2">Đã xảy ra lỗi tải ứng dụng</h2>
                        <p className="text-sm text-gray-600 mb-4">
                            Ứng dụng không thể tải một phần mã (JS chunk). Thử tải lại trang để lấy phiên bản mới nhất.
                        </p>
                        {this.state.message && (
                            <pre className="text-xs text-red-600 mb-4 truncate">{this.state.message}</pre>
                        )}
                        <div className="flex gap-2">
                            <button
                                onClick={() => this.reloadAndUnregisterServiceWorkers()}
                                className="px-4 py-2 bg-blue-600 text-white rounded"
                            >
                                Tải lại trang
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 border rounded"
                            >
                                Tải lại (không unregister SW)
                            </button>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children as React.ReactNode
    }
}


