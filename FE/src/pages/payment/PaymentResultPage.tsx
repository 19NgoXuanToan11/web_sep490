import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Smartphone, Package } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'

const PaymentResultPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [countdown, setCountdown] = useState(3)

  const success = searchParams.get('success') === 'true'
  const orderId = searchParams.get('orderId')
  const amount = searchParams.get('amount')
  const code = searchParams.get('code')

  const createDeepLink = () => {
    const params = new URLSearchParams()
    params.append('success', success.toString())
    if (orderId) params.append('orderId', orderId)
    if (amount) params.append('amount', amount)
    if (code) params.append('code', code)

    const links = {
      custom: `ifms://payment-callback?${params.toString()}`,
      expoDev: `exp://192.168.1.100:8081/--/payment-callback?${params.toString()}`,
      expoLocal: `exp://127.0.0.1:19000/--/payment-callback?${params.toString()}`,
      universal: `https://web-sep490.vercel.app/mobile-redirect/payment-callback?${params.toString()}`
    }

    return links
  }

  const deeplinks = createDeepLink()

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {

      tryOpenMultipleDeepLinks(deeplinks)
    }
  }, [countdown, deeplinks])

  const tryOpenMultipleDeepLinks = (links: any) => {

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

    const trySequentially = async () => {
      const urlsToTry = isMobile
        ? [links.expoDev, links.expoLocal, links.custom, links.universal]
        : [links.custom, links.expoDev, links.expoLocal, links.universal]

      for (let i = 0; i < urlsToTry.length; i++) {
        const url = urlsToTry[i]

        try {
          if (isMobile) {

            window.location.href = url

            break
          } else {

            const iframe = document.createElement('iframe')
            iframe.style.display = 'none'
            iframe.src = url
            document.body.appendChild(iframe)

            setTimeout(() => {
              try {
                document.body.removeChild(iframe)
              } catch (e) {
              }
            }, 1000)
          }
        } catch (e) {
        }

        if (i < urlsToTry.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }

    trySequentially()

    // setTimeout(() => {
    //   setShowAppInstructions(true)
    // }, 5000)
  }

  const handleOpenApp = () => {
    tryOpenMultipleDeepLinks(deeplinks)
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
          { }
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

          { }
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

          { }
          <div className="space-y-3">
            <Button
              onClick={handleOpenApp}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <Smartphone className="w-5 h-5 mr-2" />
              Mở ứng dụng IOTFarm
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

export default PaymentResultPage
