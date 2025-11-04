import React, { memo, useState, useCallback } from 'react'
import { cn } from '@/shared/lib/utils'

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string
    alt: string
    fallback?: string
    className?: string
    containerClassName?: string
    showLoader?: boolean
}

export const LazyImage = memo<LazyImageProps>(({
    src,
    alt,
    fallback = '/images/placeholder.jpg',
    className,
    containerClassName,
    showLoader = true,
    ...props
}) => {
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)

    const handleLoad = useCallback(() => {
        setIsLoading(false)
    }, [])

    const handleError = useCallback(() => {
        setIsLoading(false)
        setHasError(true)
    }, [])

    return (
        <div className={cn('relative overflow-hidden', containerClassName)}>
            {isLoading && showLoader && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="animate-pulse bg-gray-200 w-full h-full" />
                </div>
            )}

            <img
                {...props}
                src={hasError ? fallback : src}
                alt={alt}
                loading="lazy"
                onLoad={handleLoad}
                onError={handleError}
                className={cn(
                    'transition-opacity duration-300',
                    isLoading ? 'opacity-0' : 'opacity-100',
                    className
                )}
            />
        </div>
    )
})

LazyImage.displayName = 'LazyImage'
