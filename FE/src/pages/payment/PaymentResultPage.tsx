import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Smartphone, Package, ExternalLink, Download } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'

const PaymentResultPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [countdown, setCountdown] = useState(3)
  const [showAppInstructions, setShowAppInstructions] = useState(false)

  // Lấy thông tin từ URL params
  const success = searchParams.get('success') === 'true'
  const orderId = searchParams.get('orderId')
  const amount = searchParams.get('amount')
  const code = searchParams.get('code')

  // Tạo deeplink để mở app mobile
  const createDeepLink = () => {
    const params = new URLSearchParams()
    params.append('success', success.toString())
    if (orderId) params.append('orderId', orderId)
    if (amount) params.append('amount', amount)
    if (code) params.append('code', code)

    const deeplink = `ifms://payment-result?${params.toString()}`
    console.log('🔗 Generated deep link:', deeplink)
    return deeplink
  }

  const deeplink = createDeepLink()

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
    console.log('🔗 Đang thử mở deep link:', url)

    // Detect if we're on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    console.log('📱 Is mobile device:', isMobile)

    if (isMobile) {
      // Mobile strategy: Direct navigation works better
      try {
        console.log('📱 Trying direct navigation on mobile...')
        window.location.href = url
      } catch (e) {
        console.error('❌ Direct navigation failed:', e)
        // Fallback to window.open
        setTimeout(() => {
          try {
            window.open(url, '_self')
          } catch (e2) {
            console.error('❌ Window.open fallback failed:', e2)
          }
        }, 100)
      }
    } else {
      // Desktop strategy: Use iframe first, then fallbacks
      console.log('💻 Using desktop strategy...')

      // Cách 1: Thử mở bằng iframe (im lặng)
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = url
      document.body.appendChild(iframe)

      // Cleanup iframe sau 2 giây
      setTimeout(() => {
        try {
          document.body.removeChild(iframe)
          console.log('✅ Iframe cleanup thành công')
        } catch (e) {
          console.warn('⚠️ Lỗi khi cleanup iframe:', e)
        }
      }, 2000)

      // Cách 2: Fallback - thử mở bằng window.location
      setTimeout(() => {
        try {
          console.log('🔄 Đang thử fallback method với window.location')
          window.location.href = url
        } catch (e) {
          console.error('❌ Lỗi khi mở deep link:', e)
        }
      }, 500)

      // Cách 3: Thử mở trong tab mới
      setTimeout(() => {
        try {
          console.log('🔄 Đang thử mở trong tab mới')
          window.open(url, '_blank')
        } catch (e) {
          console.warn('⚠️ Không thể mở trong tab mới:', e)
        }
      }, 1000)
    }

    // Hiển thị hướng dẫn sau 3 giây nếu app chưa mở
    setTimeout(() => {
      setShowAppInstructions(true)
    }, 3000)
  }

  const handleOpenApp = () => {
    console.log('👆 Người dùng bấm nút "Mở ứng dụng IOTFarm"')
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

            {/* Hướng dẫn khi không mở được app */}
            {showAppInstructions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4"
              >
                <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Không thể mở ứng dụng?
                </h3>
                <div className="text-sm text-blue-700 space-y-2">
                  <p>• Hãy đảm bảo bạn đã cài đặt ứng dụng IOTFarm trên thiết bị di động</p>
                  <p>• Nếu chưa có ứng dụng, hãy tải về từ App Store hoặc Play Store</p>
                  <p>• Sau khi cài đặt, thử bấm lại nút "Mở ứng dụng IOTFarm" ở trên</p>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={() => window.open('https://apps.apple.com/app/ifms-farm', '_blank')}
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    iOS
                  </Button>
                  <Button
                    onClick={() => window.open('https://play.google.com/store/apps/details?id=com.ifms.farm', '_blank')}
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Android
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

export default PaymentResultPage


