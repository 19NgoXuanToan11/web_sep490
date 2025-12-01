import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { AlertCircle, Home } from 'lucide-react'

export function RouteErrorElement() {
    const error = useRouteError()

    let errorMessage = 'Đã xảy ra lỗi không mong muốn'
    let errorStatus = 500

    if (isRouteErrorResponse(error)) {
        errorStatus = error.status
        errorMessage = error.statusText || errorMessage
    } else if (error instanceof Error) {
        errorMessage = error.message
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <AlertCircle className="h-8 w-8 text-red-500" />
                        <CardTitle className="text-2xl">Lỗi {errorStatus}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-gray-600">{errorMessage}</p>
                    <div className="flex gap-2">
                        <Button asChild variant="outline" className="flex-1">
                            <Link to="/">
                                <Home className="mr-2 h-4 w-4" />
                                Về trang chủ
                            </Link>
                        </Button>
                        <Button
                            variant="default"
                            className="flex-1"
                            onClick={() => window.location.reload()}
                        >
                            Tải lại trang
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

