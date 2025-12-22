export const CLOUDINARY = {
  cloudName: 'dlfitbaqd',
  unsignedPreset: 'sep490',
  folder: 'sep490/products',

  get uploadUrl() {
    return `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`
  },
} as const

export class CloudinaryUploadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CloudinaryUploadError'
  }
}

export interface UploadImageOptions {
  file: File
  folder?: string
  onProgress?: (percent: number) => void
  signal?: AbortSignal
}

export async function uploadImageToCloudinary(options: UploadImageOptions): Promise<string> {
  const { file, folder, onProgress, signal } = options

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', CLOUDINARY.unsignedPreset)
  formData.append('folder', folder || CLOUDINARY.folder)

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    if (onProgress) {
      xhr.upload.addEventListener('progress', event => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100)
          onProgress(Math.min(100, percent))
        }
      })
    }

    if (signal) {
      if (signal.aborted) {
        xhr.abort()
        reject(new CloudinaryUploadError('Upload was aborted'))
        return
      }
      signal.addEventListener('abort', () => {
        xhr.abort()
        reject(new CloudinaryUploadError('Upload was aborted'))
      })
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText || '{}')
          if (json.secure_url) {
            resolve(json.secure_url as string)
          } else {
            reject(
              new CloudinaryUploadError(json.error?.message || 'Invalid response from Cloudinary')
            )
          }
        } catch (err) {
          reject(new CloudinaryUploadError('Invalid JSON response from Cloudinary'))
        }
      } else {
        try {
          const json = JSON.parse(xhr.responseText || '{}')
          const message =
            json.error?.message ||
            json.message ||
            `Cloudinary upload failed with status ${xhr.status}`
          reject(new CloudinaryUploadError(message))
        } catch {
          reject(new CloudinaryUploadError(`Cloudinary upload failed with status ${xhr.status}`))
        }
      }
    })

    xhr.addEventListener('error', () => {
      reject(new CloudinaryUploadError('Network error during upload'))
    })

    xhr.addEventListener('timeout', () => {
      reject(new CloudinaryUploadError('Upload timeout'))
    })

    xhr.open('POST', CLOUDINARY.uploadUrl)
    xhr.timeout = 60000 
    xhr.send(formData)
  })
}
