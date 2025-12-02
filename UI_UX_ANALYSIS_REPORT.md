# 📊 BÁO CÁO PHÂN TÍCH UI/UX TOÀN DIỆN
## Hệ thống quản lý nông trại - 3 Roles (Admin, Manager, Staff)

---

## 📑 MỤC LỤC

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Phân tích UI/UX từng Role](#2-phân-tích-uiux-từng-role)
   - [2.1. Admin Role](#21-admin-role)
   - [2.2. Manager Role](#22-manager-role)
   - [2.3. Staff Role](#23-staff-role)
3. [So sánh song song 3 Roles](#3-so-sánh-song-song-3-roles)
4. [Điểm khác biệt gây mất đồng bộ](#4-điểm-khác-biệt-gây-mất-đồng-bộ)
5. [Đề xuất Design Representative](#5-đề-xuất-design-representative)
6. [Đề xuất hệ thống Design chung](#6-đề-xuất-hệ-thống-design-chung)

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1. Kiến trúc kỹ thuật
- **Framework**: React + TypeScript
- **Styling**: Tailwind CSS + CSS Variables
- **UI Library**: shadcn/ui (component-based)
- **Animation**: Framer Motion
- **Icon Library**: Lucide React
- **State Management**: Zustand

### 1.2. Cấu trúc Layout
- Mỗi role có layout riêng: `AdminLayout.tsx`, `ManagerLayout.tsx`, `StaffLayout.tsx`
- Sidebar có thể thu gọn/mở rộng (collapsible)
- Header cố định (sticky) với breadcrumb navigation
- Main content area responsive

---

## 2. PHÂN TÍCH UI/UX TỪNG ROLE

### 2.1. ADMIN ROLE

#### 2.1.1. Màu sắc chủ đạo
- **Primary Color**: Blue (`blue-500`, `blue-600`, `blue-700`)
- **Accent**: Blue gradient (`from-blue-500 to-blue-600`)
- **Active State**: `bg-blue-50 text-blue-700 border-r-2 border-blue-600`
- **Icon Badge**: Blue gradient với Shield icon

#### 2.1.2. Typography
- **Heading 1**: `text-3xl font-bold text-gray-900`
- **Heading 2**: `text-xl font-bold text-gray-900`
- **Body**: `text-sm text-gray-600`
- **Description**: `text-xs text-gray-500`
- **Font Weight**: Bold (700) cho headings, Medium (500) cho labels

#### 2.1.3. Spacing & Layout
- **Container Padding**: `px-4 sm:px-6 lg:px-8 py-8`
- **Card Padding**: `p-4` hoặc `p-6`
- **Gap giữa elements**: `gap-4`, `gap-6`, `mb-6`, `mb-8`
- **Sidebar Width**: `lg:w-72` (mở rộng), `lg:w-20` (thu gọn)

#### 2.1.4. Card Design
- **Border Radius**: `rounded-lg` (8px)
- **Shadow**: `shadow-sm` (nhẹ)
- **Border**: `border border-gray-200`
- **Background**: `bg-white`
- **Hover Effect**: `hover:shadow-lg transition-shadow`

#### 2.1.5. Table Design
- **Header**: `TableHead` với `text-sm font-medium`
- **Row**: `TableRow` với hover effect
- **Cell Padding**: Default spacing
- **Border**: `border-b` giữa các rows
- **Action Buttons**: Ghost variant, icon-only

#### 2.1.6. Button Styles
- **Primary**: `bg-blue-600 hover:bg-blue-700` (không thấy trong code, suy luận)
- **Outline**: `border-gray-300 shadow-sm`
- **Ghost**: `text-gray-500 hover:text-gray-700 hover:bg-gray-100`
- **Size**: `sm`, `default`
- **Border Radius**: `rounded-lg` (8px)

#### 2.1.7. Status Badge
- Sử dụng component `Badge` từ shared UI
- Variants: `default`, `secondary`, `destructive`
- **Default Badge**: Gradient emerald (`from-emerald-500 to-emerald-600`)
- **Secondary**: Slate gradient (`from-slate-50 to-slate-100`)

#### 2.1.8. Form Elements
- **Input**: Standard shadcn/ui Input component
- **Select**: Standard Select với border
- **Label**: `text-sm font-medium`
- **Validation**: Red text cho errors

#### 2.1.9. Icon Usage
- **Size**: `h-5 w-5` (20px) cho navigation, `h-4 w-4` (16px) cho actions
- **Color**: `text-gray-400` (inactive), `text-blue-600` (active)
- **Style**: Outline icons từ Lucide React

#### 2.1.10. Sidebar Design
- **Background**: `bg-white shadow-lg border-r border-gray-200`
- **Logo Area**: Blue gradient badge với Shield icon
- **Navigation Items**: 
  - Active: `bg-blue-50 text-blue-700 border-r-2 border-blue-600`
  - Inactive: `text-gray-600 hover:bg-gray-50 hover:text-gray-900`
- **User Section**: Border-top với avatar và logout button

#### 2.1.11. Animation
- **Sidebar Toggle**: `motion.div` với `animate={{ width }}` transition 0.3s
- **Page Transitions**: Framer Motion với `initial`, `animate`, `transition`
- **Hover Effects**: `whileHover={{ scale: 1.02 }}`

#### 2.1.12. Responsive Design
- **Mobile**: Sidebar ẩn, menu button hiển thị
- **Tablet**: Sidebar có thể thu gọn
- **Desktop**: Sidebar mặc định mở rộng

---

### 2.2. MANAGER ROLE

#### 2.2.1. Màu sắc chủ đạo
- **Primary Color**: Green (`green-500`, `green-600`, `green-700`)
- **Accent**: Green gradient (`from-green-500 to-green-600`)
- **Active State**: `bg-green-50 text-green-700 border-r-2 border-green-600`
- **Icon Badge**: Green gradient với Sprout icon
- **Metric Cards**: Nhiều màu gradient (green, purple, blue, orange)

#### 2.2.2. Typography
- **Heading 1**: `text-3xl font-bold text-gray-900` với icon `h-8 w-8 text-green-600`
- **Heading 2**: `text-xl font-semibold text-gray-900` hoặc `text-2xl font-bold`
- **Body**: `text-sm text-gray-600`
- **Description**: `text-xs text-gray-500`
- **Metric Value**: `text-2xl font-bold text-gray-900`

#### 2.2.3. Spacing & Layout
- **Container Padding**: `px-4 sm:px-6 lg:px-8` (không có py-8 ở một số nơi)
- **Card Padding**: `p-4`, `p-6`
- **Gap**: `gap-6`, `gap-8`, `mb-8`
- **Section Spacing**: `mb-8` giữa các sections

#### 2.2.4. Card Design
- **Border Radius**: `rounded-lg` (8px) hoặc `border-0` (không border)
- **Shadow**: `shadow-lg` (đậm hơn Admin)
- **Border**: `border-0` (nhiều card không có border)
- **Background**: `bg-white`
- **Hover Effect**: `hover:shadow-lg transition-shadow`
- **Special**: Metric cards có gradient top border (`h-1 bg-gradient-to-r`)

#### 2.2.5. Table Design
- Tương tự Admin nhưng ít sử dụng table hơn
- Sử dụng nhiều card layout thay vì table
- Table có border rounded

#### 2.2.6. Button Styles
- **Primary**: `bg-green-600 hover:bg-green-700`
- **Outline**: `border-green-200 text-green-700 hover:bg-green-50`
- **Ghost**: Standard
- **Size**: `sm`, `default`
- **Border Radius**: `rounded-lg` (8px)

#### 2.2.7. Status Badge
- Sử dụng shared Badge component
- Nhiều variants: `default`, `secondary`, `success`, `warning`, `info`
- **Default**: Emerald gradient (giống Admin)
- **Custom**: Có thêm variants cho order status

#### 2.2.8. Form Elements
- Tương tự Admin
- Input, Select, Label giống nhau

#### 2.2.9. Icon Usage
- **Size**: `h-5 w-5`, `h-6 w-6` (lớn hơn Admin)
- **Color**: `text-green-600` cho primary icons
- **Style**: Outline với nhiều màu sắc khác nhau

#### 2.2.10. Sidebar Design
- **Background**: `bg-white shadow-lg border-r border-gray-200` (giống Admin)
- **Logo Area**: Green gradient badge với Sprout icon
- **Navigation Items**:
  - Active: `bg-green-50 text-green-700 border-r-2 border-green-600`
  - Inactive: `text-gray-600 hover:bg-gray-50 hover:text-gray-900`
- **User Section**: Giống Admin

#### 2.2.11. Animation
- **Metric Cards**: `whileHover={{ scale: 1.02, y: -2 }}`
- **Sidebar**: Giống Admin
- **Page Elements**: Framer Motion với delays

#### 2.2.12. Special Features
- **Metric Cards**: Có gradient top border với nhiều màu
- **Dashboard Widgets**: Custom components (CropGrowthStagesWidget, EnvironmentalMetricsWidget)
- **Charts**: Recharts với green color scheme
- **Weather Widget**: Card đặc biệt với nhiều metrics

---

### 2.3. STAFF ROLE

#### 2.3.1. Màu sắc chủ đạo
- **Primary Color**: Purple (`purple-500`, `purple-600`, `purple-700`)
- **Accent**: Purple gradient (`from-purple-500 to-purple-600`)
- **Active State**: `bg-purple-50 text-purple-700 border-r-2 border-purple-600`
- **Icon Badge**: Purple gradient với Cpu icon
- **Metric Cards**: Purple, blue, green, orange, red

#### 2.3.2. Typography
- **Heading 1**: `text-3xl font-bold text-gray-900` (không có icon trong một số nơi)
- **Heading 2**: `text-xl font-semibold`
- **Body**: `text-sm text-gray-600`
- **Description**: `text-xs text-gray-500`
- **Metric Value**: `text-2xl font-bold text-gray-900`

#### 2.3.3. Spacing & Layout
- **Container Padding**: `px-4 sm:px-6 lg:px-8 py-8`
- **Card Padding**: `p-4`, `p-6`
- **Gap**: `gap-6`, `gap-8`, `mb-8`
- **Section Spacing**: `mb-8`

#### 2.3.4. Card Design
- **Border Radius**: `rounded-lg` (8px) hoặc `border-0`
- **Shadow**: `shadow-lg` (đậm)
- **Border**: `border-0` (nhiều card không border)
- **Background**: `bg-white`
- **Hover Effect**: `hover:shadow-lg transition-shadow`
- **Special**: Metric cards có gradient top border (giống Manager)

#### 2.3.5. Table Design
- Sử dụng Table component nhiều hơn Manager
- **Table Header**: Standard
- **Table Row**: Hover effects
- **Action Buttons**: Dropdown menu với nhiều options

#### 2.3.6. Button Styles
- **Primary**: `bg-purple-600 hover:bg-purple-700` (suy luận)
- **Outline**: `border-purple-200 text-purple-700 hover:bg-purple-50`
- **Ghost**: Standard
- **Size**: `sm`, `default`
- **Border Radius**: `rounded-lg` (8px)

#### 2.3.7. Status Badge
- Sử dụng shared Badge component
- Variants: `default`, `secondary`, `destructive`, `success`, `warning`
- **Default**: Emerald gradient (giống Admin và Manager)
- **Custom**: Order status badges với icons

#### 2.3.8. Form Elements
- Tương tự Admin và Manager
- Input, Select, Label giống nhau

#### 2.3.9. Icon Usage
- **Size**: `h-5 w-5`, `h-4 w-4`
- **Color**: `text-purple-600` cho primary icons
- **Style**: Outline với nhiều màu

#### 2.3.10. Sidebar Design
- **Background**: `bg-white shadow-lg border-r border-gray-200` (giống Admin và Manager)
- **Logo Area**: Purple gradient badge với Cpu icon
- **Navigation Items**:
  - Active: `bg-purple-50 text-purple-700 border-r-2 border-purple-600`
  - Inactive: `text-gray-600 hover:bg-gray-50 hover:text-gray-900`
- **User Section**: Giống Admin và Manager

#### 2.3.11. Animation
- **Metric Cards**: `whileHover={{ scale: 1.02, y: -2 }}` (giống Manager)
- **Sidebar**: Giống Admin và Manager
- **Product Cards**: `whileHover={{ scale: 1.05, y: -4 }}`

#### 2.3.12. Special Features
- **Product Grid**: Horizontal scroll với product cards
- **Quick Actions**: Card với gradient buttons
- **Order Management**: Table với nhiều filters và search

---

## 3. SO SÁNH SONG SONG 3 ROLES

### 3.1. Bảng so sánh tổng quan

| Tiêu chí | Admin | Manager | Staff |
|----------|-------|---------|-------|
| **Màu chủ đạo** | Blue (`blue-500/600`) | Green (`green-500/600`) | Purple (`purple-500/600`) |
| **Phong cách chung** | Enterprise, Formal | Modern, Data-driven | Functional, Operational |
| **Độ hiện đại** | ⭐⭐⭐⭐ (4/5) | ⭐⭐⭐⭐⭐ (5/5) | ⭐⭐⭐⭐ (4/5) |
| **Tính nhất quán** | ⭐⭐⭐ (3/5) | ⭐⭐⭐⭐ (4/5) | ⭐⭐⭐ (3/5) |
| **Tính tối giản** | ⭐⭐⭐⭐ (4/5) | ⭐⭐⭐ (3/5) | ⭐⭐⭐ (3/5) |
| **Phù hợp màu xanh lá** | ❌ (Blue) | ✅ (Green) | ❌ (Purple) |
| **Enterprise-grade** | ⭐⭐⭐⭐⭐ (5/5) | ⭐⭐⭐⭐ (4/5) | ⭐⭐⭐ (3/5) |
| **Khả năng scale** | ⭐⭐⭐⭐ (4/5) | ⭐⭐⭐⭐⭐ (5/5) | ⭐⭐⭐⭐ (4/5) |
| **Component Reuse** | ⭐⭐⭐ (3/5) | ⭐⭐⭐⭐ (4/5) | ⭐⭐⭐ (3/5) |

### 3.2. So sánh chi tiết theo component

#### 3.2.1. Sidebar
| Thuộc tính | Admin | Manager | Staff |
|------------|-------|---------|-------|
| **Width (mở)** | `lg:w-72` (288px) | `lg:w-72` (288px) | `lg:w-72` (288px) |
| **Width (thu)** | `lg:w-20` (80px) | `lg:w-20` (80px) | `lg:w-20` (80px) |
| **Background** | `bg-white shadow-lg` | `bg-white shadow-lg` | `bg-white shadow-lg` |
| **Logo Icon** | Shield (Blue) | Sprout (Green) | Cpu (Purple) |
| **Active Nav** | `bg-blue-50 text-blue-700 border-r-2 border-blue-600` | `bg-green-50 text-green-700 border-r-2 border-green-600` | `bg-purple-50 text-purple-700 border-r-2 border-purple-600` |
| **Animation** | Framer Motion 0.3s | Framer Motion 0.3s | Framer Motion 0.3s |

**Kết luận**: Sidebar structure giống nhau, chỉ khác màu sắc.

#### 3.2.2. Card Design
| Thuộc tính | Admin | Manager | Staff |
|------------|-------|---------|-------|
| **Border Radius** | `rounded-lg` (8px) | `rounded-lg` (8px) hoặc `border-0` | `rounded-lg` (8px) hoặc `border-0` |
| **Shadow** | `shadow-sm` (nhẹ) | `shadow-lg` (đậm) | `shadow-lg` (đậm) |
| **Border** | `border border-gray-200` | `border-0` (nhiều card) | `border-0` (nhiều card) |
| **Padding** | `p-4`, `p-6` | `p-4`, `p-6` | `p-4`, `p-6` |
| **Special Feature** | Không | Gradient top border | Gradient top border |

**Kết luận**: Manager và Staff có card design hiện đại hơn với gradient borders.

#### 3.2.3. Button Styles
| Thuộc tính | Admin | Manager | Staff |
|------------|-------|---------|-------|
| **Primary Color** | Blue (suy luận) | `bg-green-600 hover:bg-green-700` | Purple (suy luận) |
| **Outline** | `border-gray-300` | `border-green-200 text-green-700` | `border-purple-200 text-purple-700` |
| **Border Radius** | `rounded-lg` (8px) | `rounded-lg` (8px) | `rounded-lg` (8px) |
| **Size Variants** | `sm`, `default` | `sm`, `default` | `sm`, `default` |

**Kết luận**: Button structure giống nhau, chỉ khác màu sắc.

#### 3.2.4. Typography
| Thuộc tính | Admin | Manager | Staff |
|------------|-------|---------|-------|
| **H1 Size** | `text-3xl font-bold` | `text-3xl font-bold` | `text-3xl font-bold` |
| **H2 Size** | `text-xl font-bold` | `text-xl font-semibold` hoặc `text-2xl font-bold` | `text-xl font-semibold` |
| **Body** | `text-sm text-gray-600` | `text-sm text-gray-600` | `text-sm text-gray-600` |
| **Description** | `text-xs text-gray-500` | `text-xs text-gray-500` | `text-xs text-gray-500` |

**Kết luận**: Typography gần như giống nhau, Manager có đa dạng hơn.

#### 3.2.5. Status Badge
| Thuộc tính | Admin | Manager | Staff |
|------------|-------|---------|-------|
| **Component** | Shared Badge | Shared Badge | Shared Badge |
| **Default Variant** | Emerald gradient | Emerald gradient | Emerald gradient |
| **Custom Variants** | Ít | Nhiều (order status) | Nhiều (order status) |
| **Border Radius** | `rounded-full` | `rounded-full` | `rounded-full` |

**Kết luận**: Sử dụng cùng component, Manager và Staff có nhiều variants hơn.

#### 3.2.6. Spacing & Layout
| Thuộc tính | Admin | Manager | Staff |
|------------|-------|---------|-------|
| **Container Padding** | `px-4 sm:px-6 lg:px-8 py-8` | `px-4 sm:px-6 lg:px-8` (thiếu py-8) | `px-4 sm:px-6 lg:px-8 py-8` |
| **Card Gap** | `gap-4`, `gap-6` | `gap-6`, `gap-8` | `gap-6`, `gap-8` |
| **Section Margin** | `mb-6`, `mb-8` | `mb-8` | `mb-8` |

**Kết luận**: Manager và Staff có spacing rộng rãi hơn.

---

## 4. ĐIỂM KHÁC BIỆT GÂY MẤT ĐỒNG BỘ

### 4.1. Màu sắc chủ đạo (CRITICAL)

**Vấn đề**: Mỗi role sử dụng một màu chủ đạo khác nhau
- **Admin**: Blue (`blue-500/600/700`)
- **Manager**: Green (`green-500/600/700`) ✅ Phù hợp với yêu cầu
- **Staff**: Purple (`purple-500/600/700`)

**Ảnh hưởng**: 
- Người dùng không nhận diện được brand identity thống nhất
- Không phù hợp với yêu cầu "màu xanh lá chủ đạo"
- Gây confusion khi switch giữa các roles

**Mức độ**: 🔴 **CRITICAL** - Cần thống nhất ngay

---

### 4.2. Card Design Pattern (HIGH)

**Vấn đề**: 
- **Admin**: Card có border (`border border-gray-200`) và shadow nhẹ (`shadow-sm`)
- **Manager & Staff**: Card không border (`border-0`) và shadow đậm (`shadow-lg`)
- **Manager & Staff**: Có gradient top border cho metric cards

**Ảnh hưởng**:
- Visual hierarchy không nhất quán
- Depth perception khác nhau
- Khó maintain khi cần update design

**Mức độ**: 🟠 **HIGH** - Cần thống nhất

---

### 4.3. Border Radius (MEDIUM)

**Vấn đề**: 
- Tất cả đều dùng `rounded-lg` (8px) - **ĐỒNG NHẤT** ✅
- Nhưng một số elements có thể dùng `rounded-xl` (12px) hoặc `rounded-md` (6px) tùy context

**Mức độ**: 🟡 **MEDIUM** - Cần document rõ ràng

---

### 4.4. Shadow Usage (MEDIUM)

**Vấn đề**:
- **Admin**: `shadow-sm` (nhẹ)
- **Manager & Staff**: `shadow-lg` (đậm)
- **Hover**: Tất cả đều dùng `hover:shadow-lg`

**Ảnh hưởng**:
- Depth perception không nhất quán
- Visual weight khác nhau

**Mức độ**: 🟡 **MEDIUM** - Cần thống nhất

---

### 4.5. Typography Hierarchy (LOW)

**Vấn đề**:
- **Admin**: H2 dùng `font-bold`
- **Manager**: H2 dùng `font-semibold` hoặc `font-bold` (không nhất quán)
- **Staff**: H2 dùng `font-semibold`

**Ảnh hưởng**: Nhỏ, nhưng cần thống nhất

**Mức độ**: 🟢 **LOW** - Cần document

---

### 4.6. Icon Usage (LOW)

**Vấn đề**:
- **Admin**: Icon size chủ yếu `h-5 w-5`
- **Manager**: Icon size `h-5 w-5`, `h-6 w-6`, `h-8 w-8` (đa dạng hơn)
- **Staff**: Icon size `h-5 w-5`, `h-4 w-4`

**Mức độ**: 🟢 **LOW** - Cần guideline

---

### 4.7. Button Color Scheme (HIGH)

**Vấn đề**:
- **Admin**: Outline button dùng `border-gray-300` (neutral)
- **Manager**: Outline button dùng `border-green-200 text-green-700 hover:bg-green-50`
- **Staff**: Outline button dùng `border-purple-200 text-purple-700 hover:bg-purple-50`

**Ảnh hưởng**: Visual inconsistency khi switch roles

**Mức độ**: 🟠 **HIGH** - Cần thống nhất

---

### 4.8. Container Padding (LOW)

**Vấn đề**:
- **Admin**: `px-4 sm:px-6 lg:px-8 py-8`
- **Manager**: `px-4 sm:px-6 lg:px-8` (thiếu `py-8` ở một số nơi)
- **Staff**: `px-4 sm:px-6 lg:px-8 py-8`

**Mức độ**: 🟢 **LOW** - Dễ fix

---

### 4.9. Metric Card Design (HIGH)

**Vấn đề**:
- **Admin**: Card đơn giản, không có gradient border
- **Manager & Staff**: Metric cards có gradient top border (`h-1 bg-gradient-to-r`)
- **Manager & Staff**: Có animation `whileHover={{ scale: 1.02, y: -2 }}`

**Ảnh hưởng**: Visual hierarchy và interaction pattern khác nhau

**Mức độ**: 🟠 **HIGH** - Cần quyết định pattern chung

---

### 4.10. Table Design (LOW)

**Vấn đề**: Tất cả đều dùng shared Table component - **ĐỒNG NHẤT** ✅

**Mức độ**: 🟢 **LOW** - OK

---

## 5. ĐỀ XUẤT DESIGN REPRESENTATIVE

### 5.1. Phân tích từng Role

#### 5.1.1. Admin Role
**Ưu điểm**:
- ✅ Enterprise-grade, formal, professional
- ✅ Card design đơn giản, clean
- ✅ Typography hierarchy rõ ràng
- ✅ Shadow nhẹ, không quá nổi bật

**Nhược điểm**:
- ❌ Màu Blue không phù hợp với yêu cầu "màu xanh lá"
- ❌ Card design có thể cải thiện với gradient borders
- ❌ Thiếu animation cho metric cards

**Điểm số**: 6.5/10

---

#### 5.1.2. Manager Role ⭐ **ĐỀ XUẤT**
**Ưu điểm**:
- ✅ **Màu Green phù hợp với yêu cầu "màu xanh lá chủ đạo"** 🔥
- ✅ Card design hiện đại với gradient top border
- ✅ Metric cards có animation và visual hierarchy tốt
- ✅ Dashboard widgets phong phú, data-driven
- ✅ Typography đa dạng nhưng nhất quán
- ✅ Component structure tốt, dễ scale
- ✅ Spacing rộng rãi, dễ đọc
- ✅ Icon usage đa dạng và phù hợp context

**Nhược điểm**:
- ⚠️ Shadow đậm có thể làm giảm tính tối giản
- ⚠️ Một số card không có border có thể gây confusion

**Điểm số**: 9/10

---

#### 5.1.3. Staff Role
**Ưu điểm**:
- ✅ Card design hiện đại (giống Manager)
- ✅ Metric cards có gradient và animation
- ✅ Table design tốt với nhiều filters
- ✅ Product grid layout tốt

**Nhược điểm**:
- ❌ Màu Purple không phù hợp với yêu cầu "màu xanh lá"
- ❌ Một số nơi thiếu icon trong heading
- ❌ Typography hierarchy ít đa dạng hơn Manager

**Điểm số**: 7/10

---

### 5.2. Kết luận và Đề xuất

#### 🏆 **ROLE ĐƯỢC CHỌN: MANAGER**

**Lý do chính**:

1. **✅ Phù hợp với yêu cầu màu xanh lá**
   - Manager là role duy nhất sử dụng Green làm màu chủ đạo
   - Green (`green-500/600/700`) phù hợp với theme nông nghiệp
   - Có thể dễ dàng extend sang các roles khác

2. **✅ Design hiện đại và tinh tế**
   - Metric cards với gradient top border tạo visual interest
   - Animation subtle nhưng hiệu quả
   - Shadow và spacing tạo depth tốt

3. **✅ Tính nhất quán cao**
   - Component structure rõ ràng
   - Typography hierarchy đa dạng nhưng nhất quán
   - Icon usage phù hợp context

4. **✅ Khả năng scale tốt**
   - Component abstraction tốt
   - Dễ reuse cho các roles khác
   - Code structure clean

5. **✅ Enterprise-grade nhưng không quá formal**
   - Cân bằng giữa professional và modern
   - Data visualization tốt
   - User experience tốt

6. **✅ Tính tối giản và thanh thoát**
   - Spacing rộng rãi
   - Visual hierarchy rõ ràng
   - Không quá phức tạp

---

## 6. ĐỀ XUẤT HỆ THỐNG DESIGN CHUNG

### 6.1. Design System Baseline

#### 6.1.1. Color Palette (Màu xanh lá chủ đạo)

```css
/* Primary Green (Màu chủ đạo) */
--primary-50: #f0fdf4;
--primary-100: #dcfce7;
--primary-200: #bbf7d0;
--primary-300: #86efac;
--primary-400: #4ade80;
--primary-500: #22c55e;  /* Main Primary */
--primary-600: #16a34a;  /* Main Primary Dark */
--primary-700: #15803d;  /* Hover State */
--primary-800: #166534;
--primary-900: #14532d;

/* Semantic Colors */
--success: #22c55e;
--warning: #f59e0b;
--error: #ef4444;
--info: #3b82f6;

/* Neutral Colors */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-400: #9ca3af;
--gray-500: #6b7280;
--gray-600: #4b5563;
--gray-700: #374151;
--gray-800: #1f2937;
--gray-900: #111827;
```

**Token System**:
```typescript
export const colors = {
  primary: {
    DEFAULT: 'hsl(142 70% 45%)',  // green-500
    foreground: 'hsl(0 0% 100%)',
    hover: 'hsl(142 76% 36%)',     // green-700
    50: 'hsl(142 90% 95%)',
    100: 'hsl(142 80% 90%)',
    // ... full scale
  },
  success: 'hsl(142 71% 45%)',
  warning: 'hsl(38 92% 50%)',
  error: 'hsl(0 84% 60%)',
  info: 'hsl(221 83% 53%)',
}
```

---

#### 6.1.2. Typography System

```typescript
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['Fira Code', 'monospace'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],  // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  // Usage
  h1: 'text-3xl font-bold text-gray-900',
  h2: 'text-2xl font-semibold text-gray-900',
  h3: 'text-xl font-semibold text-gray-900',
  body: 'text-sm text-gray-600',
  caption: 'text-xs text-gray-500',
}
```

---

#### 6.1.3. Spacing System

```typescript
export const spacing = {
  // Container
  container: {
    padding: 'px-4 sm:px-6 lg:px-8 py-8',
    paddingX: 'px-4 sm:px-6 lg:px-8',
    paddingY: 'py-8',
  },
  // Card
  card: {
    padding: 'p-6',
    paddingSmall: 'p-4',
    gap: 'gap-6',
  },
  // Section
  section: {
    marginBottom: 'mb-8',
    gap: 'gap-8',
  },
  // Grid
  grid: {
    gap: 'gap-6',
    gapLarge: 'gap-8',
  },
}
```

---

#### 6.1.4. Border Radius System

```typescript
export const borderRadius = {
  none: 'rounded-none',      // 0px
  sm: 'rounded-sm',          // 2px
  md: 'rounded-md',          // 6px
  lg: 'rounded-lg',          // 8px - DEFAULT
  xl: 'rounded-xl',          // 12px
  '2xl': 'rounded-2xl',      // 16px
  full: 'rounded-full',      // 9999px (badges, avatars)
}
```

**Usage**:
- **Cards**: `rounded-lg` (8px)
- **Buttons**: `rounded-lg` (8px)
- **Badges**: `rounded-full`
- **Inputs**: `rounded-md` (6px)

---

#### 6.1.5. Shadow System

```typescript
export const shadows = {
  none: 'shadow-none',
  sm: 'shadow-sm',      // Subtle - cho cards đơn giản
  md: 'shadow-md',      // Medium
  lg: 'shadow-lg',      // Strong - cho metric cards, elevated cards
  xl: 'shadow-xl',      // Extra strong
  '2xl': 'shadow-2xl',  // Maximum
}
```

**Usage**:
- **Default Cards**: `shadow-sm`
- **Metric Cards**: `shadow-lg`
- **Elevated Cards**: `shadow-lg`
- **Hover State**: `hover:shadow-lg`

---

#### 6.1.6. Component Standards

##### 6.1.6.1. Card Component

```typescript
// Standard Card
<Card className="rounded-lg border border-gray-200 bg-white shadow-sm">
  <CardContent className="p-6">
    {/* Content */}
  </CardContent>
</Card>

// Metric Card (với gradient top border)
<Card className="relative overflow-hidden border-0 shadow-lg bg-white">
  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-600" />
  <CardHeader className="pb-2">
    <CardTitle className="text-sm font-medium text-gray-600">Title</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-gray-900">Value</div>
  </CardContent>
</Card>
```

##### 6.1.6.2. Button Component

```typescript
// Primary Button
<Button className="bg-green-600 hover:bg-green-700 text-white rounded-lg">
  Action
</Button>

// Outline Button
<Button 
  variant="outline" 
  className="border-green-200 text-green-700 hover:bg-green-50 rounded-lg"
>
  Action
</Button>

// Ghost Button
<Button variant="ghost" className="text-gray-600 hover:bg-gray-50">
  Action
</Button>
```

##### 6.1.6.3. Badge Component

```typescript
// Default Badge (Green)
<Badge variant="default" className="rounded-full">
  Status
</Badge>

// Status Badges
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Error</Badge>
```

##### 6.1.6.4. Status Badge System

```typescript
export const statusBadges = {
  active: {
    variant: 'success',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  pending: {
    variant: 'warning',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  inactive: {
    variant: 'secondary',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  },
  error: {
    variant: 'error',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
}
```

---

#### 6.1.7. Sidebar Design Standard

```typescript
// Sidebar Structure
<motion.div
  className="hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col bg-white shadow-lg border-r border-gray-200"
  animate={{ width: isSidebarOpen ? 288 : 80 }}
  transition={{ duration: 0.3, ease: 'easeInOut' }}
>
  {/* Logo Area */}
  <div className="border-b border-gray-200">
    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
      <Icon className="w-6 h-6 text-white" />
    </div>
  </div>

  {/* Navigation */}
  <nav className="flex-1 px-4 py-6 space-y-1">
    <button
      className={cn(
        "w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
        isActive
          ? "bg-green-50 text-green-700 border-r-2 border-green-600"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      <Icon className="mr-3 h-5 w-5" />
      <span>Menu Item</span>
    </button>
  </nav>

  {/* User Section */}
  <div className="border-t border-gray-200 p-4">
    {/* User info & Logout */}
  </div>
</motion.div>
```

---

#### 6.1.8. Animation Standards

```typescript
export const animations = {
  // Sidebar Toggle
  sidebar: {
    duration: 0.3,
    ease: 'easeInOut',
  },
  // Card Hover
  cardHover: {
    scale: 1.02,
    y: -2,
    transition: { duration: 0.2 },
  },
  // Page Transition
  pageTransition: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
  },
  // Metric Card
  metricCard: {
    whileHover: { scale: 1.02, y: -2 },
    transition: { duration: 0.2 },
  },
}
```

---

### 6.2. Implementation Strategy

#### 6.2.1. CSS Variables (globals.css)

```css
:root {
  /* Primary Green */
  --primary: 142 70% 45%;
  --primary-foreground: 0 0% 100%;
  --primary-hover: 142 76% 36%;
  
  /* Brand (Green) */
  --brand: 142 70% 45%;
  --brand-foreground: 0 0% 100%;
  --brand-hover: 142 76% 36%;
  
  /* Success (Green) */
  --success: 142 71% 45%;
  --success-foreground: 0 0% 100%;
  
  /* Other semantic colors... */
}
```

#### 6.2.2. Tailwind Config Update

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          hover: 'hsl(var(--primary-hover))',
          // ... full scale
        },
        brand: {
          DEFAULT: 'hsl(var(--brand))',
          foreground: 'hsl(var(--brand-foreground))',
          hover: 'hsl(var(--brand-hover))',
        },
      },
    },
  },
}
```

#### 6.2.3. Component Abstraction

Tạo shared components trong `src/shared/ui/`:
- `MetricCard.tsx` - Card với gradient top border
- `StatusBadge.tsx` - Badge với variants chuẩn
- `RoleLayout.tsx` - Base layout với green theme
- `ActionButton.tsx` - Button với green variants

---

### 6.3. Migration Plan

#### Phase 1: Foundation (Week 1-2)
1. Update CSS variables với green color scheme
2. Update Tailwind config
3. Tạo shared components (MetricCard, StatusBadge, etc.)

#### Phase 2: Admin Role (Week 3)
1. Thay Blue → Green trong AdminLayout
2. Update card designs
3. Update button styles
4. Update status badges

#### Phase 3: Staff Role (Week 4)
1. Thay Purple → Green trong StaffLayout
2. Update card designs
3. Update button styles
4. Update status badges

#### Phase 4: Polish (Week 5)
1. Review và fix inconsistencies
2. Update documentation
3. Testing across all roles

---

## 7. KẾT LUẬN

### 7.1. Tóm tắt

Sau khi phân tích toàn diện 3 roles (Admin, Manager, Staff), chúng tôi xác định:

1. **Manager Role** là role phù hợp nhất để làm Design Representative vì:
   - ✅ Màu Green phù hợp với yêu cầu "màu xanh lá chủ đạo"
   - ✅ Design hiện đại, tinh tế, thanh thoát
   - ✅ Component structure tốt, dễ scale
   - ✅ Visual hierarchy rõ ràng
   - ✅ Enterprise-grade nhưng không quá formal

2. **Các điểm cần thống nhất**:
   - 🔴 CRITICAL: Màu sắc chủ đạo (Blue/Purple → Green)
   - 🟠 HIGH: Card design pattern (shadow, border)
   - 🟠 HIGH: Button color scheme
   - 🟠 HIGH: Metric card design
   - 🟡 MEDIUM: Shadow usage
   - 🟡 MEDIUM: Border radius consistency
   - 🟢 LOW: Typography hierarchy
   - 🟢 LOW: Icon usage

3. **Design System Baseline**:
   - Color: Green (`green-500/600/700`) làm primary
   - Typography: System nhất quán
   - Spacing: Standardized
   - Components: Shared components với variants

### 7.2. Next Steps

1. **Review và approve** Design Representative (Manager)
2. **Thiết lập Design System** với green color scheme
3. **Tạo shared components** theo chuẩn Manager
4. **Migration plan** cho Admin và Staff roles
5. **Documentation** cho team developers

---

**Báo cáo được tạo bởi**: AI Assistant  
**Ngày**: 2024  
**Version**: 1.0

