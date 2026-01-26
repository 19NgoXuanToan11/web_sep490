import React from 'react'

interface HeaderProps {
    onPrev?: () => void
    onNext?: () => void
    onToday?: () => void
    label?: string
}

const Header: React.FC<HeaderProps> = ({ onPrev, onNext, onToday, label }) => {
    return (
        <div className="rbc-header-toolbar flex items-center justify-between mb-4 p-2 bg-gray-100 rounded">
            <div className="flex gap-2">
                <button
                    onClick={onPrev}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                    type="button"
                >
                    Trước
                </button>
                <button
                    onClick={onToday}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                    type="button"
                >
                    Hôm nay
                </button>
                <button
                    onClick={onNext}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                    type="button"
                >
                    Sau
                </button>
            </div>
            {label && <div className="font-semibold text-gray-700">{label}</div>}
            <div className="w-24" />
        </div>
    )
}

export default Header
