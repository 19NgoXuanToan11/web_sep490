import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { CheckCircle2, XCircle } from 'lucide-react'

/**
 * Demo page để test giao diện Payment Result
 * Không cần thanh toán thật
 */
const PaymentResultDemo: React.FC = () => {
  const navigate = useNavigate()

  const demoScenarios = [
    {
      title: 'Thanh toán thành công',
      icon: <CheckCircle2 className="w-6 h-6 text-green-600" />,
      url: '/payment-result?success=true&orderId=61&amount=500000&code=00&message=Payment%20Success',
      color: 'green',
    },
    {
      title: 'Thanh toán thất bại',
      icon: <XCircle className="w-6 h-6 text-red-600" />,
      url: '/payment-result?success=false&orderId=62&amount=300000&code=24&message=Payment%20Failed',
      color: 'red',
    },
    {
      title: 'Không đủ số dư',
      icon: <XCircle className="w-6 h-6 text-red-600" />,
      url: '/payment-result?success=false&orderId=63&amount=1000000&code=51&message=Insufficient%20Balance',
      color: 'red',
    },
    {
      title: 'Hủy giao dịch',
      icon: <XCircle className="w-6 h-6 text-orange-600" />,
      url: '/payment-result?success=false&orderId=64&amount=200000&code=24&message=Transaction%20Cancelled',
      color: 'orange',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          🧪 Demo Payment Result
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Test giao diện kết quả thanh toán mà không cần thanh toán thật
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {demoScenarios.map((scenario, index) => (
            <Card
              key={index}
              className="p-6 hover:shadow-xl transition-all cursor-pointer border-2 hover:border-blue-500"
              onClick={() => navigate(scenario.url)}
            >
              <div className="flex items-center gap-4 mb-4">
                {scenario.icon}
                <h3 className="text-xl font-semibold">{scenario.title}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Click để xem màn hình kết quả
              </p>
              <code className="text-xs bg-gray-100 p-2 rounded block overflow-x-auto">
                {scenario.url}
              </code>
            </Card>
          ))}
        </div>

        <Card className="p-6 bg-blue-50 border-blue-200">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            📝 Hướng dẫn sử dụng
          </h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✅ Click vào bất kỳ card nào để xem giao diện kết quả</li>
            <li>✅ Giao diện sẽ tự động thử mở mobile app sau 3 giây</li>
            <li>✅ Nếu không có app, bạn vẫn xem được giao diện web</li>
            <li>
              ✅ Các tham số URL:
              <ul className="ml-6 mt-2 space-y-1">
                <li><code>success</code>: true/false (thành công/thất bại)</li>
                <li><code>orderId</code>: Mã đơn hàng</li>
                <li><code>amount</code>: Số tiền (VND)</li>
                <li><code>code</code>: Mã response VNPay</li>
                <li><code>message</code>: Thông điệp (tùy chọn)</li>
              </ul>
            </li>
          </ul>
        </Card>

        <div className="mt-8 text-center">
          <Button onClick={() => navigate('/')} variant="outline" size="lg">
            ← Quay về trang chủ
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PaymentResultDemo

