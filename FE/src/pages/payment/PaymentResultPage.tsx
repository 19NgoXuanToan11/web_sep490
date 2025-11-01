import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Smartphone, ArrowLeft, Package } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'

const PaymentResultPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(3)

  // Lấy thông tin từ URL params
  const success = searchParams.get('success') === 'true'
  const orderId = searchParams.get('orderId')
  const amount = searchParams.get('amount')
  const code = searchParams.get('code')
  const message = searchParams.get('message')

  // Tạo deeplink để mở app mobile
  const deeplink = `ifms://payment-result?success=${success}&orderId=${orderId || ''}&amount=${amount || ''}&code=${code || ''}`

  // Tự động mở app sau 3 giây
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      // Thử mở app tự động (sử dụng iframe để tránh lỗi console)
      tryOpenDeepLink(deeplink)
    }
  }, [countdown, deeplink])

  const tryOpenDeepLink = (url: string) => {
    // Cách 1: Thử mở trực tiếp (có thể hiện lỗi trong console nhưng vẫn hoạt động nếu app đã cài)
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.src = url
    document.body.appendChild(iframe)

    // Cleanup sau 2 giây
    setTimeout(() => {
      document.body.removeChild(iframe)
    }, 2000)

    // Cách 2: Fallback - thử mở bằng window.location sau 500ms
    setTimeout(() => {
      try {
        window.location.href = url
      } catch (e) {
        // Bỏ qua lỗi vì app có thể chưa được cài đặt
        console.log('Deep link không khả dụng - App chưa được cài đặt')
      }
    }, 500)
  }

  const handleOpenApp = () => {
    tryOpenDeepLink(deeplink)
  }

  const formatCurrency = (value: string | null) => {
    if (!value) return '0 ₫'
    const num = parseInt(value)
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(num)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 shadow-2xl border-0">
          {/* Icon và tiêu đề */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-block"
            >
              {success ? (
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
              ) : (
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-12 h-12 text-red-600" />
                </div>
              )}
            </motion.div>

            <h1 className={`text-2xl font-bold mb-2 ${success ? 'text-green-700' : 'text-red-700'}`}>
              {success ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
            </h1>
            <p className="text-gray-600">
              {success
                ? 'Đơn hàng của bạn đã được xử lý thành công'
                : 'Có lỗi xảy ra trong quá trình thanh toán'}
            </p>
          </div>

          {/* Thông tin đơn hàng */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
            {orderId && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Mã đơn hàng:</span>
                </div>
                <span className="font-semibold text-gray-900">#{orderId}</span>
              </div>
            )}

            {amount && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Số tiền:</span>
                <span className="font-bold text-lg text-green-600">{formatCurrency(amount)}</span>
              </div>
            )}

            {code && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Mã giao dịch:</span>
                <span className="font-mono text-xs text-gray-700 bg-white px-2 py-1 rounded">
                  {code}
                </span>
              </div>
            )}

            {message && (
              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-600">{message}</p>
              </div>
            )}
          </div>

          {/* Nút mở ứng dụng */}
          <div className="space-y-3">
            <Button
              onClick={handleOpenApp}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <Smartphone className="w-5 h-5 mr-2" />
              Mở ứng dụng IOTFarm
            </Button>

            {countdown > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-sm text-gray-500"
              >
                Tự động mở app sau <span className="font-bold text-green-600">{countdown}</span> giây...
              </motion.p>
            )}

            {/* Nút quay về trang chủ web (fallback) */}
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full py-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay về trang chủ
            </Button>
          </div>

          {/* Hướng dẫn nếu không tự động mở */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800 text-center">
              <strong>Không tự động mở app?</strong>
              <br />
              Vui lòng bấm nút "Mở ứng dụng IOTFarm" ở trên
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

export default PaymentResultPage


